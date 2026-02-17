/**
 * functions/src/services/blogRenderService.ts
 *
 * Purpose: Generate and manage pre-rendered HTML for blog posts.
 * Handles publish (generate HTML to Storage), unpublish (remove HTML), and serving.
 *
 * Architecture:
 * - Firestore trigger: On blogPosts status change → generate/remove HTML
 * - Storage paths: blog-render/{lang}/blog/{slug}/index.html
 * - Manifest: blogRenders/{postId} tracks generated paths for cleanup
 *
 * Changelog:
 * v1.2.0 - 2026-02-11 - BEP CRITICAL FIX: Added safeToDate() helper to handle mixed date formats.
 *                       Prevents 'toDate is not a function' crash during HTML generation when
 *                       publishedAt/updatedAt aren't native Firestore Timestamps.
 * v1.1.0 - 2026-02-07 - Added on-the-fly rendering fallback for posts without pre-rendered HTML
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 4 Blog)
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket();

// Types
interface CoverImage {
  url?: string;
  alt?: string;
}

interface LanguageContent {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: CoverImage;
}

interface BlogPost {
  id: string;
  status: string;
  category?: string;
  tags?: string[];
  languages: Record<string, LanguageContent>;
  publishedAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  authorName?: string;
  readingTimeMinutes?: number;
}

interface RenderManifest {
  postId: string;
  paths: string[];
  renderedAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// Constants
const BLOG_RENDERS_COLLECTION = "blogRenders";
const SITE_URL = "https://time2.trade";
const SUPPORTED_LANGUAGES = ["en", "es", "fr"];

// Default blog thumbnails for posts without cover images
const DEFAULT_BLOG_THUMBNAILS = [
  "/blog/Blog_Default_Thumbnail_1.png",
  "/blog/Blog_Default_Thumbnail_2.png",
  "/blog/Blog_Default_Thumbnail_3.png",
];

/**
 * Safely convert a Firestore field to a JS Date.
 * Handles: Firestore Timestamp (.toDate()), Date object, ISO string,
 * epoch number (ms), serialized Timestamp ({_seconds}), or null/undefined.
 * Returns fallback (default: current date) if conversion fails.
 */
const safeToDate = (
  value: unknown,
  fallback: Date = new Date()
): Date => {
  if (!value) return fallback;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : d;
  }
  if (typeof value === "number") return new Date(value);
  if (typeof value === "object" && "_seconds" in (value as Record<string, unknown>)) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return fallback;
};

/**
 * Get a consistent default thumbnail URL for a post based on ID
 * Uses post ID to deterministically select from 3 options
 */
const getDefaultBlogThumbnail = (postId: string): string => {
  if (!postId) return DEFAULT_BLOG_THUMBNAILS[0];
  const hash = postId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % DEFAULT_BLOG_THUMBNAILS.length;
  return `${SITE_URL}${DEFAULT_BLOG_THUMBNAILS[index]}`;
};

/**
 * Generate HTML template for a blog post
 * BEP: Includes all SEO meta tags, structured data, and theme-aware styling
 */
const generateBlogHtml = (
  post: BlogPost,
  lang: string,
  content: LanguageContent
): string => {
  const title = content.seoTitle || content.title;
  const description = content.seoDescription || content.excerpt;
  const slug = content.slug;
  const langPrefix = lang !== "en" ? `/${lang}` : "";
  const canonicalUrl = `${SITE_URL}${langPrefix}/blog/${slug}`;
  const ogImage = content.coverImage?.url || getDefaultBlogThumbnail(post.id);

  // Format dates
  const publishedDate = safeToDate(post.publishedAt);
  const modifiedDate = safeToDate(post.updatedAt, publishedDate);

  // Generate hreflang links
  const hreflangLinks = SUPPORTED_LANGUAGES.map((lng) => {
    const lngContent = post.languages[lng];
    if (!lngContent?.slug) return "";
    const lngPrefix = lng !== "en" ? `/${lng}` : "";
    return `<link rel="alternate" hreflang="${lng}" href="${SITE_URL}${lngPrefix}/blog/${lngContent.slug}" />`;
  }).filter(Boolean).join("\n    ");

  // Generate JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: content.title,
    description: content.excerpt,
    image: content.coverImage?.url || getDefaultBlogThumbnail(post.id),
    datePublished: publishedDate.toISOString(),
    dateModified: modifiedDate.toISOString(),
    author: {
      "@type": "Organization",
      name: post.authorName || "Time 2 Trade",
    },
    publisher: {
      "@type": "Organization",
      name: "Time 2 Trade",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logos/t2t-logo-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.tags?.join(", "),
    articleSection: post.category,
  };

  // Generate HTML
  // Note: This is a basic template. For production, consider using a template engine.
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | Time 2 Trade</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/blog/${post.languages.en?.slug || slug}" />
    ${hreflangLinks}
    
    <!-- Open Graph -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:site_name" content="Time 2 Trade" />
    <meta property="og:locale" content="${lang === "en" ? "en_US" : lang === "es" ? "es_ES" : "fr_FR"}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(structuredData)}
    </script>
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#1976d2" />
    
    <!-- Favicon -->
    <link rel="icon" href="/icons/favicon.ico" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    
    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <!-- Critical CSS (inline for performance) -->
    <style>
      :root {
        --t2t-primary: #1976d2;
        --t2t-text: #1a1a1a;
        --t2t-bg: #f9f9f9;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: var(--t2t-text);
        background: var(--t2t-bg);
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 24px 16px;
      }
      .cover-image {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin-bottom: 24px;
      }
      h1 {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 700;
        margin-bottom: 16px;
        line-height: 1.2;
      }
      .meta {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        color: #666;
        font-size: 0.9rem;
      }
      .content {
        font-size: 1.1rem;
      }
      .content h2 { font-size: 1.5rem; margin: 32px 0 16px; }
      .content h3 { font-size: 1.25rem; margin: 24px 0 12px; }
      .content p { margin-bottom: 16px; }
      .content ul, .content ol { padding-left: 24px; margin-bottom: 16px; }
      .content blockquote {
        border-left: 4px solid var(--t2t-primary);
        padding-left: 16px;
        margin: 24px 0;
        font-style: italic;
        background: rgba(25, 118, 210, 0.05);
        padding: 16px;
        border-radius: 4px;
      }
      .content img {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
      }
      .content a {
        color: var(--t2t-primary);
      }
      .content pre {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
      }
      .content code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }
      .back-link {
        display: inline-block;
        margin-top: 32px;
        color: var(--t2t-primary);
        text-decoration: none;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      .noscript-notice {
        background: #fff3cd;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 24px;
      }
    </style>
</head>
<body>
    <main class="container">
        <noscript>
            <div class="noscript-notice">
                For the full interactive experience, please enable JavaScript. 
                <a href="${SITE_URL}${langPrefix}/blog/${slug}">View full page</a>
            </div>
        </noscript>
        
        ${content.coverImage?.url ? `<img class="cover-image" src="${content.coverImage.url}" alt="${content.coverImage.alt || content.title}" />` : ""}
        
        <h1>${content.title}</h1>
        
        <div class="meta">
            <span>${post.authorName || "Time 2 Trade"}</span>
            <span>${publishedDate.toLocaleDateString(lang, { year: "numeric", month: "long", day: "numeric" })}</span>
            ${post.readingTimeMinutes ? `<span>${post.readingTimeMinutes} min read</span>` : ""}
        </div>
        
        <article class="content">
            ${content.contentHtml}
        </article>
        
        <a class="back-link" href="${langPrefix}/blog">← Back to Blog</a>
    </main>
    
    <!-- BEP: No redirect script - social crawlers (WhatsApp, Facebook, Twitter) get the pre-rendered 
         HTML with OG tags. Real users who visit will see this static version momentarily, then 
         need to navigate via SPA. The SPA cannot hydrate this HTML since it lacks the React root.
         This is intentional: pre-render serves SEO/social, users click through to full SPA. -->
</body>
</html>`;
};

/**
 * Generate and save HTML files for a published blog post
 */
export const renderBlogPost = async (postId: string): Promise<void> => {
  logger.info(`[BlogRender] Rendering post: ${postId}`);

  // Get post data
  const postDoc = await db.collection("blogPosts").doc(postId).get();
  if (!postDoc.exists) {
    throw new Error(`Post not found: ${postId}`);
  }

  const post = { id: postId, ...postDoc.data() } as BlogPost;

  if (post.status !== "published") {
    logger.warn(`[BlogRender] Post ${postId} is not published, skipping render`);
    return;
  }

  const renderedPaths: string[] = [];

  // Generate HTML for each language that has content
  for (const lang of SUPPORTED_LANGUAGES) {
    const content = post.languages?.[lang];
    if (!content?.slug || !content?.title) {
      logger.info(`[BlogRender] Skipping ${lang} - no content for post ${postId}`);
      continue;
    }

    const html = generateBlogHtml(post, lang, content);
    const storagePath = `blog-render/${lang}/blog/${content.slug}/index.html`;

    try {
      // Upload to Storage
      const file = bucket.file(storagePath);
      await file.save(html, {
        contentType: "text/html; charset=utf-8",
        metadata: {
          cacheControl: "public, max-age=300, s-maxage=3600", // 5min browser, 1hr CDN
          customMetadata: {
            postId,
            lang,
            slug: content.slug,
            renderedAt: new Date().toISOString(),
          },
        },
      });

      renderedPaths.push(storagePath);
      logger.info(`[BlogRender] Saved: ${storagePath}`);
    } catch (error) {
      logger.error(`[BlogRender] Failed to save ${storagePath}:`, error);
      throw error;
    }
  }

  // Save render manifest
  const manifest: RenderManifest = {
    postId,
    paths: renderedPaths,
    renderedAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await db.collection(BLOG_RENDERS_COLLECTION).doc(postId).set(manifest);
  logger.info(`[BlogRender] Manifest saved for ${postId}, ${renderedPaths.length} files`);
};

/**
 * Re-render all published blog posts
 * Useful for template changes or bulk updates
 */
export const reRenderAllPublishedPosts = async (): Promise<{ success: number; failed: string[] }> => {
  logger.info("[BlogRender] Starting re-render of all published posts...");
  
  const postsSnapshot = await db.collection("blogPosts")
    .where("status", "==", "published")
    .get();
  
  let success = 0;
  const failed: string[] = [];
  
  for (const doc of postsSnapshot.docs) {
    const postId = doc.id;
    try {
      await renderBlogPost(postId);
      success++;
      logger.info(`[BlogRender] Re-rendered: ${postId}`);
    } catch (error) {
      failed.push(postId);
      logger.error(`[BlogRender] Failed to re-render ${postId}:`, error);
    }
  }
  
  logger.info(`[BlogRender] Re-render complete: ${success} success, ${failed.length} failed`);
  return { success, failed };
};

/**
 * Remove rendered HTML files for an unpublished/deleted blog post
 */
export const removeRenderedBlogPost = async (postId: string): Promise<void> => {
  logger.info(`[BlogRender] Removing renders for post: ${postId}`);

  // Get manifest
  const manifestDoc = await db.collection(BLOG_RENDERS_COLLECTION).doc(postId).get();
  if (!manifestDoc.exists) {
    logger.warn(`[BlogRender] No manifest found for ${postId}, nothing to remove`);
    return;
  }

  const manifest = manifestDoc.data() as RenderManifest;

  // Delete each rendered file
  for (const path of manifest.paths) {
    try {
      await bucket.file(path).delete();
      logger.info(`[BlogRender] Deleted: ${path}`);
    } catch (error: unknown) {
      // Ignore "not found" errors (file already deleted)
      if (error && typeof error === "object" && "code" in error && (error as { code: number }).code === 404) {
        logger.warn(`[BlogRender] File not found (already deleted): ${path}`);
      } else {
        logger.error(`[BlogRender] Failed to delete ${path}:`, error);
      }
    }
  }

  // Delete manifest
  await db.collection(BLOG_RENDERS_COLLECTION).doc(postId).delete();
  logger.info(`[BlogRender] Manifest deleted for ${postId}`);
};

/**
 * Metadata for blog posts (used for OG tags in SPA shell)
 */
interface BlogMetadata {
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Get rendered HTML for a blog post from Storage
 * Used by the HTTPS function to serve pre-rendered content
 * Falls back to on-the-fly rendering if pre-rendered HTML not found
 * Also returns metadata for SPA shell OG tags
 */
export const getRenderedBlogHtml = async (
  lang: string,
  slug: string
): Promise<{ html: string; found: boolean; metadata?: BlogMetadata }> => {
  const storagePath = `blog-render/${lang}/blog/${slug}/index.html`;

  // Helper to get metadata from Firestore
  const getMetadataFromFirestore = async (): Promise<BlogMetadata | undefined> => {
    try {
      const languagesToTry = [lang, ...SUPPORTED_LANGUAGES.filter((l) => l !== lang)];
      for (const tryLang of languagesToTry) {
        const slugKey = `${tryLang}_${slug}`;
        const doc = await db.collection("blogSlugIndex").doc(slugKey).get();
        if (doc.exists) {
          const { postId } = doc.data() as { postId: string };
          const postDoc = await db.collection("blogPosts").doc(postId).get();
          if (postDoc.exists) {
            const post = postDoc.data() as BlogPost;
            const content = post.languages?.[tryLang] || post.languages?.["en"];
            if (content) {
              return {
                title: content.seoTitle || content.title,
                description: content.seoDescription || content.excerpt,
                image: content.coverImage?.url || getDefaultBlogThumbnail(postId),
              };
            }
          }
          break;
        }
      }
    } catch (err) {
      logger.warn(`[BlogRender] Could not get metadata for ${slug}:`, err);
    }
    return undefined;
  };

  try {
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();

    if (!exists) {
      // Try fallback to English pre-rendered
      if (lang !== "en") {
        const enPath = `blog-render/en/blog/${slug}/index.html`;
        const enFile = bucket.file(enPath);
        const [enExists] = await enFile.exists();

        if (enExists) {
          const [content] = await enFile.download();
          const metadata = await getMetadataFromFirestore();
          return { html: content.toString("utf-8"), found: true, metadata };
        }
      }

      // Fallback: Render on-the-fly for existing posts
      logger.info(`[BlogRender] No pre-rendered HTML for ${slug}, attempting on-the-fly render`);
      return await renderOnTheFly(lang, slug);
    }

    const [content] = await file.download();
    const metadata = await getMetadataFromFirestore();
    return { html: content.toString("utf-8"), found: true, metadata };
  } catch (error) {
    logger.error(`[BlogRender] Failed to get ${storagePath}:`, error);
    // Try on-the-fly render as last resort
    return await renderOnTheFly(lang, slug);
  }
};

/**
 * Render a blog post on-the-fly when pre-rendered HTML is not available
 * Also triggers background pre-render for future requests
 */
const renderOnTheFly = async (
  lang: string,
  slug: string
): Promise<{ html: string; found: boolean; metadata?: BlogMetadata }> => {
  try {
    // Look up post by slug in blogSlugIndex (format: lang_slug)
    // Try requested language first, then fallback to other languages
    const languagesToTry = [lang, ...SUPPORTED_LANGUAGES.filter((l) => l !== lang)];
    let slugIndexDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    let foundLang = lang;

    for (const tryLang of languagesToTry) {
      const slugKey = `${tryLang}_${slug}`;
      const doc = await db.collection("blogSlugIndex").doc(slugKey).get();
      if (doc.exists) {
        slugIndexDoc = doc;
        foundLang = tryLang;
        logger.info(`[BlogRender] Found slug in index: ${slugKey}`);
        break;
      }
    }

    if (!slugIndexDoc || !slugIndexDoc.exists) {
      logger.warn(`[BlogRender] Slug not found in index for any language: ${slug}`);
      return { html: "", found: false };
    }

    const { postId } = slugIndexDoc.data() as { postId: string };

    // Get post data
    const postDoc = await db.collection("blogPosts").doc(postId).get();
    if (!postDoc.exists) {
      logger.warn(`[BlogRender] Post not found: ${postId}`);
      return { html: "", found: false };
    }

    const post = { id: postId, ...postDoc.data() } as BlogPost;

    if (post.status !== "published") {
      logger.warn(`[BlogRender] Post ${postId} is not published`);
      return { html: "", found: false };
    }

    // Get content for the language where slug was found, then try requested lang, then English
    let content = post.languages?.[foundLang];
    let effectiveLang = foundLang;
    if (!content?.slug || !content?.title) {
      content = post.languages?.[lang];
      effectiveLang = lang;
    }
    if (!content?.slug || !content?.title) {
      content = post.languages?.["en"];
      effectiveLang = "en";
      if (!content?.slug || !content?.title) {
        logger.warn(`[BlogRender] No content for post ${postId}`);
        return { html: "", found: false };
      }
    }

    // Generate HTML on-the-fly
    const html = generateBlogHtml(post, effectiveLang, content);

    // Extract metadata for SPA shell
    const metadata: BlogMetadata = {
      title: content.seoTitle || content.title,
      description: content.seoDescription || content.excerpt,
      image: content.coverImage?.url || getDefaultBlogThumbnail(post.id),
    };

    // Trigger background pre-render (non-blocking)
    renderBlogPost(postId).catch((err) => {
      logger.error(`[BlogRender] Background pre-render failed for ${postId}:`, err);
    });

    logger.info(`[BlogRender] On-the-fly render success for ${slug} (${effectiveLang})`);
    return { html, found: true, metadata };
  } catch (error) {
    logger.error(`[BlogRender] On-the-fly render failed for ${slug}:`, error);
    return { html: "", found: false };
  }
};
