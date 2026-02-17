/**
 * functions/src/services/sitemapService.ts
 *
 * Purpose: Generate and serve dynamic sitemaps for the blog and sitemap index.
 * Queries Firestore for published blog posts and authors to build XML sitemaps
 * with proper hreflang annotations and SEO metadata.
 *
 * Exports:
 * - serveSitemapIndex: Serves /sitemap.xml as a sitemap index
 * - serveSitemapBlog: Serves /sitemap-blog.xml with all published blog content
 *
 * Hub pages included in sitemap-blog.xml:
 * - /blog (blog index)
 * - /blog/:slug (individual posts)
 * - /blog/event/:eventKey (event hub pages)
 * - /blog/currency/:currency (currency hub pages)
 * - /blog/event/:eventKey/:currency (event+currency combo pages)
 * - /blog/category/:category (category hub pages)
 * - /blog/tag/:tagSlug (tag hub pages)
 * - /blog/author/:authorSlug (author pages)
 *
 * Changelog:
 * v1.3.0 - 2026-02-11 - BEP CRITICAL FIX: Added safeToDate() helper to handle mixed date formats
 *                       (Firestore Timestamp, string, number, serialized _seconds object).
 *                       Fixes 'toDate is not a function' crash on /sitemap-blog.xml when
 *                       publishedAt/updatedAt aren't native Firestore Timestamps.
 * v1.2.0 - 2026-02-05 - BEP: Emit hreflang only for available translations and set x-default to first available language.
 * v1.1.0 - 2026-02-04 - BEP: Added category, tag, and event+currency combo hub pages to blog sitemap
 * v1.0.0 - 2026-02-04 - Initial implementation (BEP Dynamic Sitemap)
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Lazy-load Firestore to ensure admin.initializeApp() runs first
const getDb = () => admin.firestore();

// Constants
const SITE_URL = "https://time2.trade";
const SUPPORTED_LANGUAGES = ["en", "es", "fr"];
const CACHE_MAX_AGE = 3600; // 1 hour

// Types
interface LanguageContent {
  slug?: string;
  title?: string;
}

interface BlogPost {
  id: string;
  status: string;
  languages: Record<string, LanguageContent>;
  publishedAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  eventTags?: string[];
  currencyTags?: string[];
  category?: string;
  tags?: string[];
  authorId?: string;
}

interface BlogAuthor {
  id: string;
  slug: string;
  displayName?: string;
}

/**
 * Format date to YYYY-MM-DD for sitemap lastmod
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

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
  // Firestore Timestamp
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  // Already a Date
  if (value instanceof Date) return value;
  // ISO string or other parseable string
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : d;
  }
  // Epoch milliseconds
  if (typeof value === "number") return new Date(value);
  // Serialized Timestamp object ({_seconds, _nanoseconds})
  if (typeof value === "object" && "_seconds" in (value as Record<string, unknown>)) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return fallback;
};

/**
 * Generate XML for a single URL entry with hreflang
 */
const generateUrlEntry = (
  path: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  langPaths?: Record<string, string>
): string => {
  const availableLangPaths = langPaths && Object.keys(langPaths).length > 0 ? langPaths : {
    en: path,
    es: `/es${path}`,
    fr: `/fr${path}`,
  };

  const languages = Object.keys(availableLangPaths).filter((lng) => Boolean(availableLangPaths[lng]));

  const hreflangLinks = languages
    .map((lng) => {
      const langPath = availableLangPaths[lng];
      return langPath ? `    <xhtml:link rel="alternate" hreflang="${lng}" href="${SITE_URL}${langPath}"/>` : "";
    })
    .filter(Boolean)
    .join("\n");

  const xDefaultPath = availableLangPaths.en || availableLangPaths[languages[0]] || path;

  return `  <url>
    <loc>${SITE_URL}${path}</loc>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${xDefaultPath}"/>
${hreflangLinks}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
};

/**
 * Generate the blog sitemap XML
 * Includes all blog hub pages with posts:
 * - /blog (index)
 * - /blog/:slug (individual posts)
 * - /blog/event/:eventKey (event hub pages)
 * - /blog/currency/:currency (currency hub pages)
 * - /blog/event/:eventKey/:currency (event+currency combo pages)
 * - /blog/category/:category (category hub pages)
 * - /blog/tag/:tagSlug (tag hub pages)
 * - /blog/author/:authorSlug (author pages)
 */
export const generateBlogSitemap = async (): Promise<string> => {
  const urls: string[] = [];
  const today = formatDate(new Date());
  let latestPostDate = today;

  // 1. Add /blog index for all languages
  urls.push(generateUrlEntry("/blog", today, "daily", "0.8"));

  // 2. Query all published blog posts
  const postsSnap = await getDb()
    .collection("blogPosts")
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .get();

  // Tracking maps for taxonomy pages
  const eventTagCounts: Record<string, number> = {};
  const currencyTagCounts: Record<string, number> = {};
  const eventCurrencyCombos: Set<string> = new Set(); // "eventKey:currency" format
  const categoryCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const authorIds = new Set<string>();

  for (const doc of postsSnap.docs) {
    const post = { id: doc.id, ...doc.data() } as BlogPost;
    const postDate = safeToDate(post.publishedAt, safeToDate(post.updatedAt));
    const lastmod = formatDate(postDate);

    // Track latest post date for sitemap index
    if (postDate > new Date(latestPostDate)) {
      latestPostDate = lastmod;
    }

    // Build language-specific paths for this post
    const langPaths: Record<string, string> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      const langContent = post.languages?.[lang];
      if (langContent?.slug) {
        const prefix = lang === "en" ? "" : `/${lang}`;
        langPaths[lang] = `${prefix}/blog/${langContent.slug}`;
      }
    }

    // Use English slug as primary, or first available
    const primarySlug = post.languages?.en?.slug ||
      Object.values(post.languages || {}).find((c) => c?.slug)?.slug;

    if (primarySlug) {
      urls.push(generateUrlEntry(`/blog/${primarySlug}`, lastmod, "weekly", "0.8", langPaths));
    }

    // Track event tags
    if (post.eventTags) {
      for (const tag of post.eventTags) {
        eventTagCounts[tag] = (eventTagCounts[tag] || 0) + 1;
      }
    }

    // Track currency tags
    if (post.currencyTags) {
      for (const tag of post.currencyTags) {
        currencyTagCounts[tag] = (currencyTagCounts[tag] || 0) + 1;
      }
    }

    // Track event+currency combinations (only if both exist on post)
    if (post.eventTags && post.currencyTags) {
      for (const eventKey of post.eventTags) {
        for (const currency of post.currencyTags) {
          eventCurrencyCombos.add(`${eventKey}:${currency}`);
        }
      }
    }

    // Track category
    if (post.category) {
      categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
    }

    // Track editorial tags (tags array, not eventTags/currencyTags)
    if (post.tags && Array.isArray(post.tags)) {
      for (const tag of post.tags) {
        // Normalize tag to URL-safe slug
        const tagSlug = tag.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (tagSlug) {
          tagCounts[tagSlug] = (tagCounts[tagSlug] || 0) + 1;
        }
      }
    }

    // Track author
    if (post.authorId) {
      authorIds.add(post.authorId);
    }
  }

  // 3. Add event taxonomy pages (only those with posts)
  for (const eventKey of Object.keys(eventTagCounts)) {
    urls.push(generateUrlEntry(`/blog/event/${eventKey}`, today, "weekly", "0.6"));
  }

  // 4. Add currency taxonomy pages (only those with posts)
  for (const currency of Object.keys(currencyTagCounts)) {
    urls.push(generateUrlEntry(`/blog/currency/${currency}`, today, "weekly", "0.6"));
  }

  // 5. Add event+currency combo pages (Phase 5.B/5.C)
  for (const combo of eventCurrencyCombos) {
    const [eventKey, currency] = combo.split(":");
    urls.push(generateUrlEntry(`/blog/event/${eventKey}/${currency}`, today, "weekly", "0.5"));
  }

  // 6. Add category hub pages
  for (const category of Object.keys(categoryCounts)) {
    urls.push(generateUrlEntry(`/blog/category/${category}`, today, "weekly", "0.6"));
  }

  // 7. Add tag hub pages
  for (const tagSlug of Object.keys(tagCounts)) {
    urls.push(generateUrlEntry(`/blog/tag/${tagSlug}`, today, "weekly", "0.5"));
  }

  // 8. Add author pages (batch query for slugs)
  if (authorIds.size > 0) {
    // Firestore "in" queries limited to 10 items; handle larger sets
    const authorIdArray = Array.from(authorIds);
    const authorBatches: string[][] = [];
    for (let i = 0; i < authorIdArray.length; i += 10) {
      authorBatches.push(authorIdArray.slice(i, i + 10));
    }

    for (const batch of authorBatches) {
      const authorsSnap = await getDb()
        .collection("blogAuthors")
        .where(admin.firestore.FieldPath.documentId(), "in", batch)
        .get();

      for (const doc of authorsSnap.docs) {
        const author = { id: doc.id, ...doc.data() } as BlogAuthor;
        if (author.slug) {
          urls.push(generateUrlEntry(`/blog/author/${author.slug}`, today, "monthly", "0.5"));
        }
      }
    }
  }

  // Build XML with XSL stylesheet for browser rendering
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!--
    BEP SEO: Dynamic blog sitemap
    Generated: ${new Date().toISOString()}
    Posts: ${postsSnap.size}
    Event Hub Pages: ${Object.keys(eventTagCounts).length}
    Currency Hub Pages: ${Object.keys(currencyTagCounts).length}
    Event+Currency Combo Pages: ${eventCurrencyCombos.size}
    Category Hub Pages: ${Object.keys(categoryCounts).length}
    Tag Hub Pages: ${Object.keys(tagCounts).length}
    Author Pages: ${authorIds.size}
  -->
${urls.join("\n")}
</urlset>`;

  return xml;
};

/**
 * Generate the sitemap index XML
 * Points to: sitemap-pages.xml, sitemap-events.xml, sitemap-blog.xml
 */
export const generateSitemapIndex = async (): Promise<string> => {
  const today = formatDate(new Date());

  // Get latest blog post date for blog sitemap lastmod
  let blogLastmod = today;
  try {
    const latestPost = await getDb()
      .collection("blogPosts")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();

    if (!latestPost.empty) {
      const post = latestPost.docs[0].data();
      const postDate = safeToDate(post.publishedAt, safeToDate(post.updatedAt, new Date()));
      blogLastmod = formatDate(postDate);
    }
  } catch (error) {
    logger.warn("Could not get latest blog post date for sitemap index", { error });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!--
    BEP SEO: Dynamic sitemap index
    Generated: ${new Date().toISOString()}
  -->
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-events.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${blogLastmod}</lastmod>
  </sitemap>
</sitemapindex>`;

  return xml;
};

/**
 * HTTP handler for serving sitemap-blog.xml
 */
export const handleServeSitemapBlog = async (
  req: { method: string },
  res: {
    set: (headers: Record<string, string>) => void;
    status: (code: number) => { send: (body: string) => void };
  }
): Promise<void> => {
  logger.info("📍 Serving sitemap-blog.xml");

  try {
    const xml = await generateBlogSitemap();

    res.set({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      "X-Robots-Tag": "noindex", // Sitemaps should not be indexed themselves
    });
    res.status(200).send(xml);

    logger.info("✅ sitemap-blog.xml served successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("❌ Failed to generate sitemap-blog.xml", { error: errorMessage });
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap: ${errorMessage}</error>`);
  }
};

/**
 * HTTP handler for serving sitemap.xml (sitemap index)
 */
export const handleServeSitemapIndex = async (
  req: { method: string },
  res: {
    set: (headers: Record<string, string>) => void;
    status: (code: number) => { send: (body: string) => void };
  }
): Promise<void> => {
  logger.info("📍 Serving sitemap.xml (sitemap index)");

  try {
    const xml = await generateSitemapIndex();

    res.set({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
      "X-Robots-Tag": "noindex", // Sitemaps should not be indexed themselves
    });
    res.status(200).send(xml);

    logger.info("✅ sitemap.xml served successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("❌ Failed to generate sitemap.xml", { error: errorMessage });
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<error>Failed to generate sitemap: ${errorMessage}</error>`);
  }
};
