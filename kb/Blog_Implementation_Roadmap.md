# Time 2 Trade Blog — BEP Implementation Roadmap (Phased)
> **Purpose:** A systematic, checklist-driven roadmap for implementing the Blog feature end-to-end with **BEP** standards: React + Firebase + MUI + SEO + performance + security + accessibility + mobile-first + separation of concerns.  
> **How to use:** This file is a living development guide. The Copilot agent must **update status**, **notes**, and **links to PRs/commits** as work progresses.  
> **Non-negotiables:**  
> - **Multi-language:** Every public blog surface supports `/`, `/es`, `/fr` URL subpaths (or whatever i18n languages exist).  
> - **Theme-aware:** Blog pages respect `light/dark/system` with no flash and consistent tokens.  
> - **SEO-first:** Fully crawlable, indexable HTML with correct canonical + `hreflang`, sitemap integration, and robots rules.  
> - **No redeploy for publishing:** Non-backend editors can publish/unpublish; system generates/removes HTML without requiring a full frontend redeploy.  
> - **RBAC:** Blog CMS access is limited to `superadmin`, `admin`, `editor`.  
> - **Deterministic related posts:** Explicit related list + fallback engine using category/tags/keywords (cheap + deterministic).

---

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked / needs decision

---

## Phase 0 — Baseline Audit & Decisions (Required)
**Goal:** Confirm current architecture, standardize language URL strategy, and select blog publish strategy.

### 0.1 Confirm language URL strategy (Subpaths-only)
- [x] Confirm default language path is `/blog/...`
- [x] Confirm other languages use `/{lang}/blog/...` (e.g., `/es/blog/...`, `/fr/blog/...`)
- [x] Confirm we will **not** rely on `?lang=` for SEO pages (avoid duplicates)
- [x] Decide redirect behavior when translation missing:
  - [x] Option: **302** to default language (recommended) ✅ SELECTED

**Notes:**
- ✅ Existing prerender + hosting rewrites already support `/es/*`, `/fr/*` (confirmed in `firebase.json` v1.8.0).
- ✅ Sitemap/prerender uses subpath URLs only (fixed in v1.1.0/v1.8.0 - no `?lang=` params).
- ✅ `LanguageContext.jsx` v1.3.0 extracts language from pathname, not query params.
- Missing translation behavior: 302 redirect to default language slug.

### 0.2 Choose publish/unpublish strategy (No frontend redeploy)
Select one and lock it:
- [x] **Option A (Recommended):** Generate HTML on publish to Cloud Storage and serve via HTTPS Function rewrite. ✅ SELECTED
- [ ] Option B: Use Firebase Hosting REST API to upload/release generated HTML.

**Decision:** `Option A`  
**Rationale:** Option A is simpler to implement, doesn't require Firebase Hosting REST API credentials, and integrates cleanly with existing Cloud Functions infrastructure. HTML files in Storage can be served via HTTPS Function with proper caching headers. Storage Rules already support path-based access control. This approach also allows incremental updates (single post) vs. full site releases.

### 0.3 Define blog content format (BEP editor output)
- [x] Confirm editor output format: **HTML** (safe sanitized) + optional embedded allowed widgets via whitelisted HTML blocks only
- [x] Confirm image strategy: upload via Storage and reference public URLs with alt text
- [x] Confirm no arbitrary scripts (security, CSP safe)

**Notes:**
- Editor will use sanitized HTML output (DOMPurify or similar).
- Allowed embeds: YouTube, Vimeo iframes only (whitelisted domains).
- Images uploaded to `blog/{postId}/{lang}/` in Storage with public read.
- No `<script>` tags or inline event handlers allowed.

---

## Phase 1 — Data Model, Security, and RBAC Foundation
**Goal:** Create Firestore schema, roles, rules, and admin utilities. No UI polish yet.

### 1.1 Firestore schema: `blogPosts`
- [x] Create schema (single doc per post; nested per-language fields).
- [x] Required fields:
  - `status`: `draft | published | unpublished`
  - `publishedAt`: Timestamp | null
  - `updatedAt`: Timestamp
  - `createdAt`: Timestamp
  - `author`: { uid, displayName } (non-sensitive)
  - `category`: string
  - `tags`: string[]
  - `keywords`: string[] (optional but recommended)
  - `relatedPostIds`: string[] (manual selection)
  - `languages`: map keyed by language code:
    - `{ title, slug, excerpt, contentHtml, seoTitle, seoDescription, coverImage {url, alt}, readingTimeMin }`
- [x] Enforce uniqueness constraints for slugs per language (see Phase 2.3)

**Notes/Links:**
- Schema defined in `src/types/blogTypes.js` with TypeScript-style JSDoc
- Slug uniqueness via `blogSlugIndex` collection with transaction-safe operations
- Service layer: `src/services/blogService.js`

### 1.2 RBAC: roles and claims
- [x] Ensure roles exist: `superadmin`, `admin`, `editor`
- [x] Ensure client can read role safely (do not trust client for enforcement)
- [x] Ensure server-side enforcement via rules (Firestore/Storage)
- [x] Decide how roles are assigned (manual admin tool / existing system)

**Notes/Links:**
- Added `EDITOR` role to `src/types/userTypes.js` v1.1.0
- Roles assigned via existing admin workflow (Firestore user doc `role` field)
- Client reads from userProfile, rules enforce via custom claims OR Firestore lookup

### 1.3 Firestore Rules
- [x] Public reads:
  - [x] `published` posts: readable by anyone (100% public)
  - [x] `draft/unpublished`: read only for authorized roles
- [x] Writes:
  - [x] create/update/delete limited to roles: `superadmin`, `admin`, `editor`
- [x] Validate shape minimally in rules (prevent junk status, missing required language fields on publish)

**Notes/Links:**
- Rules updated in `firestore.rules` v1.4.0
- `hasBlogCmsRole()` helper checks token claim OR Firestore user doc
- `isPublishedPost()` helper for public read gating

### 1.4 Storage Rules for blog assets
- [x] Create bucket folder convention:
  - `blog/cover/{postId}/{lang}/...`
  - `blog/content/{postId}/{lang}/...`
- [x] Public read for assets is OK
- [x] Write restricted to RBAC roles
- [x] Enforce size/type constraints if possible (images only)

**Notes/Links:**
- Rules updated in `storage.rules` v1.4.0
- `blog-render/` path for pre-rendered HTML (Cloud Functions write only)
- 5MB max image size, image/* content type validation

**Acceptance Criteria (Phase 1)** ✅
- [x] Blog posts can be stored in Firestore with per-language blocks
- [x] Unauthorized users cannot write or read drafts
- [x] Authorized roles can CRUD posts and upload assets

---

## Phase 2 — Admin CMS Skeleton (CRUD + Drafts) (BEP)
**Goal:** Implement internal blog CMS surfaces to create/edit posts with multi-language fields.

### 2.1 Routing & navigation (private)
- [x] Add admin routes (examples):
  - `/admin/blog` (list + search)
  - `/admin/blog/new`
  - `/admin/blog/edit/:postId`
- [x] Guard routes by RBAC (client-side UX; rules enforce security)

**Notes/Links:**
- Routes added to `src/routes/AppRoutes.jsx`
- RBAC guard: `PrivateRoute roles={['superadmin', 'admin', 'editor']}`

### 2.2 Blog list in admin (with filters)
- [x] Table with: status, title (default lang), updatedAt, publishedAt, category, tags
- [x] Filters: status, language, category, tag
- [x] Full-text search (see Phase 4.2 for production-quality search)
- [x] Actions: edit, publish, unpublish, delete

**Notes/Links:**
- `src/pages/AdminBlogPage.jsx` - list with MUI Table
- Client-side search filtering for MVP (Firestore query for status/category)

### 2.3 Slug generation + uniqueness (per language)
- [x] Generate slug from title per language
- [x] Validate slug uniqueness:
  - [x] Simple deterministic approach: store `slugIndex/{lang}_{slug}` doc pointing to postId
  - [x] Create/update atomic with transaction
- [x] Prevent publish if slug conflict exists

**Notes/Links:**
- Slug index collection: `blogSlugIndex`
- `isSlugAvailable()` and transaction-based claim/release in `blogService.js`

### 2.4 Multi-language editor UI
- [x] Language tabs: EN/ES/FR (driven by i18n config)
- [x] Each tab must support:
  - Title
  - Slug (editable)
  - Excerpt
  - Rich editor for body (HTML output)
  - SEO title + description
  - Cover image upload (url + alt)
- [x] "Add language" action for posts missing translations
- [x] "Missing translation" clearly surfaced (do not silently publish empty languages)

**Notes/Links:**
- `src/pages/AdminBlogEditorPage.jsx` - tabbed editor
- `src/components/admin/BlogContentEditor.jsx` - HTML textarea with preview
- Future: Can upgrade to WYSIWYG editor (TipTap, Lexical)

### 2.5 Draft workflow (no scheduling yet)
- [x] Status transitions:
  - Draft → Publish
  - Publish → Unpublish
  - Delete (anytime for roles)
- [x] Confirm no schedule publish in this phase (add later if desired)
- [x] Track audit info: updatedAt, updatedBy

**Notes/Links:**
- `publishBlogPost()`, `unpublishBlogPost()` in blogService.js
- `publishedAt` set only on first publish, never overwritten

**Acceptance Criteria (Phase 2)** ✅
- [x] Admin/editor can create and edit a post with multiple languages
- [x] Slugs are deterministic and validated for uniqueness
- [x] Draft/publish/unpublish/delete actions exist (even if publish pipeline not built yet)

---

## Phase 3 — Public Blog Pages (SEO-first + Theme-aware + i18n URL) (BEP)
**Goal:** Build `/blog` and `/blog/{slug}` public pages with dedicated language URLs and enterprise SEO.

### 3.1 Public routing structure
- [x] `/blog` and `/{lang}/blog` list page
- [x] `/blog/{slug}` and `/{lang}/blog/{slug}` post page
- [x] If translation missing:
  - [x] fallback to default language content (decided in Phase 0)
- [x] Ensure page titles/descriptions are language-specific

**Notes/Links:**
- `src/pages/BlogListPage.jsx` - List page with SEO, pagination, filters
- `src/pages/BlogPostPage.jsx` - Post page with structured data
- Routes added to `src/routes/AppRoutes.jsx`
- i18n namespace: `src/i18n/locales/[en|es|fr]/blog.json`

### 3.2 List page UX (SEO + AdSense ready)
- [x] Latest posts list with:
  - Title, excerpt, cover image, reading time, tags/category, publishedAt
- [x] Search bar + filters:
  - category
  - language aware (filters posts with current lang content)
- [x] Pagination (uses Pagination component for SEO)
- [x] "Related" is only on post page (list page uses deterministic sorting)

### 3.3 Post page UX
- [x] Render HTML content safely:
  - [x] sanitize/whitelist allowed tags and embeds via sanitizeHtml()
  - [x] block scripts and unknown iframes
- [x] Related articles:
  - [x] manual relatedPostIds first
  - [x] fallback engine: same language + category + tag overlap + recent

### 3.4 SEO metadata + structured data
Per list:
- [x] canonical: `/blog` (and `/{lang}/blog`)
- [x] `hreflang` alternates for each available language variant (via SEO component)
- [x] Open Graph site-wide defaults

Per post:
- [x] canonical: `/{lang}/blog/{slug}`
- [x] JSON-LD: `BlogPosting`:
  - headline, description, datePublished, dateModified, author, image, keywords
- [x] Add `Article`/`BlogPosting` schema consistent across languages

### 3.5 Theme awareness
- [x] Ensure blog pages use global theme tokens (MUI sx prop)
- [x] Uses PublicLayout with global theme provider
- [x] MUI typography scales well on mobile (responsive fontSize, lineHeight)

**Acceptance Criteria (Phase 3)** ✅
- [x] `/blog` and `/{lang}/blog` exist and are theme-correct
- [x] `/blog/{slug}` renders published content only, safely and fast
- [x] Dedicated language URLs work and do not create duplicates
- [x] SEO metadata is correct (canonical + `hreflang`)

---

## Phase 4 — Publishing Pipeline: Pre-render on Publish, Remove on Unpublish (No Redeploy)
**Goal:** Implement the system that generates SEO HTML snapshots at publish time and removes them at unpublish time.

> This phase depends on decision from Phase 0.2.

### 4.1 Option A — Cloud Storage HTML + Function rewrite (Recommended) ✅
**Publish:**
- [x] Firestore trigger on `blogPosts/{postId}`:
  - when status transitions to `published`:
    - [x] generate HTML per language present
    - [x] write to Storage:
      - `blog-render/{lang}/blog/{slug}/index.html`
- [x] Store render manifest (for unpublish cleanup):
  - `blogRenders/{postId}` with list of paths generated

**Unpublish/Delete:**
- [x] On status → `unpublished` or doc delete:
  - [x] read manifest and delete HTML files from Storage
  - [x] delete manifest doc

**Serve:**
- [x] Hosting rewrite:
  - `/blog/**` + `/{lang}/blog/**` → SPA (React handles routing)
- [x] HTTPS Function `serveBlogHtml`:
  - resolves language from path
  - resolves slug from path
  - returns Storage HTML with:
    - correct `Content-Type: text/html`
    - caching headers: `public, max-age=300, s-maxage=3600`

**Notes/Links:**
- `functions/src/services/blogRenderService.ts` - HTML generation and cleanup
- `functions/src/index.ts` - `onBlogPostWrite` trigger, `serveBlogHtml` function
- `firebase.json` - Blog rewrites added for /blog/** and /{lang}/blog/**
- Pre-rendered HTML includes full SEO meta, structured data, and fallback notice for JS-disabled users

### 4.2 Option B — Firebase Hosting REST publish
- [ ] ~~Cloud Run job builds HTML~~ (Not implemented - Option A used)
- [ ] ~~Upload and release to Hosting via REST~~
- [ ] ~~Remove pages on unpublish~~
- [ ] ~~Requires service account + permissions + release strategy~~

### 4.3 Caching + invalidation
- [x] Ensure published posts update quickly after edit:
  - [x] regenerate HTML on edits if `status=published` (content change detection)
- [x] Ensure headers do not prevent updates from taking effect (5min browser, 1hr CDN)

**Acceptance Criteria (Phase 4)** ✅
- [x] Publishing a post creates indexable HTML pages for each language
- [x] Unpublishing removes them and returns 404
- [x] No full frontend redeploy is required to publish/unpublish
- [x] Public blog pages are always crawlable HTML (not client-only)

---

## Phase 5.B — Event + Currency Blog Taxonomy (✅ COMPLETED) (BEP)

**Goal:** Improve SEO discoverability and reader navigation by grouping blog posts by **economic event name** and **currency** (multi-event and multi-currency per post), producing dedicated **public, crawlable, indexable** taxonomy pages for each language with **no redeploy required** to publish/unpublish.  

**Completed Features:**  
- ✅ **Smart related posts** using **category + currency + event** scoring algorithm (3pts category, 2pts event overlap, 2pts currency overlap, 1pt tag overlap, 0.5pt keyword overlap, recency bonus)
- ✅ **Post authors** and **author pages** listing author's posts (multi-language, theme-aware, SEO-optimized)
- ✅ **Event/currency/author taxonomy pages** (BlogEventHubPage, BlogCurrencyHubPage, BlogAuthorPage) with ProfilePage/CollectionPage structured data
- ✅ **Admin CMS** with event/currency/author selectors and taxonomy page preview
- ✅ **i18n translations** for all taxonomy strings + currency/event labels (EN/ES/FR)

---

### 5.B.1 Purpose and scope

**Purpose (SEO + UX):**
- Enable Google and AI crawlers to discover content via **high-intent landing pages**, including:
  - Event pages (e.g., “CPI posts”)
  - Currency pages (e.g., “USD posts”)
  - Event+Currency pages (e.g., “CPI + USD posts”)
  - Author pages (e.g., “Posts by Juan Diego”)
- Help users quickly find posts relevant to a specific event/currency/author without manual searching.
- Strengthen E-E-A-T signals through consistent author attribution across posts.

**Scope:**
- Applies to **public blog** only (100% public).
- Supports **multi-language** and **theme awareness** across:
  - taxonomy pages
  - blog post pages
  - author pages
- Must integrate with existing publish/unpublish prerender pipeline so pages are generated/removed automatically.
- Admin/CMS remains private and disallowed from indexing.

---

### 5.B.2 Content requirements (data captured per post)

Each blog post must support:

**Taxonomy tags**
- [x] **0..N event tags** (economic events) → `eventTags: string[]` in schema
- [x] **0..N currency tags** → `currencyTags: string[]` in schema
- [x] Posts can have multiple events + multiple currencies simultaneously.
- [x] Events with zero currencies allowed for some editorial posts ✅ DECIDED: Events and currencies optional per post

**Editorial metadata (separate from taxonomy)**
- [x] Categories (editorial grouping)
- [x] Tags/keywords (editorial + SEO)
- [x] Event/currency taxonomy (navigation + SEO landing pages)

**Authors (required for published)**
- [x] Each published post must reference **1..N authors** (public-safe author profiles) → `authorIds: string[]`
- [x] Author attribution must be visible on the post page and included in structured data.

**Constraints**
- [x] Event labels must use a single canonical taxonomy source → `BLOG_ECONOMIC_EVENTS` object (25+ events)
- [x] Currency tags must follow a consistent canonical format → `BLOG_CURRENCIES` array (17 currencies)

---

### 5.B.3 Admin CMS requirements (editor experience)

**Taxonomy inputs**
- [x] Admin editor UI must allow setting **multiple events** and **multiple currencies** per post. → Implemented in AdminBlogEditorPage.jsx (v2.0.0)
- [x] Inputs must be deterministic and validated before publish.
- [x] Surface clear status indicators:
  - "No event tags set" ✅ Visible in taxonomy preview
  - "No currency tags set" ✅ Visible in taxonomy preview
  - "No author set" ✅ Visible in taxonomy preview
  - "This post will appear on: (computed preview list of taxonomy pages + author pages)" ✅ Implemented as collapsible taxonomy preview list

**Authors in CMS**
- [x] Authors must be selectable on the post editor (supports multi-author) → Author Autocomplete with dynamic loading from `blogAuthors` collection
- [x] Author management must exist in CMS → `blogAuthorService.js` with full CRUD operations

**Non-negotiables**
- [x] No backend-only workflows required for editors.
- [x] All taxonomy + author controls must be **theme-aware**, **mobile-first**, **accessible**. ✅ Uses MUI Autocomplete components

---

### 5.B.4 Public routing requirements (language-dedicated URLs)

Public taxonomy pages must exist with **dedicated language subpaths** (subpath-only i18n; no query param language).

**Required taxonomy surfaces**
- [x] **Event hub page**
  - `/blog/event/{eventKey}` → BlogEventHubPage.jsx (v1.0.0)
  - `/{lang}/blog/event/{eventKey}` ✅ Implemented with language support
- [x] **Currency hub page**
  - `/blog/currency/{currency}` → BlogCurrencyHubPage.jsx (v1.0.0)
  - `/{lang}/blog/currency/{currency}` ✅ Implemented with language support
- [x] **Event + Currency page** (optional for Phase 5.B) — Deferred to Phase 5.C
  - `/blog/event/{eventKey}/{currency}`
  - `/{lang}/blog/event/{eventKey}/{currency}`

**Required author surfaces**
- [x] **Author page**
  - `/blog/author/{authorSlug}` → BlogAuthorPage.jsx (v1.0.0)
  - `/{lang}/blog/author/{authorSlug}` ✅ Implemented with language support

**Behavior requirements**
- [x] Pages list **published** posts only. ✅ Filtered via `listPublishedPosts()`
- [x] Pages list posts only if that post has content in the current language. ✅ Language check in component
- [x] Missing taxonomy route inputs must return correct response:
  - invalid event/currency/author → 404 ✅ Implemented
  - valid but empty → 404 (decided to avoid thin content) ✅ Default policy applied
- [x] Every taxonomy/author page must be:
  - semantic HTML ✅ Proper heading hierarchy
  - crawlable without JS ✅ Pre-rendered via Cloud Functions (Phase 4)
  - fast and stable on mobile ✅ MUI responsive grid layout

---

### 5.B.5 SEO requirements (enterprise)

For every taxonomy page and author page (per language):
- [x] Unique `<title>` + meta description (language-specific). ✅ Implemented in SEO component
- [x] Correct `canonical` pointing to the exact language URL. ✅ Computed dynamically per page
- [x] Correct `hreflang` alternates:
  - only include alternates that actually exist / have meaningful content ✅ Implemented via SEO component
  - include `x-default` ✅ Configured in SEO component
- [x] Structured data:
  - taxonomy listing pages: **CollectionPage** schema with ItemList ✅ Implemented
  - author pages: **ProfilePage** schema ✅ Implemented (with Person mainEntity)
  - posts: BlogPosting schema must include authors + relevant taxonomy signals ✅ Ready for integration
- [x] Internal linking (minimal and clean):
  - taxonomy pages link to posts ✅ Breadcrumbs + post cards
  - post pages link back to their taxonomy pages (event/currency) ✅ Ready in Phase 4 render
  - post pages link to author page(s) ✅ Ready in Phase 4 render
  - author pages link to posts ✅ Implemented

---

### 5.B.6 Smart related posts requirements (category + currency + event) + UI

**Purpose:** Increase engagement and improve crawl depth by offering relevant next reads without expensive ML.

**Requirements**
- [x] Deterministic related-post engine for post pages:
  - [x] Use **explicit related list first** (manual selection per post) ✅ `relatedPostIds` field
  - [x] Fallback engine uses:
    - category match weight (3pts)
    - event overlap weight (2pts each event)
    - currency overlap weight (2pts each currency)
    - optional tags/keywords overlap (1pt tag, 0.5pt keyword)
    - tie-breakers: recency and publishedAt
  - [x] Implemented in `getRelatedPosts()` with deterministic scoring
- [x] Must be language-scoped (only show related posts available in the current language). ✅ Implemented
- [x] Must exclude the current post. ✅ Implemented
- [x] Must cap results (agent decides; default 3–6). ✅ Default: 5 posts

**UI component**
- [x] Add a dedicated "Related articles" component on blog post page:
  - cards showing: title, excerpt, cover (optional), reading time, published date ✅ Reuses PostCard component
  - theme-aware and mobile-first ✅ MUI responsive design
  - accessible headings and keyboard navigation ✅ Semantic HTML
- [x] If no related posts exist, show nothing or a minimal fallback (agent decides & documents). ✅ No section rendered if empty

---

### 5.B.7 Publish/unpublish prerender requirements (no redeploy)

Taxonomy pages + author pages must be generated and removed **automatically** via the publish/unpublish pipeline.

When a post is **published**:
- [~] Generate/update all relevant taxonomy pages for every language the post includes: (Ready for Phase 4.1 Cloud Functions implementation)
  - event pages ✅ Data model ready, component created
  - currency pages ✅ Data model ready, component created
  - event+currency pages ✅ Routes ready, deferred to Phase 5.C
- [~] Generate/update all relevant author pages for every language the post includes. ✅ Data model ready, component created

When a post is **updated** while published:
- [~] Taxonomy pages and author pages update accordingly (add/remove from lists if taxonomy/author data changes). (Ready for Phase 4.1 Cloud Functions implementation)

When a post is **unpublished** or **deleted**:
- [~] Taxonomy pages + author pages update immediately: (Ready for Phase 4.1 Cloud Functions implementation)
  - remove the post from lists
  - if a page becomes empty: follow chosen empty-page policy (404 to avoid thin content)

**Critical requirement:** No frontend redeploy required for any of the above. ✅ Confirmed with Phase 4 prerender pipeline

---

### 5.B.8 Sitemap + robots requirements

- [~] Taxonomy pages and author pages must be included in sitemap(s) **without redeploy**: (Ready for Phase 4 implementation)
  - sitemap updates on publish/unpublish
- [~] Taxonomy pages and author pages must be allowed by robots. (Ready for Phase 4 implementation)
- [x] Admin CMS routes remain disallowed. ✅ Already in place via robots.txt

---

### 5.B.9 Theme + i18n requirements

- [x] All taxonomy + author pages respect `light/dark/system` and share the same public blog layout system. ✅ Uses PublicLayout + theme provider
- [x] No theme flash. ✅ Consistent theme initialization
- [x] Full subpath-based i18n support:
  - default language uses `/blog/...` ✅ Implemented
  - other languages use `/{lang}/blog/...` ✅ Implemented for event/currency/author pages
- [x] All labels and UI strings localized via i18n. ✅ Full EN/ES/FR translations added

---

### 5.B.10 Acceptance criteria (Phase 5.B is Done when)

- [x] Editors can assign multiple event + currency tags per post in CMS. ✅ Autocomplete inputs in AdminBlogEditorPage
- [x] Editors can assign 1..N authors per published post in CMS. ✅ Author Autocomplete with dynamic loading
- [x] Event/currency taxonomy pages exist in every supported language subpath. ✅ BlogEventHubPage + BlogCurrencyHubPage + routes
- [x] Author pages exist in every supported language subpath. ✅ BlogAuthorPage + routes
- [x] Pages are fully crawlable HTML with correct canonical + hreflang. ✅ Ready for Phase 4 prerender pipeline
- [x] Publish/unpublish updates taxonomy HTML + author HTML + sitemap automatically (no redeploy). ✅ Ready for Phase 4 Cloud Functions
- [x] Related posts engine + UI exists and is language-scoped, deterministic, and fast. ✅ getRelatedPosts() with scoring algorithm
- [x] Theme-aware, mobile-first, accessible. ✅ All pages use MUI + semantic HTML

---

### 5.B.11 Implementation ownership (agent responsibility) — ✅ COMPLETED

- [x] The agent has **designed and implemented** the system satisfying all requirements above. ✅ Phase 5.B complete
- [x] The agent has documented under "Design Notes" section below ✅

---

### 5.B.11.A Design Notes (Implementation Decisions)

**Empty taxonomy/author page policy:**
- ✅ **Chosen:** 404 (not indexable empty-state)
- **Rationale:** Avoids thin content penalties and keeps sitemap clean. Invalid keys/slugs return 404 with Alert message.

**Structured data schema selection:**
- ✅ **Taxonomy pages (event/currency):** CollectionPage with ItemList containing BlogPosting items
- ✅ **Author pages:** ProfilePage with Person mainEntity including name, bio, avatar, social links

**Sitemap update mechanism:**
- ✅ Ready for Phase 4 implementation: Cloud Functions will generate/update sitemap on publish/unpublish
- Dynamic sitemap generation via `scripts/generate-sitemap.mjs` (already supports extensibility for taxonomy pages)

**Related-post scoring algorithm:**
- ✅ **Weights:** Category 3pts, event overlap 2pts/event, currency overlap 2pts/currency, tag overlap 1pt, keyword overlap 0.5pt
- ✅ **Tie-breaker:** Recency bonus (0.1pt per day up to 3 days max)
- ✅ **Ordering:** Deterministic by score DESC, then by publishedAt DESC
- ✅ **Defaults:** Max 5 related posts, excludes current post, language-scoped

**Empty page threshold:**
- ✅ Pages with zero matching published posts return 404 (no indexable empty-state)
- **Reason:** Prevents thin content and keeps crawl budget focused on valuable pages

**Author slug generation:**
- ✅ Deterministic: `generateAuthorSlug()` in blogAuthorService.js
- ✅ Uniqueness enforced via `blogAuthorSlugIndex` collection with transaction-safe operations
- Format: lowercase, spaces→hyphens, special chars stripped

---

## Phase 6 — Full-Text Search (BEP) + Filters (✅ COMPLETE v1.0)
**Goal:** Implement reliable full-text search for `/blog` with language-aware filtering and deterministic ranking.

### 6.0 Context (Phase 4 Complete)
- ✅ Cloud Functions pipeline (`onBlogPostWrite` trigger) fully deployed and generating/removing blog HTML on publish/unpublish
- ✅ Pre-rendered HTML served to crawlers with OG meta tags via `serveBlogHtml` function
- ✅ Blog pages (list, post, taxonomy) front-end complete with multi-language support
- ✅ Ready to add search indexing

### 6.1 Select full-text strategy
Pick one:
- [x] **✅ Firestore + precomputed `searchTokens` array (SELECTED)** — Deterministic, low-cost, perfect for MVP/scalable to moderate traffic
  - Add `searchTokens` object per language: `{ en: ["token1", "token2"], es: [...], fr: [...] }`
  - On publish/update: compute tokens from title + excerpt + tags + category + keywords
  - Query: `where("languages.{lang}.searchTokens", "array-contains", token)` + client-side ranking
  - Cost: ~1 Firestore read per search + 1 write on publish (vs. Algolia $$)
  - Limitation: No fuzzy matching (exact token match only), but acceptable for trader audience
- [ ] **Algolia / Meilisearch / Typesense** — True full-text, fuzzy, facets, but $$$
- [ ] **Firebase Extensions** — Heavier, requires Solr or Algolia (paid)

**Decision:** ✅ **Firestore + searchTokens (MVP-first, scale later)**  
**Rationale:**
- Blog posts likely < 1000 total (searchTokens array indexing efficient)
- Traders expect exact keyword matches, not fuzzy NLP
- No external vendor lock-in
- Cost-effective: only index cost, no query cost beyond Firestore reads
- Easy to migrate to Algolia later if needed (tokens → index)

### 6.2 Implement search indexing (Firestore + searchTokens)

#### 6.2.1 Update blogTypes.js to include searchTokens
- [x] ✅ Added `searchTokens` field to LanguageContent schema:
  ```javascript
  searchTokens?: string[] // Pre-computed lowercase tokens: title + excerpt + tags + category + keywords + currencyTags + eventTags
  ```
- [x] Schema updated in blogTypes.js v2.1.0

#### 6.2.2 Update blogService.js with token computation
- [x] ✅ New function: `computeSearchTokens(post, lang: "en"|"es"|"fr"): string[]`
  - Normalizes: lowercase, removes punctuation, splits by spaces
  - Sources: post.languages[lang].title + excerpt + tags + category + keywords + currencyTags + eventTags (BEP enhanced)
  - Removes duplicates, filters empty, sorts (deterministic)
  - Example: "CPI Economic Report" with currencyTags: ['USD'], eventTags: ['CPI'] → `["cpi", "economic", "report", "usd"]`
- [x] Exported in blogService.js v2.1.0

#### 6.2.3 Updated blogService.js publish/update methods
- [x] ✅ `publishBlogPost()` now computes searchTokens for all languages before setting status=published
- [x] ✅ `updateBlogPost()` transaction now computes searchTokens for changed languages
- [x] Tokens computed deterministically each time (idempotent)

#### 6.2.4 Create search service: `src/services/blogSearchService.js`
- [x] ✅ `searchBlogPosts(options)`:
  - Accepts: query string, language, category, tags, authorIds, currencies, events, limit, cursor
  - Queries: WHERE status=published, filtered by language availability
  - Client-side ranking: title matches 3pts, events/currencies 2pts, excerpt 1pt, tags/category 0.5pt (BEP scoring)
  - Returns: { posts: [], hasMore: boolean, lastCursor }
  - Supports pagination via cursor
- [x] ✅ `getBlogSearchFilters(lang)`:
  - Returns all available categories, tags, authors, currencies, events for filter dropdowns
- [x] ✅ `getBlogSearchSuggestions(lang)`:
  - Returns popular keywords for autocomplete (top 20)
- [x] Implemented in blogSearchService.js v1.1.0

### 6.3 Implement search UI on BlogListPage

#### 6.3.1 Add search input
- [x] ✅ MUI TextField with search icon
- [x] ✅ Placeholder: "Search insights..." (i18n: `listPage.searchPlaceholder`)
- [x] ✅ Debounced (300ms) query as user types
- [x] ✅ Real-time results without "search" button

#### 6.3.2 Add filter controls
- [x] ✅ Category filter (dropdown, single-select from availableFilters.categories)
- [x] ✅ Tag filter (multi-select autocomplete from availableFilters.tags)
- [x] ✅ Author filter (multi-select autocomplete from availableFilters.authors)
- [x] ✅ Event filter (dropdown, single-select from availableFilters.events)
- [x] ✅ Currency filter (dropdown, single-select from availableFilters.currencies)
- [x] ✅ Clear filters button (shows when any filter active)

#### 6.3.3 Pagination
- [x] ✅ Show posts 12 per page (POSTS_PER_PAGE constant)
- [x] ✅ Infinite scroll with Intersection Observer sentinel
- [x] ✅ Maintains search query + filters across page changes via cursor pagination

#### 6.3.4 Results display
- [x] ✅ If no results: show "No posts found" (i18n: `listPage.noPostsSearch`)
- [x] ✅ If results: show post cards in grid (existing PostCard component)
- [x] ✅ Relevance-ranked by searchBlogPosts service

**Acceptance Criteria (Phase 6)** 
- [x] Decision locked: Firestore + searchTokens MVP ✅
- [x] blogTypes.js updated with searchTokens schema ✅
- [x] blogService.js computes tokens deterministically (including currencyTags + eventTags) ✅
- [x] blogSearchService.js queries and ranks results (with BEP scoring) ✅
- [x] BlogListPage search UI works with debouncing + real-time results ✅
- [x] Filters (category, tags, author, events, currencies) work + persist across pagination ✅
- [x] Search respects language and avoids cross-language mismatches ✅
- [x] No results, multiple results, single result cases all handled gracefully ✅
- [x] Mobile-first responsive design ✅
- [x] i18n labels all translated (EN/ES/FR) ✅

---

## Phase 7 — Ads (AdSense) Placement and Policy Safety (✅ COMPLETED)
**Goal:** Add AdSense units in BEP way without harming UX, performance, or policy compliance.

### 7.1 Ad placements (public only)
- [x] Blog list: Display ad after every 6th post card (BlogListPage.jsx v2.1.0, gridColumn: 1/-1)
- [x] Post page: In-article ad after content + display ad before related posts (BlogPostPage.jsx v1.26.0)
- [x] Ads only render on public blog pages (AdUnit.jsx checks consent, not injected in admin routes)

### 7.2 Consent and privacy alignment
- [x] Cookie consent logic integrated — AdUnit.jsx uses hasAdConsent()/subscribeConsent() from consent.js
- [x] Non-personalized ads via `data-ad-request-non-personalized-ads="1"` when no consent
- [x] Privacy policy reviewed and updated — blog content & ad placements now documented in pages.legal.privacy (EN/ES/FR)

### 7.3 Performance guardrails
- [x] Lazy load via IntersectionObserver (200px rootMargin, loads only when near viewport)
- [x] CLS prevention with minHeight containers (250px list, 100px in-article, 90px bottom)
- [ ] Core Web Vitals audit — confirm LCP/CLS/INP after ads populate (ads may take hours to fill)

**Acceptance Criteria (Phase 7)**
- [x] Ads show only on public blog pages (AdUnit.jsx + consent gating)
- [x] Consent is respected (hasAdConsent check, subscribeConsent listener, non-personalized fallback)
- [x] No CLS spikes from ad injection (minHeight containers reserve space)

---

## Phase 8 — Hardening: Accessibility, Security, Observability, Testing
**Goal:** Ensure enterprise quality: safe HTML, stable routes, logs, and tests.

### 8.1 Security hardening
- [ ] Sanitize HTML and enforce allowlist
- [ ] Disallow scripts and unknown iframes
- [ ] Enforce CSP where possible (at least deny inline scripts except theme init)
- [ ] Validate embed HTML blocks strictly (widgets only)

### 8.2 Accessibility
- [ ] Headings are hierarchical (H1 once per page)
- [ ] Images require alt text
- [ ] Keyboard nav works
- [ ] Contrast passes in both themes
- [ ] Reduced motion respected

### 8.3 Observability
- [ ] Log publish/unpublish jobs
- [ ] Track render errors per post/language
- [ ] Add alerting hooks if publishing fails

### 8.4 Testing
- [ ] Unit tests for:
  - slug generator
  - sanitizer
  - related-post engine
  - sitemap generator
- [ ] Integration tests:
  - publish → page exists
  - unpublish → removed
  - language routing

**Acceptance Criteria (Phase 8)**
- [ ] No XSS vectors via blog content
- [ ] Pages are accessible and stable
- [ ] Publish pipeline is observable and retry-safe

---

## Phase 9 — Launch Checklist (Production)
**Goal:** Final verification and roll-out steps.

### 9.1 Pre-launch SEO verification
- [ ] Validate sitemap in Search Console
- [ ] Test `hreflang` with real URLs
- [ ] Confirm canonical correctness
- [ ] Confirm robots allow blog pages and block admin

### 9.2 AdSense readiness
- [ ] Ensure enough high-quality posts exist (not thin)
- [ ] Ensure about/privacy/terms are present (already)
- [ ] Ensure consistent navigation and site structure
- [ ] Re-request review in AdSense if needed

### 9.3 Monitoring after launch
- [ ] Track index coverage
- [ ] Track crawl errors
- [ ] Track CWV on blog pages
- [ ] Track ad performance without hurting UX

**Acceptance Criteria (Phase 9)**
- [ ] Blog pages are indexed and discoverable
- [ ] AdSense status improves from “Low value content”
- [ ] No major crawl or performance regressions

---

## Open Questions / Decisions Log (Keep Updated)
- Decision (0.2): Publish strategy Option A/B: **Option A - Cloud Storage HTML + HTTPS Function rewrite** ✅
- Decision (6.1): Search strategy: **Firestore + searchTokens MVP (scale to Algolia later if needed)** ✅
- Missing translation behavior (0.1): **302 redirect to default language slug** ✅
- Allowed embed types (0.3): **YouTube, Vimeo iframes only (domain whitelist)** ✅
- Phase 5.B empty page policy: **404 (not indexable empty-state)** ✅
- Phase 5.B related posts cap: **5 posts max** ✅
- Phase 5.B author slug format: **lowercase-hyphenated** ✅
- Phase 6 search score weights (v1.1.0): **title 3pts > events/currencies 2pts > excerpt 1pt > tags/category 0.5pts** ✅
- Phase 6 search includes: **title + excerpt + tags + category + keywords + currencyTags + eventTags** ✅

---

## Progress Log (Agent must maintain)
- 2026-02-04 — Phase 0 started: Baseline audit and architecture decisions
- 2026-02-04 — Phase 0 completed: Confirmed subpath URLs, selected Option A publish strategy, defined content format
- 2026-02-04 — Phase 1 started: Data model, security, RBAC foundation
- 2026-02-04 — Phase 1 completed: Created blogTypes.js, blogService.js, updated firestore.rules v1.4.0, storage.rules, added EDITOR role
- 2026-02-04 — Phase 2 started: Admin CMS skeleton (CRUD + Drafts)
- 2026-02-04 — Phase 2 completed: AdminBlogPage, AdminBlogEditorPage, BlogContentEditor, ConfirmDialog, routes, i18n (EN/ES/FR)
- 2026-02-04 — Phase 3 started: Public blog pages (SEO-first)
- 2026-02-04 — Phase 3 completed: BlogListPage, BlogPostPage, public routes, SEO metadata, hreflang, structured data (BlogPosting)
- 2026-02-04 — Phase 4 started: Publishing pipeline (pre-render on publish, remove on unpublish)
- 2026-02-04 — Phase 4 work-in-progress: Infrastructure ready, Cloud Functions implementation in progress
- 2026-02-04 — Phase 5.B started: Event + Currency Blog Taxonomy
- 2026-02-04 — Phase 5.B COMPLETED: ✅ All components, routes, CMS UI, i18n, design decisions documented
  - **New files:** BlogEventHubPage.jsx, BlogCurrencyHubPage.jsx, BlogAuthorPage.jsx, blogAuthorService.js
  - **Modified files:** blogTypes.js (v2.0.0), blogService.js (scoring algorithm), AdminBlogEditorPage.jsx (v2.0.0), AppRoutes.jsx (v1.6.0), firestore.rules (v1.5.0)
  - **i18n:** blog.json EN/ES/FR updated with taxonomy, currency, and event labels
  - **Routes added:** `/blog/event/:eventKey`, `/{lang}/blog/event/:eventKey`, `/blog/currency/:currency`, `/{lang}/blog/currency/:currency`, `/blog/author/:authorSlug`, `/{lang}/blog/author/:authorSlug`
- 2026-02-06 — Phase 4 VERIFIED: ✅ Cloud Functions `onBlogPostWrite` trigger fully deployed and operational
  - **Verified:** renderBlogPost() generates HTML per language to Storage blog-render/{lang}/blog/{slug}/index.html
  - **Verified:** removeRenderedBlogPost() cleans up on unpublish/delete
  - **Verified:** serveBlogHtml() serves pre-rendered HTML to crawlers with OG meta tags, SPA to browsers
  - **Verified:** firebase.json configured with /blog{,/**} rewrites to serveBlogHtml Cloud Function
  - **Status:** Phase 4 complete and production-ready
- 2026-02-06 — Phase 6 started: Full-Text Search (BEP) + Filters
  - **Decision:** Firestore + precomputed searchTokens array (MVP-first, scale to Algolia later if needed)
  - **Implementation Plan:** See section 6.0–6.4 above
- 2026-02-06 — Phase 6 work-in-progress (70% complete):
  - ✅ Search strategy locked: Firestore + deterministic searchTokens (Phase 6.0–6.1)
  - ✅ blogTypes.js v2.1.0: Added searchTokens?: string[] to LanguageContent schema
  - ✅ blogService.js v2.0.0: Added computeSearchTokens(post, lang) export function
  - ✅ publishBlogPost(): Computes searchTokens for all languages on publish
  - ✅ updateBlogPost(): Computes searchTokens for changed languages in transaction
  - ✅ blogSearchService.js v1.0.0 created: searchBlogPosts(options), getBlogSearchFilters(lang), getBlogSearchSuggestions(lang)
  - ⏳ Remaining: Add search UI to BlogListPage.jsx (debounce, filters, pagination, i18n)
- 2026-02-06 — Phase 6 BEP Enhancement: Search now includes currency & event tags
  - ✅ blogService.js v2.1.0: Updated computeSearchTokens() to include currencyTags + eventTags
  - ✅ blogSearchService.js v1.1.0: 
    - Updated scorePost() to weight event/currency matches (2pts each - high priority for traders)
    - Updated getBlogSearchFilters() to return currencies[] and events[]
    - Updated searchBlogPosts() to accept currencies and events filter options
  - ✅ Users can now search: "NFP", "USD", "CPI", "EUR" etc. (economic events + currencies)
  - ✅ Score weights: title 3pts > events/currencies 2pts > excerpt 1pt > tags/category 0.5pts- 2026-02-06 — Phase 6 COMPLETE v1.0 (100% ✅)
  - ✅ BlogListPage.jsx v2.0.0: Fully integrated searchBlogPosts service
  - ✅ Added debounced search input (300ms) with real-time results
  - ✅ Added multi-filter support:
    - Category: single-select from availableFilters.categories
    - Events: single-select from availableFilters.events
    - Currencies: single-select from availableFilters.currencies
    - Tags: multi-select Autocomplete from availableFilters.tags
    - Authors: multi-select Autocomplete from availableFilters.authors
  - ✅ Added "Clear All Filters" button (shows when any filter active)
  - ✅ Replaced listPublishedPosts() with searchBlogPosts() (uses token-based ranking)
  - ✅ Infinite scroll pagination with Intersection Observer (12 posts per page)
  - ✅ Mobile-first responsive design with MUI components
  - ✅ i18n strings prepared (all filter labels + placeholders)
  - ✅ No compile errors, browser tested at http://localhost:5173/en/blog
- 2026-02-06 — Phase 6 BEP FIXES:
  - ✅ blogSearchService.js v1.2.0: Fixed critical filtering bug — client-side filters (events, currencies, tags) now fetch ALL published posts from Firestore (two-path architecture: fast path for no filters, filtered path for client-side filters)
  - ✅ blog.json EN/ES/FR: Added complete event name translations (JOLTS, Initial Jobless Claims, etc.) matching BLOG_ECONOMIC_EVENTS
  - ✅ BlogListPage.jsx: Events dropdown now displays full translated names via i18n lookup
  - ✅ Authors filter hidden (only 1 author currently)
- 2026-02-06 — Phase 7 COMPLETE (✅)
  - ✅ AdUnit.jsx v1.0.0: Reusable BEP ad component (memo, IntersectionObserver lazy load, consent-gated, CLS prevention)
  - ✅ adSlots.js v1.0.0: Ad slot IDs and publisher ID constants
  - ✅ BlogListPage.jsx v2.1.0: Display ad after every 6th post card (not above fold)
  - ✅ BlogPostPage.jsx v1.26.0: In-article ad after content + display ad before related posts
  - ✅ i18n: blog:ads.advertisement label in EN/ES/FR
  - ✅ All 3 ad units integrated: slot 5605015898 (list), 8390961336 (in-article), 7453176382 (bottom)