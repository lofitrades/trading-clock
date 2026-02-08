/**
 * functions/src/index.ts
 *
 * Purpose: Cloud Functions entrypoint for Time 2 Trade economic events sync,
 * orchestrating scheduled breadth (NFS weekly) and depth (JBlanked actuals)
 * updates into the canonical economic events collection.
 *
 * Changelog:
 * v1.10.0 - 2026-02-06 - GPT ACTIONS: Added secured endpoints for blog CMS integration (list slugs, create draft).
 * v1.9.0 - 2026-02-05 - BEP BLOG: Hardened blog HTML serving (taxonomy-safe routing, bot handling) and language-aware SPA responses.
 * v1.8.0 - 2026-02-04 - BEP SITEMAP: Updated sitemapService to include all blog hub pages (category, tag, event+currency combo)
 * v1.7.0 - 2026-02-04 - BEP SITEMAP: Added dynamic sitemap functions (serveSitemapIndex, serveSitemapBlog).
 * v1.6.0 - 2026-02-04 - BEP FIX: FCM scheduler now runs every 1 minute for near-instant push delivery.
 * v1.5.0 - 2026-01-23 - Add scheduled FCM push reminders for unified event reminders.
 * v1.4.0 - 2026-01-21 - Add callable email sender for custom reminder notifications.
 * v1.3.0 - 2026-01-21 - Add manual JBlanked Forex Factory range backfill endpoint.
 * v1.2.1 - 2026-01-16 - Enhanced uploadGptEvents: check custom claims + Firestore fallback with better error messaging.
 * v1.2.0 - 2026-01-16 - Added GPT uploader callable for canonical event seeding.
 * v1.1.0 - 2025-12-16 - Updated JBlanked actuals schedule to 11:59 AM ET daily.
 * v1.0.0 - 2025-12-11 - Initial functions entry with NFS + JBlanked sync flows.
 */

// Load environment variables from .env file (local development only)
import * as dotenv from "dotenv";
dotenv.config();

import * as admin from "firebase-admin";
import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {syncWeekFromNfs} from "./services/nfsSyncService";
import {syncTodayActualsFromJblankedAllConfigured} from "./services/jblankedActualsService";
import {syncJblankedForexFactorySince} from "./services/jblankedForexFactoryRangeService";
import {uploadGptEventsBatch} from "./services/gptUploadService";
import {sendCustomReminderEmail} from "./services/sendgridEmailService";
import {runFcmReminderScheduler} from "./services/fcmReminderScheduler";
import {handleServeSitemapIndex, handleServeSitemapBlog} from "./services/sitemapService";
import {
  handleGptActionsCreateBlogDraft,
  handleGptActionsGetExistingBlogSlugs,
} from "./services/gptBlogActionsService";

const T2T_GPT_ACTIONS_API_KEY = defineSecret("T2T_GPT_ACTIONS_API_KEY");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
// Max 10 instances per function to prevent unexpected scaling costs
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1", // Same region as Firestore
});

/**
 * Scheduled Cloud Function - NFS weekly schedule sync (breadth)
 * Runs hourly to keep the canonical schedule fresh.
 */
export const syncWeekFromNfsScheduled = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "America/New_York",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    await syncWeekFromNfs();
  }
);

/**
 * HTTPS Cloud Function - Manual NFS weekly sync
 * Useful for on-demand refresh from the drawer "Sync Week" action.
 */
export const syncWeekFromNfsNow = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual NFS week sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncWeekFromNfs();
      res.status(200).json({
        ok: true,
        source: "nfs",
        scope: "current_week",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual NFS week sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * Scheduled Cloud Function - JBlanked actuals patcher (depth)
 * Runs daily at 11:59 AM America/New_York to capture actual values.
 */
export const syncTodayActualsFromJblanked = onSchedule(
  {
    schedule: "59 11 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    await syncTodayActualsFromJblankedAllConfigured();
  }
);

/**
 * Scheduled Cloud Function - FCM push reminders
 * Runs every 1 minute for near-instant push notification delivery.
 * BEP v3.0.0: Widened lookback (300s), parallel user processing, 120s timeout.
 * Cost-effective at ~43,200/month (2.16% of free tier).
 */
export const sendFcmRemindersScheduled = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "America/New_York",
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    await runFcmReminderScheduler();
  }
);

/**
 * HTTPS Cloud Function - Manual JBlanked actuals sync
 * Fetches today's actual values from all configured JBlanked sources
 * (ForexFactory, MQL5/MT, FXStreet)
 */
export const syncTodayActualsFromJblankedNow = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual JBlanked actuals sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncTodayActualsFromJblankedAllConfigured();
      res.status(200).json({
        ok: true,
        source: "jblanked",
        scope: "today_actuals",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual JBlanked actuals sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * HTTPS Cloud Function - Manual JBlanked Forex Factory range backfill
 * Fetches all events since 2026-01-01 and merges into canonical collection,
 * creating new events when no NFS match exists.
 */
export const syncForexFactorySince2026Now = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual JBlanked FF range sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncJblankedForexFactorySince();
      res.status(200).json({
        ok: true,
        source: "jblanked-ff",
        scope: "since_2026_01_01",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual JBlanked FF range sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * HTTPS Cloud Function - GPT Actions: list existing blog slugs
 * Used by a Custom GPT to avoid duplicate topics/slugs before creating drafts.
 */
export const gptActionsGetExistingBlogSlugs = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [T2T_GPT_ACTIONS_API_KEY],
  },
  async (req, res) => {
    await handleGptActionsGetExistingBlogSlugs(req, res, {
      apiKeySecret: T2T_GPT_ACTIONS_API_KEY,
    });
  }
);

/**
 * HTTPS Cloud Function - GPT Actions: create blog post draft
 * Accepts Firestore-ready blog JSON payload and creates a draft with slug-index claiming.
 */
export const gptActionsCreateBlogDraft = onRequest(
  {
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [T2T_GPT_ACTIONS_API_KEY],
  },
  async (req, res) => {
    await handleGptActionsCreateBlogDraft(req, res, {
      apiKeySecret: T2T_GPT_ACTIONS_API_KEY,
    });
  }
);

/**
 * HTTPS Callable - GPT fallback event uploader (superadmin only)
 * Accepts JSON array of GPT events and merges into canonical collection.
 * Checks both Firebase custom claims (primary) and Firestore (fallback).
 */
export const uploadGptEvents = onCall(
  {
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const token = auth.token || {};
    const uid = auth.uid;
    let userData: any = null;
    
    // Check custom claims (primary - from ID token)
    let isSuperadmin = token.role === "superadmin" || token.superadmin === true;
    
    // Fallback: Check Firestore if custom claims not present
    if (!isSuperadmin) {
      try {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        userData = userDoc.data();
        isSuperadmin = userData?.role === 'superadmin';
      } catch (error) {
        logger.warn("Failed to check Firestore role", { uid, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    if (!isSuperadmin) {
      const userRole = token.role || userData?.role || 'user';
      throw new HttpsError(
        "permission-denied", 
        `Superadmin role required. Current role: ${userRole}. User must sign out and back in after role update.`
      );
    }

    const events = request.data?.events;
    if (!Array.isArray(events)) {
      throw new HttpsError("invalid-argument", "events must be an array");
    }

    if (events.length > 1000) {
      throw new HttpsError("invalid-argument", "Batch too large (max 1000)");
    }

    const result = await uploadGptEventsBatch(events);
    logger.info("✅ GPT upload batch complete", result);
    return result;
  }
);

/**
 * HTTPS Callable - Send custom reminder email to the authenticated user.
 * Sends a transactional email via SendGrid using the user's verified email.
 */
export const sendCustomReminderEmailNow = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const uid = auth.uid;
    const tokenEmail = auth.token?.email;

    let email = tokenEmail || null;
    if (!email) {
      try {
        const userRecord = await admin.auth().getUser(uid);
        email = userRecord.email || null;
      } catch (error) {
        logger.warn("Failed to resolve user email", { uid, error: error instanceof Error ? error.message : String(error) });
      }
    }

    if (!email) {
      throw new HttpsError("failed-precondition", "User email not available");
    }

    const data = request.data || {};
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) {
      throw new HttpsError("invalid-argument", "title is required");
    }

    try {
      await sendCustomReminderEmail({
        to: email,
        title,
        description: typeof data.description === "string" ? data.description.trim() : undefined,
        localDate: typeof data.localDate === "string" ? data.localDate : undefined,
        localTime: typeof data.localTime === "string" ? data.localTime : undefined,
        timezone: typeof data.timezone === "string" ? data.timezone : undefined,
        minutesBefore: Number.isFinite(Number(data.minutesBefore)) ? Number(data.minutesBefore) : undefined,
      });
      return { ok: true };
    } catch (error) {
      logger.error("Failed to send reminder email", { uid, error: error instanceof Error ? error.message : String(error) });
      throw new HttpsError("internal", "Failed to send reminder email");
    }
  }
);

// ============================================================================
// BLOG PUBLISHING PIPELINE (Phase 4)
// ============================================================================

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import {
  renderBlogPost,
  removeRenderedBlogPost,
  getRenderedBlogHtml,
  reRenderAllPublishedPosts,
} from "./services/blogRenderService";

/**
 * Firestore trigger: Watch blogPosts for publish/unpublish status changes
 * Generates or removes pre-rendered HTML in Cloud Storage
 */
export const onBlogPostWrite = onDocumentWritten(
  {
    document: "blogPosts/{postId}",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    const postId = event.params.postId;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    const beforeStatus = beforeData?.status;
    const afterStatus = afterData?.status;

    logger.info(`[BlogTrigger] Post ${postId}: ${beforeStatus} → ${afterStatus}`);

    // Post deleted
    if (!afterData) {
      if (beforeStatus === "published") {
        logger.info(`[BlogTrigger] Post ${postId} deleted, removing renders`);
        await removeRenderedBlogPost(postId);
      }
      return;
    }

    // Status changed to published
    if (afterStatus === "published" && beforeStatus !== "published") {
      logger.info(`[BlogTrigger] Post ${postId} published, generating renders`);
      await renderBlogPost(postId);
      return;
    }

    // Status changed from published to something else (unpublished/draft)
    if (beforeStatus === "published" && afterStatus !== "published") {
      logger.info(`[BlogTrigger] Post ${postId} unpublished, removing renders`);
      await removeRenderedBlogPost(postId);
      return;
    }

    // Content updated while published (re-render)
    if (afterStatus === "published" && beforeStatus === "published") {
      // Check if language content changed
      const beforeContent = JSON.stringify(beforeData?.languageContent || {});
      const afterContent = JSON.stringify(afterData?.languageContent || {});
      if (beforeContent !== afterContent) {
        logger.info(`[BlogTrigger] Post ${postId} content updated, re-rendering`);
        await renderBlogPost(postId);
      }
    }
  }
);

/**
 * HTTPS Function: Serve pre-rendered blog HTML for SEO crawlers
 * Path pattern: /blog-render/{lang}/blog/{slug}
 * 
 * BEP HYBRID APPROACH:
 * - Social crawlers (WhatsApp, Facebook, Twitter, LinkedIn, bots) → pre-rendered HTML with OG meta tags
 * - Real users (browsers) → Actual SPA index.html from Firebase Hosting
 * 
 * Note: Firebase Hosting rewrites should route /blog/* and /{lang}/blog/* to this function
 */

// Social crawler / bot user-agent patterns
// IMPORTANT: These patterns must be specific to avoid false positives
// For example, "WhatsApp" in a real browser UA vs WhatsApp crawler
const CRAWLER_PATTERNS = [
  /^facebookexternalhit/i,
  /^facebookcatalog/i,
  /^Facebot/i,
  /^WhatsApp\//i,        // WhatsApp crawler starts with "WhatsApp/" (no Mozilla)
  /^Twitterbot/i,
  /^LinkedInBot/i,
  /^Slackbot/i,
  /^TelegramBot/i,
  /^Discordbot/i,
  /^Pinterest/i,
  /Googlebot/i,
  /bingbot/i,
  /^Applebot/i,
  /DuckDuckBot/i,
  /YandexBot/i,
  /Baiduspider/i,
  /^ia_archiver/i,
  /^curl\//i,
  /^wget\//i,
  /^python-requests/i,
  /^Go-http-client/i,
];

const isCrawler = (userAgent: string): boolean => {
  if (!userAgent) return false;
  
  // If UA starts with "Mozilla/", it's likely a real browser
  // (even if it contains bot-like strings from referrer apps)
  const isMozilla = userAgent.startsWith("Mozilla/");
  
  // Check against crawler patterns
  for (const pattern of CRAWLER_PATTERNS) {
    if (pattern.test(userAgent)) {
      // Special case: If UA has Mozilla AND contains a social app name,
      // it's probably a real browser opened from that app, not a crawler
      if (isMozilla && /WhatsApp|Instagram|FBAV|FBAN|Twitter|Telegram/i.test(userAgent)) {
        return false; // Real browser from social app
      }
      return true; // Crawler
    }
  }
  
  return false;
};

// Cache for SPA index.html per language (fetched from hosting)
const spaHtmlCache: Record<string, { html: string; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch the SPA index.html from Firebase Hosting
 * This ensures we serve the same file that Firebase Hosting would serve
 * Caches per-language to avoid re-fetching
 */
const fetchSpaIndexHtml = async (lang: string): Promise<string | null> => {
  const now = Date.now();
  const cached = spaHtmlCache[lang];
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    logger.info(`[ServeBlog] Serving cached SPA index.html for lang=${lang}`);
    return cached.html;
  }

  try {
    // Fetch from Firebase Hosting directly using a known SPA route
    const langPath = lang !== "en" ? `/${lang}` : "";
    const fetchUrl = `https://time2.trade${langPath}/clock`; // Use a known SPA route
    
    logger.info(`[ServeBlog] Fetching SPA index from: ${fetchUrl}`);
    
    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "T2T-CloudFunction/1.0", // Identified as our own request
      },
    });

    if (response.ok) {
      const html = await response.text();
      spaHtmlCache[lang] = { html, timestamp: now };
      logger.info(`[ServeBlog] Fetched SPA index.html for lang=${lang}, ${html.length} bytes`);
      return html;
    }
    logger.warn(`[ServeBlog] Failed to fetch SPA index for lang=${lang}: ${response.status}`);
  } catch (error) {
    logger.error(`[ServeBlog] Error fetching SPA index for lang=${lang}:`, error);
  }
  return null;
};

export const serveBlogHtml = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    cors: true,
  },
  async (req, res) => {
    const userAgent = req.headers["user-agent"] || "";
    const isBotRequest = isCrawler(userAgent);
    
    // Parse path segments safely: /{lang?}/blog/{...}
    const path = req.path;
    const segments = path.split("/").filter(Boolean);
    let lang = "en";
    let startIndex = 0;

    if (segments[0] === "es" || segments[0] === "fr") {
      lang = segments[0];
      startIndex = 1;
    }

    if (segments[startIndex] !== "blog") {
      logger.warn(`[ServeBlog] Unexpected path, not under /blog: ${path}`);
      res.status(404).send("Not Found");
      return;
    }

    const routeSegments = segments.slice(startIndex + 1);
    const firstRouteSegment = routeSegments[0] || "";
    const isTaxonomy = ["event", "currency", "author", "category", "tag"].includes(firstRouteSegment);
    const routeType = routeSegments.length === 0 ? "list" : isTaxonomy ? "taxonomy" : "post";

    let slug = routeType === "post" ? firstRouteSegment : "";
    const langPrefix = lang !== "en" ? `/${lang}` : "";

    // Remove trailing slash or index.html from slug (posts only)
    slug = slug.replace(/\/$/, "").replace(/\/index\.html$/, "");

    logger.info(`[ServeBlog] Request: path=${path}, lang=${lang}, route=${routeType}${slug ? `, slug=${slug}` : ""}, bot=${isBotRequest}, ua=${userAgent.substring(0, 60)}`);


    // For bots: Serve pre-rendered HTML with full OG meta tags
    if (isBotRequest) {
      // Blog list page for bots - serve basic HTML
      if (routeType === "list") {
        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Cache-Control", "public, max-age=300, s-maxage=3600");
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="${lang}">
          <head>
            <meta charset="UTF-8" />
            <title>Time 2 Trade Blog | Trading Insights</title>
            <meta name="description" content="Expert trading analysis and insights for futures and forex traders." />
            <meta property="og:title" content="Time 2 Trade Blog" />
            <meta property="og:description" content="Expert trading analysis and insights for futures and forex traders." />
            <meta property="og:image" content="https://time2.trade/logos/t2t-logo-512.png" />
            <meta property="og:url" content="https://time2.trade${langPrefix}/blog" />
            <link rel="canonical" href="https://time2.trade${langPrefix}/blog" />
          </head>
          <body>
            <h1>Time 2 Trade Blog</h1>
            <p>Trading insights and analysis</p>
            <a href="https://time2.trade/blog">Visit Blog</a>
          </body>
          </html>
        `);
        return;
      }

      // Taxonomy pages (event/currency/author/category/tag) should not 404 bots; serve SPA shell
      if (routeType === "taxonomy") {
        const spaHtmlForBot = await fetchSpaIndexHtml(lang);
        if (spaHtmlForBot) {
          res.set("Content-Type", "text/html; charset=utf-8");
          res.set("Cache-Control", "public, max-age=300, s-maxage=3600");
          res.status(200).send(spaHtmlForBot);
          return;
        }
        logger.warn(`[ServeBlog] Bot taxonomy fallback redirect for ${path}`);
        res.redirect(302, `https://time2.trade${langPrefix}/blog`);
        return;
      }

      try {
        const { html, found } = await getRenderedBlogHtml(lang, slug);

        if (!found) {
          res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Not Found</title></head>
            <body>
              <h1>Blog post not found</h1>
              <p><a href="https://time2.trade/blog">Back to Blog</a></p>
            </body>
            </html>
          `);
          return;
        }

        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Cache-Control", "public, max-age=300, s-maxage=3600");
        res.status(200).send(html);
        return;
      } catch (error) {
        logger.error(`[ServeBlog] Bot error for ${slug}:`, error);
        res.status(500).send("Internal Server Error");
        return;
      }
    }

    // For real users: Serve the actual SPA index.html from Firebase Hosting
    // This allows React Router to handle /blog/:slug client-side
    try {
      const spaHtml = await fetchSpaIndexHtml(lang);
      
      if (spaHtml) {
        res.set("Content-Type", "text/html; charset=utf-8");
        res.set("Cache-Control", "public, max-age=60, s-maxage=300");
        res.status(200).send(spaHtml);
        return;
      }

      // Fallback: Redirect to landing page (SPA will route correctly)
      logger.warn(`[ServeBlog] Could not get SPA index, redirecting to landing`);
      res.redirect(302, `https://time2.trade${langPrefix}/?redirect=/blog/${slug}`);
    } catch (error) {
      logger.error(`[ServeBlog] User error for ${slug}:`, error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ============================================================================
// DYNAMIC SITEMAPS (BEP SEO)
// ============================================================================

/**
 * HTTPS Function: Serve dynamic sitemap index
 * Points to: sitemap-pages.xml, sitemap-events.xml, sitemap-blog.xml
 * Route: /sitemap.xml (via Firebase rewrite)
 */
export const serveSitemapIndex = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
    cors: true,
  },
  async (req, res) => {
    await handleServeSitemapIndex(req, res);
  }
);

/**
 * HTTPS Function: Serve dynamic blog sitemap
 * Includes: /blog, all published posts, event/currency taxonomy, author pages
 * Route: /sitemap-blog.xml (via Firebase rewrite)
 */
export const serveSitemapBlog = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    cors: true,
  },
  async (req, res) => {
    await handleServeSitemapBlog(req, res);
  }
);

/**
 * HTTPS Function: Admin endpoint to re-render all published blog posts
 * Useful after template changes. Requires admin authentication.
 * Route: Called manually via Cloud Functions URL
 */
export const reRenderAllBlogs = onRequest(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300, // 5 minutes for bulk operation
    cors: true,
  },
  async (req, res) => {
    // Basic security: require secret query param (add ADMIN_SECRET to .env for production)
    const secret = req.query.secret || req.headers["x-admin-secret"];
    const adminSecret = process.env.ADMIN_SECRET || "t2t-rerender-2026";
    if (secret !== adminSecret) {
      logger.warn("[ReRenderAll] Unauthorized attempt");
      res.status(401).send({ error: "Unauthorized" });
      return;
    }

    try {
      const result = await reRenderAllPublishedPosts();
      res.status(200).send({
        message: "Re-render complete",
        success: result.success,
        failed: result.failed,
      });
    } catch (error) {
      logger.error("[ReRenderAll] Error:", error);
      res.status(500).send({ error: "Re-render failed" });
    }
  }
);
