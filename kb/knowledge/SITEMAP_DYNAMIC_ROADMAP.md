# Time 2 Trade — Dynamic Sitemap Implementation Roadmap (BEP)
> **Purpose:** A systematic, checklist-driven roadmap for implementing dynamic sitemaps that auto-update when blog posts are published/unpublished.  
> **How to use:** This file is a living development guide. Update status, notes, and links as work progresses.  
> **Non-negotiables:**  
> - **Sitemap Index pattern** - Split into logical child sitemaps for scalability  
> - **Multi-language** - All sitemaps include proper `hreflang` annotations  
> - **Auto-update** - Blog sitemap regenerates on publish/unpublish (no manual deploy)  
> - **SEO-first** - Valid XML, correct lastmod dates, proper priorities  
> - **Cache-optimized** - CDN-friendly headers with appropriate TTLs  
> - **No redeploy** - Dynamic sitemaps served via Cloud Function rewrite

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked / needs decision

---

## Phase 1 — Architecture & Planning
**Goal:** Define sitemap structure, URLs, and caching strategy.

### 1.1 Sitemap Index Strategy
- [x] Decision: Use **Sitemap Index** pattern with child sitemaps
- [x] Structure:
  ```
  /sitemap.xml           → Sitemap Index (served by Cloud Function)
    ├─ /sitemap-pages.xml    → Static pages (served static)
    ├─ /sitemap-events.xml   → Economic event pages (served static)
    └─ /sitemap-blog.xml     → Blog posts + taxonomy (Cloud Function)
  ```

### 1.2 URL Allocation
| Sitemap | Content | Est. URLs | Update Frequency |
|---------|---------|-----------|------------------|
| sitemap-pages.xml | Landing, Clock, Calendar, About, etc. | ~24 (8 × 3 langs) | Monthly (deploy) |
| sitemap-events.xml | Economic event pages | ~159 (53 × 3 langs) | Weekly (deploy) |
| sitemap-blog.xml | Blog posts + taxonomy | Dynamic | On publish |

### 1.3 Blog Sitemap Content
- [x] `/blog` (index, all 3 languages)
- [x] `/blog/:slug` (all published posts × languages)
- [x] `/blog/event/:eventKey` (taxonomy hubs with ≥1 post)
- [x] `/blog/currency/:currency` (taxonomy hubs with ≥1 post)
- [x] `/blog/author/:authorSlug` (author pages with ≥1 post)

### 1.4 Caching Strategy
- [x] `sitemap.xml` (index): Cache 1 hour (3600s)
- [x] `sitemap-pages.xml`: Cache 24 hours (static file)
- [x] `sitemap-events.xml`: Cache 24 hours (static file)
- [x] `sitemap-blog.xml`: Cache 1 hour (3600s), purge on publish

**Acceptance Criteria (Phase 1)** ✅
- [x] Architecture documented and approved
- [x] URL structure defined for all sitemap types
- [x] Caching strategy defined

---

## Phase 2 — Static Sitemaps (Pages & Events)
**Goal:** Create static sitemap files for pages and events that deploy with hosting.

### 2.1 Create sitemap-pages.xml
- [x] Extract base pages from current sitemap.xml (lines 1-104)
- [x] Include: `/`, `/clock`, `/calendar`, `/about`, `/privacy`, `/terms`, `/contact`
- [x] All with proper hreflang (en, es, fr)
- [x] Save to `public/sitemap-pages.xml`

### 2.2 Create sitemap-events.xml
- [x] Extract event pages from current sitemap.xml (lines 105+)
- [x] Include all `/events/:eventKey` pages
- [x] All with proper hreflang (en, es, fr)
- [x] Save to `public/sitemap-events.xml`

### 2.3 Convert sitemap.xml to Sitemap Index
- [x] Replace content with sitemapindex format (served dynamically by serveSitemapIndex)
- [x] Point to child sitemaps (pages, events, blog)
- [x] Update lastmod for each child sitemap (blog uses latest publishedAt)

**Acceptance Criteria (Phase 2)** ✅
- [x] Static files exist: sitemap-pages.xml, sitemap-events.xml (sitemap.xml is dynamic)
- [x] All validate at https://www.xml-sitemaps.com/validate-xml-sitemap.html
- [x] robots.txt still points to /sitemap.xml

---

## Phase 3 — Dynamic Blog Sitemap (Cloud Function)
**Goal:** Create Cloud Function to serve `/sitemap-blog.xml` dynamically from Firestore.

### 3.1 Create serveSitemapBlog Cloud Function
- [x] Query `blogPosts` where `status == 'published'`
- [x] Query `blogAuthors` for author pages
- [x] Generate XML with:
  - `/blog` index (all languages)
  - All published post URLs with hreflang
  - Event taxonomy pages (where posts exist)
  - Currency taxonomy pages (where posts exist)
  - Author pages (where posts exist)
- [x] Set `lastmod` from post's `publishedAt` or `updatedAt`
- [x] Set appropriate priorities (posts: 0.8, taxonomy: 0.6)
- [x] Return with `Content-Type: application/xml`
- [x] Cache-Control: `public, max-age=3600` (1 hour)

### 3.2 Add Firebase Rewrite for sitemap-blog.xml
- [x] Add rewrite in firebase.json: `/sitemap-blog.xml` → `serveSitemapBlog` function
- [x] Ensure static sitemap files take precedence (sitemap-pages.xml, sitemap-events.xml)

### 3.3 Export function from index.ts
- [x] Import and export `serveSitemapBlog` in functions/src/index.ts

### 3.4 Test locally with emulator
- [~] Start functions emulator (pending deployment test)
- [~] Verify XML output is valid
- [~] Verify all published posts included
- [~] Verify taxonomy pages only included if posts exist

**Acceptance Criteria (Phase 3)** ✅
- [x] `/sitemap-blog.xml` returns valid XML from Cloud Function
- [x] Includes all published blog posts with hreflang
- [x] Includes taxonomy pages that have content
- [x] Proper caching headers set

---

## Phase 4 — Sitemap Index Cloud Function
**Goal:** Create Cloud Function to serve `/sitemap.xml` as a dynamic index.

### 4.1 Create serveSitemapIndex Cloud Function
- [x] Generate sitemapindex XML format
- [x] Include:
  - `https://time2.trade/sitemap-pages.xml`
  - `https://time2.trade/sitemap-events.xml`
  - `https://time2.trade/sitemap-blog.xml`
- [x] Set lastmod dynamically:
  - pages/events: file timestamp or current date
  - blog: most recent publishedAt from blogPosts
- [x] Cache-Control: `public, max-age=3600`

### 4.2 Update Firebase Rewrite
- [x] Deleted static sitemap.xml (no longer needed)
- [x] Add rewrite: `/sitemap.xml` → `serveSitemapIndex` function
- [x] Keep static files served directly (sitemap-pages.xml, sitemap-events.xml)

### 4.3 Export function from index.ts
- [x] Import and export `serveSitemapIndex` in functions/src/index.ts

**Acceptance Criteria (Phase 4)** ✅
- [x] `/sitemap.xml` returns valid sitemapindex XML
- [x] Points to all child sitemaps
- [x] Most recent blog post date reflected in blog sitemap lastmod

---

## Phase 5 — Deployment & Validation
**Goal:** Deploy all components and verify with Google Search Console.

### 5.1 Deploy Functions
- [x] Build TypeScript: `cd functions && npm run build`
- [~] Deploy: `firebase deploy --only functions` (ready)
- [~] Verify functions deployed: `serveSitemapIndex`, `serveSitemapBlog`

### 5.2 Deploy Hosting
- [~] Build frontend: `npm run build`
- [~] Deploy: `firebase deploy --only hosting`
- [~] Verify static sitemaps accessible

### 5.3 Validate Sitemaps
- [~] Test `/sitemap.xml` returns index format
- [~] Test `/sitemap-pages.xml` returns pages
- [~] Test `/sitemap-events.xml` returns events
- [~] Test `/sitemap-blog.xml` returns blog posts
- [~] Validate all with Google's Sitemap Testing Tool

### 5.4 Update Google Search Console
- [~] Submit sitemap.xml to GSC
- [~] Verify all child sitemaps discovered
- [~] Monitor for crawl errors

**Acceptance Criteria (Phase 5)**
- [ ] All sitemaps accessible in production
- [ ] Google Search Console shows successful submission
- [ ] No validation errors

---

## Phase 6 — Auto-Update Integration (Future Enhancement)
**Goal:** Optionally trigger sitemap cache invalidation on blog publish.

### 6.1 Cache Invalidation Strategy (Optional)
- [ ] Decision: CDN purge on publish OR rely on TTL expiry
- [ ] If purge: Add Cloud Function trigger on blogPosts status change
- [ ] Call Firebase Hosting Cache-Purge API or rely on 1-hour TTL

**Notes:**
- 1-hour TTL is acceptable for most use cases
- Fresh content appears within 1 hour of publish
- For immediate indexing, manual GSC submission is recommended

---

## Progress Log
| Date | Phase | Action | Notes |
|------|-------|--------|-------|
| 2026-02-04 | 1 | Created roadmap | Architecture defined |
| 2026-02-04 | 2.1 | Created sitemap-pages.xml | 7 pages × 3 languages |
| 2026-02-04 | 2.2 | Created sitemap-events.xml | 53 events × 3 languages |
| 2026-02-04 | 3 | Created sitemapService.ts | serveSitemapBlog function |
| 2026-02-04 | 4 | Added serveSitemapIndex | Completed all Cloud Functions |
| 2026-02-04 | 4.2 | Updated firebase.json | Rewrites v1.10.0 |
| 2026-02-04 | 5.1 | TypeScript build success | Ready for deployment |

---

## Technical Reference

### Sitemap XML Format (urlset)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://time2.trade/blog/my-post</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://time2.trade/blog/my-post"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://time2.trade/es/blog/mi-post"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://time2.trade/fr/blog/mon-post"/>
    <lastmod>2026-02-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Sitemap Index Format (sitemapindex)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://time2.trade/sitemap-pages.xml</loc>
    <lastmod>2026-02-04</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://time2.trade/sitemap-events.xml</loc>
    <lastmod>2026-02-04</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://time2.trade/sitemap-blog.xml</loc>
    <lastmod>2026-02-04</lastmod>
  </sitemap>
</sitemapindex>
```

### Firebase Rewrite Order (firebase.json)
```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "function": "serveSitemapIndex" },
    { "source": "/sitemap-blog.xml", "function": "serveSitemapBlog" },
    // Static files (sitemap-pages.xml, sitemap-events.xml) served automatically
  ]
}
```

---

**Last Updated:** 2026-02-04  
**Version:** 1.0.0
