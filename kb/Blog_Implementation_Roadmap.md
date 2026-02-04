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
- [ ] Confirm default language path is `/blog/...`
- [ ] Confirm other languages use `/{lang}/blog/...` (e.g., `/es/blog/...`, `/fr/blog/...`)
- [ ] Confirm we will **not** rely on `?lang=` for SEO pages (avoid duplicates)
- [ ] Decide redirect behavior when translation missing:
  - [ ] Option: **302** to default language (recommended)
  - [ ] Option: render fallback language but **noindex** (avoid thin duplicates)

**Notes:**
- Existing prerender + hosting rewrites already support `/es/*`, `/fr/*`.
- Sitemap/prerender currently may generate `?lang=` alternates. Must be standardized.

### 0.2 Choose publish/unpublish strategy (No frontend redeploy)
Select one and lock it:
- [ ] **Option A (Recommended):** Generate HTML on publish to Cloud Storage and serve via HTTPS Function rewrite.
- [ ] Option B: Use Firebase Hosting REST API to upload/release generated HTML.

**Decision:** `Option __`  
**Rationale:** ______________________

### 0.3 Define blog content format (BEP editor output)
- [ ] Confirm editor output format: **HTML** (safe sanitized) + optional embedded allowed widgets via whitelisted HTML blocks only
- [ ] Confirm image strategy: upload via Storage and reference public URLs with alt text
- [ ] Confirm no arbitrary scripts (security, CSP safe)

---

## Phase 1 — Data Model, Security, and RBAC Foundation
**Goal:** Create Firestore schema, roles, rules, and admin utilities. No UI polish yet.

### 1.1 Firestore schema: `blogPosts`
- [ ] Create schema (single doc per post; nested per-language fields).
- [ ] Required fields:
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
- [ ] Enforce uniqueness constraints for slugs per language (see Phase 2.3)

**Notes/Links:** ______________________

### 1.2 RBAC: roles and claims
- [ ] Ensure roles exist: `superadmin`, `admin`, `editor`
- [ ] Ensure client can read role safely (do not trust client for enforcement)
- [ ] Ensure server-side enforcement via rules (Firestore/Storage)
- [ ] Decide how roles are assigned (manual admin tool / existing system)

### 1.3 Firestore Rules
- [ ] Public reads:
  - [ ] `published` posts: readable by anyone (100% public)
  - [ ] `draft/unpublished`: read only for authorized roles
- [ ] Writes:
  - [ ] create/update/delete limited to roles: `superadmin`, `admin`, `editor`
- [ ] Validate shape minimally in rules (prevent junk status, missing required language fields on publish)

### 1.4 Storage Rules for blog assets
- [ ] Create bucket folder convention:
  - `blog/cover/{postId}/{lang}/...`
  - `blog/content/{postId}/{lang}/...`
- [ ] Public read for assets is OK
- [ ] Write restricted to RBAC roles
- [ ] Enforce size/type constraints if possible (images only)

**Acceptance Criteria (Phase 1)**
- [ ] Blog posts can be stored in Firestore with per-language blocks
- [ ] Unauthorized users cannot write or read drafts
- [ ] Authorized roles can CRUD posts and upload assets

---

## Phase 2 — Admin CMS Skeleton (CRUD + Drafts) (BEP)
**Goal:** Implement internal blog CMS surfaces to create/edit posts with multi-language fields.

### 2.1 Routing & navigation (private)
- [ ] Add admin routes (examples):
  - `/admin/blog` (list + search)
  - `/admin/blog/new`
  - `/admin/blog/edit/:postId`
- [ ] Guard routes by RBAC (client-side UX; rules enforce security)

### 2.2 Blog list in admin (with filters)
- [ ] Table with: status, title (default lang), updatedAt, publishedAt, category, tags
- [ ] Filters: status, language, category, tag
- [ ] Full-text search (see Phase 4.2 for production-quality search)
- [ ] Actions: edit, publish, unpublish, delete

### 2.3 Slug generation + uniqueness (per language)
- [ ] Generate slug from title per language
- [ ] Validate slug uniqueness:
  - [ ] Simple deterministic approach: store `slugIndex/{lang}_{slug}` doc pointing to postId
  - [ ] Create/update atomic with transaction
- [ ] Prevent publish if slug conflict exists

### 2.4 Multi-language editor UI
- [ ] Language tabs: EN/ES/FR (driven by i18n config)
- [ ] Each tab must support:
  - Title
  - Slug (editable)
  - Excerpt
  - Rich editor for body (HTML output)
  - SEO title + description
  - Cover image upload (url + alt)
- [ ] “Add language” action for posts missing translations
- [ ] “Missing translation” clearly surfaced (do not silently publish empty languages)

### 2.5 Draft workflow (no scheduling yet)
- [ ] Status transitions:
  - Draft → Publish
  - Publish → Unpublish
  - Delete (anytime for roles)
- [ ] Confirm no schedule publish in this phase (add later if desired)
- [ ] Track audit info: updatedAt, updatedBy

**Acceptance Criteria (Phase 2)**
- [ ] Admin/editor can create and edit a post with multiple languages
- [ ] Slugs are deterministic and validated for uniqueness
- [ ] Draft/publish/unpublish/delete actions exist (even if publish pipeline not built yet)

---

## Phase 3 — Public Blog Pages (SEO-first + Theme-aware + i18n URL) (BEP)
**Goal:** Build `/blog` and `/blog/{slug}` public pages with dedicated language URLs and enterprise SEO.

### 3.1 Public routing structure
- [ ] `/blog` and `/{lang}/blog` list page
- [ ] `/blog/{slug}` and `/{lang}/blog/{slug}` post page
- [ ] If translation missing:
  - [ ] redirect to default language slug OR show 404 (decide in Phase 0)
- [ ] Ensure page titles/descriptions are language-specific

### 3.2 List page UX (SEO + AdSense ready)
- [ ] Latest posts list with:
  - Title, excerpt, cover image, reading time, tags/category, publishedAt
- [ ] Search bar + filters:
  - tags, category
  - language aware
- [ ] Pagination (avoid infinite scroll for SEO)
- [ ] “Related” is only on post page (list page uses deterministic sorting)

### 3.3 Post page UX
- [ ] Render HTML content safely:
  - [ ] sanitize/whitelist allowed tags and embeds
  - [ ] block scripts and unknown iframes
- [ ] Related articles:
  - [ ] manual relatedPostIds first
  - [ ] fallback engine: same language + category + tag overlap + recent

### 3.4 SEO metadata + structured data
Per list:
- [ ] canonical: `/blog` (and `/{lang}/blog`)
- [ ] `hreflang` alternates for each available language variant
- [ ] Open Graph image defaults and per-post overrides

Per post:
- [ ] canonical: `/{lang}/blog/{slug}`
- [ ] JSON-LD: `BlogPosting`:
  - headline, description, datePublished, dateModified, author, image, keywords
- [ ] Add `Article`/`BlogPosting` schema consistent across languages

### 3.5 Theme awareness
- [ ] Ensure blog pages use global theme tokens
- [ ] Ensure “no theme flash” on first paint:
  - include theme init script in pre-rendered HTML output if applicable
- [ ] Confirm MUI typography scales well on mobile (Core Web Vitals friendly)

**Acceptance Criteria (Phase 3)**
- [ ] `/blog` and `/{lang}/blog` exist and are theme-correct
- [ ] `/blog/{slug}` renders published content only, safely and fast
- [ ] Dedicated language URLs work and do not create duplicates
- [ ] SEO metadata is correct (canonical + `hreflang`)

---

## Phase 4 — Publishing Pipeline: Pre-render on Publish, Remove on Unpublish (No Redeploy)
**Goal:** Implement the system that generates SEO HTML snapshots at publish time and removes them at unpublish time.

> This phase depends on decision from Phase 0.2.

### 4.1 Option A — Cloud Storage HTML + Function rewrite (Recommended)
**Publish:**
- [ ] Firestore trigger on `blogPosts/{postId}`:
  - when status transitions to `published`:
    - [ ] generate HTML per language present
    - [ ] write to Storage:
      - `blog-render/{lang}/blog/{slug}/index.html`
      - plus assets (optional): precomputed JSON payload if needed
- [ ] Store render manifest (for unpublish cleanup):
  - `blogRenders/{postId}` with list of paths generated

**Unpublish/Delete:**
- [ ] On status → `unpublished` or doc delete:
  - [ ] read manifest and delete HTML files from Storage
  - [ ] delete manifest doc

**Serve:**
- [ ] Hosting rewrite:
  - `/blog/**` + `/{lang}/blog/**` → HTTPS function
- [ ] Function resolves:
  - language from path
  - slug from path
  - returns Storage HTML with:
    - correct `Content-Type: text/html`
    - caching headers (BEP):
      - public cache but with purge strategy on unpublish (short TTL ok)

### 4.2 Option B — Firebase Hosting REST publish
- [ ] Cloud Run job builds HTML
- [ ] Upload and release to Hosting via REST
- [ ] Remove pages on unpublish
- [ ] Requires service account + permissions + release strategy

### 4.3 Caching + invalidation
- [ ] Ensure published posts update quickly after edit:
  - [ ] regenerate HTML on edits if `status=published`
- [ ] Ensure headers do not prevent updates from taking effect

**Acceptance Criteria (Phase 4)**
- [ ] Publishing a post creates indexable HTML pages for each language
- [ ] Unpublishing removes them and returns 404
- [ ] No full frontend redeploy is required to publish/unpublish
- [ ] Public blog pages are always crawlable HTML (not client-only)

---

## Phase 5 — Sitemap, Robots, and SEO Hygiene (Enterprise)
**Goal:** Ensure blog surfaces are discoverable, properly indexed, and free of duplication.

### 5.1 Sitemap integration
- [ ] Update sitemap generator to include:
  - `/blog`
  - `/{lang}/blog`
  - each published post:
    - `/blog/{slug}`
    - `/{lang}/blog/{slug}` for languages available
- [ ] Ensure sitemap uses **subpaths** not `?lang=`
- [ ] Ensure `lastmod` is correct
- [ ] Add `hreflang` mapping (optional in sitemap; must exist in HTML at minimum)

### 5.2 robots.txt
- [ ] Ensure `/blog` is allowed
- [ ] Ensure admin routes are disallowed:
  - `/admin/*`
  - any drafts preview route if added
- [ ] Ensure `/app` stays noindex (already)
- [ ] Confirm canonical behavior for language pages (avoid duplication)

### 5.3 Canonical & alternate auditing
- [ ] Verify canonical of each language page points to itself
- [ ] Verify `hreflang` alternates do not reference non-existent translations
- [ ] Add `x-default` alternate pointing to default language

**Acceptance Criteria (Phase 5)**
- [ ] Blog appears in sitemap correctly for all languages
- [ ] robots blocks admin & private pages
- [ ] No duplicate URL patterns (`?lang=` eliminated for SEO pages)

---

## Phase 6 — Full-Text Search (BEP) + Filters
**Goal:** Implement reliable full-text search for `/blog` and optionally admin.

### 6.1 Select full-text strategy
Pick one:
- [ ] **Deterministic / low-cost:** Firestore + precomputed `searchTokens` array (basic, not true full-text)
- [ ] **BEP scalable:** Algolia / Meilisearch / Typesense
- [ ] **Firebase-native:** Extensions / Elastic (heavier)

**Decision:** ______________________

### 6.2 Implement search indexing
- [ ] On publish/update, compute:
  - `searchText` per language (title + excerpt + tags + category)
  - normalized tokens for deterministic search
- [ ] Query on `/blog` with:
  - search term + language + filters
- [ ] Ensure search results are stable and fast

**Acceptance Criteria (Phase 6)**
- [ ] Search works across titles/excerpts/tags/categories
- [ ] Search respects language and avoids cross-language mismatches
- [ ] Filters remain deterministic and cheap

---

## Phase 7 — Ads (AdSense) Placement and Policy Safety
**Goal:** Add AdSense units in BEP way without harming UX, performance, or policy compliance.

### 7.1 Ad placements (public only)
- [ ] Blog list: 1 unit between sections (not above fold on mobile)
- [ ] Post page: 1 unit mid-article + 1 near end (spaced and readable)
- [ ] Ensure ads do not load for admin pages

### 7.2 Consent and privacy alignment
- [ ] Ensure cookie consent logic matches AdSense needs
- [ ] Ensure “non-personalized ads” works in essential-only mode
- [ ] Ensure privacy policy reflects blog content and ad placements

### 7.3 Performance guardrails
- [ ] Lazy load ad slots
- [ ] Avoid layout shift (reserve container height)
- [ ] Confirm Core Web Vitals remain acceptable (LCP/CLS/INP)

**Acceptance Criteria (Phase 7)**
- [ ] Ads show only on public blog pages
- [ ] Consent is respected
- [ ] No CLS spikes from ad injection

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
- Decision (0.2): Publish strategy Option A/B: _______
- Search strategy (6.1): _______
- Missing translation behavior (0.1): _______
- Allowed embed types (0.3): _______

---

## Progress Log (Agent must maintain)
- YYYY-MM-DD — Phase __ started: __________________
- YYYY-MM-DD — Completed: _________________________
- PR/Commit links: ________________________________
- Notes/Risks: ____________________________________
