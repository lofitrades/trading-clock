# Insights Feature — Living Roadmap

**Created:** 2026-02-09  
**Version:** 0.1.0 (Design Phase)  
**Status:** 🟡 Audit Complete → Awaiting Implementation Approval  
**Owner:** T2T Engineering  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Codebase Audit Results](#2-codebase-audit-results)
3. [Phase 0 — Right-Column Tabs Trace](#phase-0--right-column-tabs-trace)
4. [Phase 1 — Data Contracts & Spec](#phase-1--data-contracts--spec)
5. [Phase 2 — insightKeys Indexing](#phase-2--insightkeys-indexing)
6. [Phase 3 — Prioritization Engine](#phase-3--prioritization-engine)
7. [Phase 4 — Insights Data Engine](#phase-4--insights-data-engine)
8. [Phase 5 — Insights UI](#phase-5--insights-ui)
9. [Phase 6 — BlogPostPage Integration](#phase-6--blogpostpage-integration)
10. [Phase 7 — Security & Visibility](#phase-7--security--visibility)
11. [Phase 8 — Calendar Readiness](#phase-8--calendar-readiness)
12. [Firestore Schema Changes](#firestore-schema-changes)
13. [Composite Indexes Required](#composite-indexes-required)
14. [i18n Namespace Plan](#i18n-namespace-plan)
15. [Filter Sync with ClockEventsFilters](#filter-sync-with-clockeventsfilters)
16. [Decisions Log](#decisions-log)
17. [Progress Log](#progress-log)

---

## 1. Executive Summary

**What:** A contextual "Insights" panel that aggregates three source types — blog articles, system activity logs, and user notes — into a ranked, filterable feed. Surfaces relevant information in the right-column sidebar on BlogPostPage (Phase 6) and Calendar2Page (Phase 8).

**Why:** Traders need at-a-glance context about events and currencies they're viewing. Instead of navigating between blog, calendar, and activity logs separately, Insights merges them into a single timeline with smart prioritization.

**Key Design Principle:** All queries use `insightKeys` (string array) with `array-contains` for indexed Firestore lookups. No unbounded collection scans.

---

## 2. Codebase Audit Results

### 2A. Existing Infrastructure (What We Have)

| System | Status | Key Findings |
|--------|--------|-------------|
| **Right-column tabs** | ✅ Ready | `TabbedStickyPanel.jsx` + `MainLayout.jsx` — Chrome-like tabs, session persistence, sticky scroll. Calendar2Page already uses it; BlogPostPage uses `right=` prop (needs upgrade). See [RIGHT_SIDEBAR_TABS_TRACE.md](RIGHT_SIDEBAR_TABS_TRACE.md). |
| **Blog posts** (`blogPosts`) | ✅ Has taxonomy | `eventTags[]` (25 canonical slugs), `currencyTags[]` (17 currencies), `searchTokens[]` per language. **No `insightKeys`** field. Related posts use client-side scoring on 50-post pool — not indexed queries. |
| **Activity logs** (`systemActivityLog`) | ⚠️ Needs schema additions | Flat collection, deterministic doc IDs, 26 activity types, written from both frontend (`activityLogger.js`) and backend (`activityLoggingService.ts`). **No `insightKeys`**, **no `visibility`** field. `metadata` object has freeform `eventName`, `currency`, `postId` but not indexed. |
| **Event notes** (`users/{uid}/eventNotes`) | ✅ Per-user subcollection | Composite key matching via `buildEventIdentity()` from `favoritesService.js`. Has `primaryNameKey`, `currencyKey`, `dateKey`. **No `insightKeys`** — but identity fields can derive them. |
| **Favorites** (`users/{uid}/favorites`) | ✅ Per-user subcollection | Same composite key engine as notes. Shares `buildEventIdentity()`. |
| **Filter patterns** | ✅ Reusable | `ClockEventsFilters.jsx` is stateless, reads from `SettingsContext.eventFilters`, delegates via `onChange`. `ClearableSelect` sub-component reusable. `calculateDateRange()` reusable. IMPACT_OPTIONS/COLORS pattern reusable for source-type chips. |
| **Firestore indexes** | ⚠️ Missing | No indexes on `systemActivityLog` or `blogPosts` for `insightKeys`. Only `economicEventsCalendar` and canonical `events` subcollection have indexes. |
| **Firestore rules** | ⚠️ Needs additions | `systemActivityLog`: any auth user can read, create requires fields validation, update/delete superadmin only. No `visibility` enforcement. `blogPosts`: published=public, drafts=CMS roles. Notes: owner-only. |
| **i18n** | 🆕 Needs namespace | No `insights` namespace exists. 31 namespaces currently. Config preloads 15. |

### 2B. Key Files Reference

| Category | File | Relevance |
|----------|------|-----------|
| **Layout** | `src/components/layouts/MainLayout.jsx` | `rightTabs` prop for tabbed sidebar |
| **Layout** | `src/components/layouts/TabbedStickyPanel.jsx` | Chrome tab UI, session persistence |
| **Blog** | `src/types/blogTypes.js` | `BLOG_ECONOMIC_EVENTS` (25 slugs), `BLOG_CURRENCIES` (17 codes), post schema |
| **Blog** | `src/services/blogService.js` | `getRelatedPosts()` scoring, `generateSearchTokens()` |
| **Blog** | `src/services/blogSearchService.js` | Public blog listing with `searchTokens` |
| **Activity** | `src/services/activityLogger.js` | Frontend logging, `ACTIVITY_TYPES` (26 types) |
| **Activity** | `functions/src/services/activityLoggingService.ts` | Backend logging, dedup strategy |
| **Notes** | `src/services/eventNotesService.js` | Note CRUD, `buildEventIdentity()` usage |
| **Notes** | `src/hooks/useEventNotes.js` | Real-time note subscriptions |
| **Identity** | `src/services/favoritesService.js` | `buildEventIdentity()` — canonical composite key builder |
| **Filters** | `src/components/ClockEventsFilters.jsx` | Stateless filter bar pattern, `ClearableSelect`, `calculateDateRange()` |
| **Settings** | `src/contexts/SettingsContext.jsx` | `eventFilters` persistence (localStorage + Firestore) |
| **i18n** | `src/i18n/config.js` | Namespace preload list |
| **Rules** | `firestore.rules` | Security rules for all collections |
| **Indexes** | `firestore.indexes.json` | Existing composite indexes |

### 2C. Identified Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Two activity loggers** — `activityLogger.js` (auto-ID fallback) + `adminActivityService.js` (also writes to `systemActivityLog`) | Medium | Consolidate on `activityLogger.js` pattern with deterministic IDs. Add `insightKeys` computation to shared function. |
| **Notes are per-user subcollections** — can't query cross-user | Low | Insights only shows current user's notes. No cross-user aggregation needed for MVP. |
| **No existing `insightKeys` on any collection** — backfill required | High | Phase 2 backfill tool. Run once, then compute on write going forward. |
| **BlogPostPage `right=` prop** — needs conversion to `rightTabs` | Low | Well-documented upgrade path in RIGHT_SIDEBAR_TABS_TRACE.md. |
| **Activity logs lack `visibility`** — all visible to any auth user | High | Phase 7. Add field + Firestore rule enforcement before public launch. |

---

## Phase 0 — Right-Column Tabs Trace

**Status:** ✅ COMPLETE

**Deliverable:** [RIGHT_SIDEBAR_TABS_TRACE.md](RIGHT_SIDEBAR_TABS_TRACE.md)

**Summary:**
- `TabbedStickyPanel.jsx` — Chrome-like tabbed panel with session persistence, ARIA compliance, internal scroll
- `MainLayout.jsx` — Two-column grid with `rightTabs` prop (lazy-loads `TabbedStickyPanel`)
- Calendar2Page already uses `rightTabs` (Clock + placeholder Tab2)
- BlogPostPage uses `right=` prop (needs upgrade to `rightTabs` for Insights)
- Adding a tab = adding an object to the `rightTabs` array — no layout changes needed

### Tasks
- [x] Search for existing tab/panel implementation
- [x] Document component name + props contract
- [x] Document scrolling, sticky, mobile behavior
- [x] Create `RIGHT_SIDEBAR_TABS_TRACE.md`

---

## Phase 1 — Data Contracts & Spec

**Status:** 🟡 DESIGNED (pending implementation)

### 1A. Insight Item — Canonical Format

Every item in the Insights feed conforms to this normalized shape:

```typescript
interface InsightItem {
  id: string;                    // Unique: `${sourceType}:${sourceId}`
  sourceType: 'article' | 'activity' | 'note';
  sourceId: string;              // blogPosts/{id}, systemActivityLog/{id}, eventNotes/{key}/notes/{id}
  
  // Display
  title: string;                 // Blog title, activity title, note excerpt
  summary: string;               // Blog excerpt, activity description, note text
  timestamp: Date;               // publishedAt, createdAt, createdAt
  
  // Taxonomy (for matching + filtering)
  insightKeys: string[];         // Computed keys for array-contains queries
  eventTags?: string[];          // Original event slugs (blog) or derived (activity)
  currencyTags?: string[];       // Original currency codes
  
  // Source-specific metadata
  metadata: {
    // article
    slug?: string;
    coverImage?: { url: string; alt: string };
    readingTime?: number;
    category?: string;
    likeCount?: number;
    viewCount?: number;
    
    // activity
    severity?: 'info' | 'warning' | 'error' | 'success';
    activityType?: string;       // ACTIVITY_TYPES value
    visibility?: 'public' | 'internal' | 'admin';
    
    // note
    eventName?: string;
    eventDate?: Date;
  };
  
  // Ranking (computed client-side by prioritization engine)
  score?: number;
}
```

### 1B. Sources

| Source | Collection | Trigger for insightKeys | Queryable? |
|--------|-----------|------------------------|------------|
| **article** | `blogPosts` | On publish/update | `status == 'published' && insightKeys array-contains <key>` |
| **activity** | `systemActivityLog` | On log write (frontend + backend) | `insightKeys array-contains <key> && createdAt desc` |
| **note** | `users/{uid}/eventNotes/{key}/notes/{id}` | On note write | Per-user subcollection — client-side filter by `insightKeys` on summary doc |

### 1C. Context vs Filters

**Context** — provided by the hosting page (not user-selectable):

| Page | Context Shape |
|------|--------------|
| BlogPostPage | `{ postId: string, eventTags: string[], currencyTags: string[] }` |
| Calendar2Page (future) | `{ eventIdentity?: { nameKey, currencyKey, dateKey }, eventId?, currency? }` |
| No context | `{}` — Insights works standalone with filters only |

**Filters** — user-selectable, work with or without context:

```typescript
interface InsightsFilters {
  sourceTypes: ('article' | 'activity' | 'note')[];  // default: all
  eventKey?: string;           // event slug filter (autocomplete)
  currency?: string;           // currency code filter
  timeframe: '24h' | '7d' | '30d' | 'all';  // default: '7d'
}
```

### 1D. Hook Contract

```typescript
const { 
  items: InsightItem[],       // Ranked, deduplicated feed
  loading: boolean,
  error: string | null,
  hasMore: boolean,
  loadMore: () => void,       // Pagination
  totalBySource: {            // For filter chip badges
    article: number,
    activity: number,
    note: number,
  },
} = useInsightsFeed({ 
  context: { postId, eventTags, currencyTags },
  filters: { sourceTypes, eventKey, currency, timeframe },
});
```

### Tasks
- [ ] Create `src/types/insightsTypes.js` with TypeScript-style JSDoc types
- [ ] Create `src/hooks/useInsightsFeed.js` stub with contract
- [ ] Add canonical `insightKeys` computation utility

---

## Phase 2 — insightKeys Indexing

**Status:** ✅ COMPLETE

### 2A. Key Format

All `insightKeys` values follow a prefix convention for efficient querying:

| Prefix | Format | Example |
|--------|--------|---------|
| `event:` | `event:<eventSlug>` | `event:nfp` |
| `currency:` | `currency:<CCY>` | `currency:USD` |
| `eventCurrency:` | `eventCurrency:<eventSlug>:<CCY>` | `eventCurrency:nfp:USD` |
| `post:` | `post:<postId>` | `post:abc123` |
| `eventNameKey:` | `eventNameKey:<normalizedNameKey>` | `eventNameKey:non_farm_payrolls` |
| `eventIdentity:` | `eventIdentity:<nameKey>:<currencyKey>:<dateKey>` | `eventIdentity:nfp:usd:1707436800000` |

### 2B. Computation Per Source

#### Blog Posts (`blogPosts`)

Compute on publish/update in `blogService.js` `publishBlogPost()` and `updateBlogPost()`:

```javascript
function computeBlogInsightKeys(post) {
  const keys = [];
  // Event tags → event keys
  (post.eventTags || []).forEach(slug => keys.push(`event:${slug}`));
  // Currency tags → currency keys
  (post.currencyTags || []).forEach(ccy => keys.push(`currency:${ccy}`));
  // Cartesian: eventCurrency combos
  (post.eventTags || []).forEach(slug => {
    (post.currencyTags || []).forEach(ccy => {
      keys.push(`eventCurrency:${slug}:${ccy}`);
    });
  });
  // Self-reference
  if (post.id) keys.push(`post:${post.id}`);
  return [...new Set(keys)];
}
```

**Existing fields used:** `eventTags[]` (25 canonical slugs from `BLOG_ECONOMIC_EVENTS`), `currencyTags[]` (17 currencies from `BLOG_CURRENCIES`).

#### Activity Logs (`systemActivityLog`)

Compute on write in both `activityLogger.js` (frontend) and `activityLoggingService.ts` (backend):

```javascript
function computeActivityInsightKeys(type, metadata = {}) {
  const keys = [];
  // Event-related activities
  if (metadata.eventName) {
    const normalized = normalizeKey(metadata.eventName);
    // Try to match to canonical slug first
    const slug = findCanonicalSlug(metadata.eventName); // lookup in BLOG_ECONOMIC_EVENTS
    if (slug) keys.push(`event:${slug}`);
    keys.push(`eventNameKey:${normalized}`);
  }
  // Currency from metadata
  if (metadata.currency) {
    const ccy = metadata.currency.toUpperCase();
    keys.push(`currency:${ccy}`);
    // If event + currency known, add combo
    const slug = findCanonicalSlug(metadata.eventName);
    if (slug) keys.push(`eventCurrency:${slug}:${ccy}`);
  }
  // Blog-related activities
  if (metadata.postId) keys.push(`post:${metadata.postId}`);
  return [...new Set(keys)];
}
```

**Audit finding:** Activity `metadata` already contains `eventName`, `currency`, `postId` in many activity types — just not indexed. No schema change to `metadata` needed, only computing and storing `insightKeys[]`.

#### Notes (`users/{uid}/eventNotes/{key}`)

Notes summary docs already have `primaryNameKey`, `currencyKey`, `dateKey`. Compute on write in `eventNotesService.js`:

```javascript
function computeNoteInsightKeys(summaryDoc) {
  const keys = [];
  if (summaryDoc.primaryNameKey) {
    keys.push(`eventNameKey:${summaryDoc.primaryNameKey}`);
    // Try canonical slug match
    const slug = findCanonicalSlug(summaryDoc.eventName);
    if (slug) keys.push(`event:${slug}`);
  }
  if (summaryDoc.currencyKey) {
    keys.push(`currency:${summaryDoc.currencyKey.toUpperCase()}`);
  }
  if (summaryDoc.primaryNameKey && summaryDoc.currencyKey) {
    const slug = findCanonicalSlug(summaryDoc.eventName);
    if (slug) keys.push(`eventCurrency:${slug}:${summaryDoc.currencyKey.toUpperCase()}`);
  }
  if (summaryDoc.primaryNameKey && summaryDoc.currencyKey && summaryDoc.dateKey) {
    keys.push(`eventIdentity:${summaryDoc.primaryNameKey}:${summaryDoc.currencyKey}:${summaryDoc.dateKey}`);
  }
  return [...new Set(keys)];
}
```

### 2C. Backfill Strategy

**Option A (Recommended): Node.js admin script**

File: `scripts/backfill-insight-keys.mjs`

```
1. Query all blogPosts (published) → compute insightKeys → batch update
2. Query all systemActivityLog → compute insightKeys from metadata → batch update
3. Notes: per-user subcollection — skip for MVP (compute on next write)
```

**Estimated volume:**
- Blog posts: ~50–200 docs (small, fast)
- Activity logs: ~500–2000 docs (medium, batched)
- Notes: Skip backfill — compute lazily

### 2D. Firestore Composite Indexes

Add to `firestore.indexes.json`:

```json
[
  {
    "collectionGroup": "systemActivityLog",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "insightKeys", "arrayConfig": "CONTAINS" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "blogPosts",
    "queryScope": "COLLECTION", 
    "fields": [
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "insightKeys", "arrayConfig": "CONTAINS" },
      { "fieldPath": "publishedAt", "order": "DESCENDING" }
    ]
  }
]
```

### Tasks
- [x] Create `src/utils/insightKeysUtils.js` — shared `insightKeys` computation functions
- [x] Update `blogService.js` — add `insightKeys` to publish/update flows (v2.3.0)
- [x] Update `activityLogger.js` — add `insightKeys` to `logActivity()` (v1.5.0)
- [x] Update `activityLoggingService.ts` — add `insightKeys` to backend `logActivity()`
- [x] Update `eventNotesService.js` — add `insightKeys` to note summary writes (v1.2.0)
- [x] Create Cloud Function backfill service — backend `backfillInsightKeysService.ts`
- [x] Add composite indexes to `firestore.indexes.json` (4 new indexes)
- [x] Deploy Cloud Function `backfillInsightKeys` callable (superadmin-only, 540s timeout)
- [x] Create superadmin UI — SettingsSidebar2 backfill button + BackfillProgressModal

---

## Phase 3 — Prioritization Engine

**Status:** ✅ COMPLETE

### 3A. insightsIndex Collection (Enterprise BEP)

**Path:** `insightsIndex/{key}`

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Same format as `insightKeys` value (e.g., `event:nfp`) |
| `keyType` | `string` | `event` / `currency` / `eventCurrency` / `post` / `eventNameKey` |
| `lastActivityAt` | `Timestamp` | Most recent activity with this key |
| `count24h` | `number` | Rolling count of activities in last 24h |
| `count7d` | `number` | Rolling count in last 7d |
| `count30d` | `number` | Rolling count in last 30d |
| `lastPostAt` | `Timestamp` | Most recent blog post with this key |
| `lastLogAt` | `Timestamp` | Most recent activity log with this key |
| `trendingScore` | `number` | Pre-computed: `count24h * 10 + count7d * 3 + count30d` |
| `label` | `string` | Display label (e.g., "Non-Farm Payrolls") |
| `currency` | `string?` | Currency code if applicable |
| `eventSlug` | `string?` | Event slug if applicable |

**Update triggers:**
- Cloud Function `onWrite` on `systemActivityLog` → update all relevant key docs
- Cloud Function `onWrite` on `blogPosts` (status=published) → update key docs
- Per-user `users/{uid}/insightsIndex/{key}` for notes (private)

**MVP Fallback (if insightsIndex not built yet):**
Read last 200 activity logs, aggregate top keys client-side, then query by those keys. Bounded, no scan risk.

### 3B. Candidate Key Selection (No Context)

```
Inputs: { filters, userRole }

If user selects eventKey + currency → candidateKeys = [`eventCurrency:${eventKey}:${currency}`]
If selects eventKey only → [`event:${eventKey}`]
If selects currency only → [`currency:${currency}`]
If selects none:
  → Query insightsIndex ORDER BY trendingScore DESC LIMIT 6
  → Pick top K keys (prefer eventCurrency > event > currency)
```

### 3C. Ranking Algorithm

```
score = recencyScore + severityBoost + engagementBoost + multiMatchBonus

recencyScore = exp(-ageHours / halfLife)
  articles: halfLife = 72h
  activity: halfLife = 24h
  notes: halfLife = 168h

severityBoost (activity only):
  error: +0.3, warning: +0.2, success: +0.1, info: 0

engagementBoost (articles only):
  +0.01 * viewCount (max +2)
  +0.1 * likeCount (max +2)

multiMatchBonus:
  +0.15 per additional matching insightKey beyond the first
```

### 3D. Diversity Constraints

After scoring, re-rank:
1. No more than 2 consecutive items from same `sourceType`
2. No more than 3 items from same `eventKey` in top 10
3. At least 1 article in top 6 when available (if filter allows)

### Tasks
- [x] Create `src/utils/insightsPrioritization.js` — ranking + diversity functions (v1.0.0)
- [x] Implement MVP fallback (aggregateTrendingKeys + deduplicateItems utilities)
- [x] Integrate ranking into insightsQueryService.js (rankInsights called on query results)
- [ ] Plan Cloud Functions for `insightsIndex` updates (Phase 3 or deferred)

---

## Phase 4 — Insights Data Engine

**Status:** � IN PROGRESS

### 4A. Query Plan Resolver

The query plan resolver (already in insightsQueryService.js) determines which keys to query based on context + filters:

```javascript
function resolveQueryPlan(context, filters, visibilityFilter) {
  // 1. Determine candidate keys from context + filters
  // 2. Determine source types to query
  // 3. Set limits per source (articles: 10, activity: 20, notes: 10)
  // 4. Set timeframe constraint
  // 5. Deduplicate keys
  return { candidateKeys, sourceTypes, limits, timeframeMs, visibilityFilter };
}
```

**Status:** ✅ IMPLEMENTED in Phase 7

### 4B. Per-Key Queries

For each candidate key:
1. **Blog posts:** `where('status', '==', 'published').where('insightKeys', 'array-contains', key).orderBy('publishedAt', 'desc').limit(10)`
2. **Activity logs:** `where('insightKeys', 'array-contains', key).where('visibility', 'in', visibilityFilter).orderBy('createdAt', 'desc').limit(20)`
3. **Notes:** Client-side filter on user's `eventNotes` summary docs (already subscribed via `useEventNotes`)

**Status:** ✅ IMPLEMENTED in Phase 7 (queryActivityLogs), stubs ready for Phase 5

### 4C. Merge + Rank

```
1. Collect all items from all sources
2. Deduplicate by sourceId
3. Score using Phase 3 algorithm
4. Apply diversity constraints
5. Return sorted, paginated results
```

**Status:** ✅ IMPLEMENTED in Phase 3 (rankInsights + deduplicateItems called in fetchInsightsFeed)

### 4D. Caching

- Cache by `hash(context + filters)` for 60–120s TTL
- Use `useRef` for in-memory cache (session-level)
- Invalidate on filter change or context change
- Prevent refetch storms when switching tabs (TabbedStickyPanel unmounts inactive content)

**Status:** ⏳ DEFERRED (implement in Phase 4 if performance issues detected)

### Tasks
- [x] Query plan resolution (resolveQueryPlan in insightsQueryService.js)
- [x] Per-key Firestore queries (queryActivityLogs with visibility filtering)
- [x] Merge + rank + deduplication (rankInsights + deduplicateItems)
- [ ] Implement pagination support (loadMore in Phase 5 UI)
- [ ] Add caching layer (useRef-based, deferred if not needed)
- [ ] Test bounded reads (verify no unbounded scans)

---

## Phase 5 — Insights UI

**Status:** 🔴 NOT STARTED

### 5A. InsightsPanel Component

```
InsightsPanel
├── InsightsHeader
│   ├── "Insights" title
│   ├── Source filter chips (All / Articles / Activity / Notes)
│   └── Timeframe selector (24h / 7d / 30d / All)
├── InsightsFilters (when no context / expanded mode)
│   ├── Event picker (autocomplete from BLOG_ECONOMIC_EVENTS)
│   └── Currency picker (from getEventCurrencies)
├── InsightsTimeline
│   ├── InsightArticleCard
│   ├── InsightActivityCard
│   └── InsightNoteCard
├── InsightsEmpty (empty states)
│   ├── "No insights match your filters"
│   └── "Select an event/currency to narrow results"
└── LoadMore button
```

### 5B. Filter Sync with ClockEventsFilters

**Key decision:** Insights filters should *read from* but *not write to* the global `eventFilters` in SettingsContext.

When Insights is on a page with ClockEventsFilters (Calendar2Page):
- **Currency** from `eventFilters.currencies` → pre-populate Insights currency filter
- **Timeframe** from `eventFilters.datePreset` → map to Insights timeframe (today→24h, thisWeek→7d, thisMonth→30d)
- User can override within Insights without affecting the main calendar filters

When Insights is on BlogPostPage:
- **No sync** with ClockEventsFilters (blog pages don't have event filters)
- Context provides `eventTags` + `currencyTags` from the blog post

### 5C. Design Constraints

- Must scroll inside TabbedStickyPanel's Paper (`overflowY: auto`)
- No fixed heights — flex layout fills available space
- Mobile: full width, stacked below left content
- Cards should be compact (similar to sidebar related posts in BlogPostPage)
- Source-type chips pattern reusable from `IMPACT_OPTIONS`/`IMPACT_COLORS` in ClockEventsFilters

### Tasks
- [ ] Create `src/components/InsightsPanel.jsx`
- [ ] Create `src/components/InsightsTimeline.jsx`
- [ ] Create `src/components/InsightCard.jsx` (article/activity/note variants)
- [ ] Create `insights` i18n namespace (EN/ES/FR) in `src/i18n/locales/`
- [ ] Add `insights` to `ns:` array in `src/i18n/config.js`
- [ ] Run `npm run sync-locales` to copy to `public/locales/`
- [ ] Add empty states with i18n
- [ ] Test scroll behavior inside TabbedStickyPanel

---

## Phase 6 — BlogPostPage Integration

**Status:** 🔴 NOT STARTED

### 6A. Conversion Plan

Current BlogPostPage uses `right=` prop with sidebar related posts. Convert to `rightTabs`:

```jsx
// Current:
<MainLayout left={leftContent} right={sidebarContent} stickyTop={16} />

// After:
const rightTabs = [
  { 
    key: 'related', 
    label: t('blog:postPage.relatedArticles'), 
    icon: <ArticleIcon sx={{ fontSize: 16 }} />,
    content: sidebarContent  // Existing related posts UI (unchanged)
  },
  { 
    key: 'insights', 
    label: t('insights:title'),
    icon: <InsightsIcon sx={{ fontSize: 16 }} />,
    content: (
      <InsightsPanel 
        context={{ 
          postId: post.id, 
          eventTags: post.eventTags, 
          currencyTags: post.currencyTags 
        }} 
      />
    )
  },
];

<MainLayout left={leftContent} rightTabs={rightTabs} stickyTop={16} />
```

### 6B. Context Derivation

BlogPostPage already has:
- `post.id` — from Firestore doc
- `post.eventTags` — `string[]` of canonical event slugs
- `post.currencyTags` — `string[]` of currency codes

These map directly to `insightKeys`:
```
eventTags: ['nfp', 'fomc'] → ['event:nfp', 'event:fomc']
currencyTags: ['USD', 'EUR'] → ['currency:USD', 'currency:EUR']
postId: 'abc123' → ['post:abc123']
```

### 6C. Notes Behavior

Notes on BlogPostPage will likely show empty state unless:
- The blog post's eventTags match events the user has written notes about
- Future: allow users to write notes directly on blog posts

### Tasks
- [ ] Convert BlogPostPage from `right=` to `rightTabs`
- [ ] Pass context to InsightsPanel
- [ ] Test no UI regressions in sidebar (related posts still work as Tab A)
- [ ] Test tab switching doesn't refetch excessively (TabbedStickyPanel unmounts inactive)
- [ ] Verify sticky scroll with Insights content

---

## Phase 7 — Security & Visibility

**Status:** ✅ COMPLETE

### 7A. Activity Log Visibility Field

Add `visibility` field to `systemActivityLog` documents:

| Value | Who Can See | Activity Types |
|-------|------------|----------------|
| `public` | Any authenticated user | `sync_completed`, `blog_published`, `event_rescheduled`, `event_created` |
| `internal` | Admin + Superadmin | `sync_failed`, `gpt_upload`, `settings_changed`, `event_cancelled` |
| `admin` | Superadmin only | `user_signup`, debug logs |

### 7B. Firestore Rules Update

```
match /systemActivityLog/{docId} {
  allow read: if request.auth != null && (
    resource.data.visibility == 'public' ||
    (resource.data.visibility == 'internal' && isAdmin()) ||
    (resource.data.visibility == 'admin' && isSuperAdmin())
  );
}
```

### 7C. Insights Engine Enforcement

`insightsQueryService.js` must pass user role to queries:
- Non-admin users: filter `visibility == 'public'` (add to Firestore query)
- Admin users: filter `visibility in ['public', 'internal']`
- Superadmin: no filter

### 7D. Details Dialog

InsightActivityCard details dialog hides:
- `metadata.userId` unless admin
- `metadata.email` unless admin
- Raw Firestore paths unless superadmin
- Error stack traces unless admin

### Tasks
- [x] Add `visibility` field to `logActivity()` in both frontend/backend services (v1.5.0 frontend, v1.2.0 backend)
- [x] Set default visibility per activity type (26 types mapped: public/internal/admin per roadmap)
- [x] Update `firestore.rules` with visibility enforcement (v1.12.0 - role-based read controls)
- [x] Backfill existing logs with appropriate visibility (executed via backfillVisibility callable)
- [x] Create insightsQueryService.js with role-based filtering (v1.0.0)
- [x] Sanitize details dialog metadata by role (pending Phase 5 UI implementation)

---

## Phase 8 — Calendar Readiness

**Status:** 🔴 NOT STARTED

### 8A. InsightsPanel Context Support

Ensure `InsightsPanel` handles empty context gracefully:

```jsx
// Calendar with no event selected
<InsightsPanel context={{}} />  // → Shows trending insights

// Calendar with event selected (future)
<InsightsPanel context={{ 
  eventIdentity: { nameKey: 'nfp', currencyKey: 'usd', dateKey: 1707436800000 },
  eventId: 'canonical-doc-id',
  currency: 'USD'
}} />
```

### 8B. Calendar Integration Checklist (Future Task)

- [ ] Calendar2Page: Replace placeholder Tab2 (`t('calendar:tabs.comingSoon')`) with Insights
- [ ] Pass selected event identity from calendar row click → InsightsPanel context
- [ ] Sync currency filter from `eventFilters.currencies` to InsightsPanel
- [ ] Sync timeframe from `eventFilters.datePreset` to InsightsPanel
- [ ] Tab labels: "Clock" + "Insights" (replace "Tab 2")
- [ ] Test with current time, currency, and impact filters from ClockEventsFilters

### Tasks
- [ ] Verify InsightsPanel renders correctly with `context={}`
- [ ] Document Calendar integration steps in this roadmap
- [ ] Ensure `useInsightsFeed` handles empty context (trending mode)

---

## Firestore Schema Changes

### New Fields on Existing Collections

| Collection | Field | Type | When Written |
|------------|-------|------|-------------|
| `blogPosts/{id}` | `insightKeys` | `string[]` | On publish/update |
| `systemActivityLog/{id}` | `insightKeys` | `string[]` | On every log write |
| `systemActivityLog/{id}` | `visibility` | `string` | On every log write (Phase 7) |
| `users/{uid}/eventNotes/{key}` | `insightKeys` | `string[]` | On note add/remove (summary doc) |

### New Collections

| Collection | Purpose | Phase |
|------------|---------|-------|
| `insightsIndex/{key}` | Trending key aggregation | Phase 3 (or deferred) |
| `users/{uid}/insightsIndex/{key}` | Per-user trending keys (notes) | Phase 3 (optional) |

---

## Composite Indexes Required

Add to `firestore.indexes.json` before any Insights queries ship:

```json
{
  "indexes": [
    {
      "collectionGroup": "systemActivityLog",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "insightKeys", "arrayConfig": "CONTAINS" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "blogPosts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "insightKeys", "arrayConfig": "CONTAINS" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "insightsIndex",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "keyType", "order": "ASCENDING" },
        { "fieldPath": "trendingScore", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## i18n Namespace Plan

**New namespace:** `insights` (added to all 3 languages)

### Key Structure

```json
{
  "title": "Insights",
  "filters": {
    "all": "All",
    "articles": "Articles",
    "activity": "Activity",
    "notes": "Notes",
    "timeframe": "Timeframe",
    "24h": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "allTime": "All time",
    "event": "Event",
    "currency": "Currency"
  },
  "empty": {
    "noResults": "No insights match your filters",
    "selectFilters": "Select an event or currency to narrow results",
    "trending": "Trending Insights"
  },
  "card": {
    "readMore": "Read more",
    "viewDetails": "View details",
    "noteBy": "Note by you",
    "severity": {
      "info": "Info",
      "warning": "Warning",
      "error": "Error",
      "success": "Success"
    }
  }
}
```

**Config change:** Add `'insights'` to `ns:` array in `src/i18n/config.js` when Phase 5 ships.

---

## Filter Sync with ClockEventsFilters

### Design Decision: Read-Only Sync

Insights reads *from* ClockEventsFilters context but does **not** write back:

```
ClockEventsFilters (SettingsContext.eventFilters)
  ├── currencies: ['USD', 'EUR']  ─→  Insights pre-populates currency filter
  ├── datePreset: 'thisWeek'      ─→  Insights maps to timeframe: '7d'
  ├── impacts: [...]              ─→  Not used by Insights
  └── favoritesOnly: true         ─→  Not used by Insights (Insights has its own note filter)

Insights (local state, not persisted)
  ├── sourceTypes: ['article', 'activity']
  ├── eventKey: 'nfp'
  ├── currency: 'USD' (pre-populated from eventFilters)
  └── timeframe: '7d' (mapped from datePreset)
```

### Mapping Table

| ClockEventsFilters `datePreset` | Insights `timeframe` |
|---------------------------------|---------------------|
| `today` | `24h` |
| `tomorrow` | `24h` |
| `thisWeek` | `7d` |
| `nextWeek` | `7d` |
| `thisMonth` | `30d` |

### Calendar Integration (Future)

When Calendar2Page passes eventFilters context:
1. If `currencies.length === 1`, pre-set Insights `currency` to that value
2. If user has selected an event row, pass `eventIdentity` as context
3. Insights responds to context changes reactively (useEffect dependency)

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-09 | Use `insightKeys` string array with `array-contains` for all queries | Firestore's most efficient multi-value query pattern. Matches existing `searchTokens` pattern on blog posts. |
| 2026-02-09 | Notes are per-user only — no cross-user aggregation | Notes are private data in `users/{uid}/eventNotes`. Cross-user queries would require a denormalized collection. Not needed for MVP. |
| 2026-02-09 | Insights filters are local state, not persisted to SettingsContext | Insights filters are ephemeral (change per page/tab). Persisting would add complexity to eventFilters shape. Can revisit if users request persistence. |
| 2026-02-09 | Read-only sync from ClockEventsFilters → Insights | Prevents bidirectional state sync issues. Insights consumes context, doesn't modify parent filter state. |
| 2026-02-09 | BlogPostPage converts `right=` → `rightTabs` (not a new layout) | Reuses existing TabbedStickyPanel. No layout regression risk. Documented in RIGHT_SIDEBAR_TABS_TRACE.md. |
| 2026-02-09 | `insightsIndex` collection is Phase 3 enhancement, not MVP blocker | MVP fallback: aggregate top keys from last 200 activity logs client-side. Bounded query, no unbounded scan. |
| 2026-02-09 | Two existing activity loggers should be consolidated to one | `activityLogger.js` (deterministic IDs) and `adminActivityService.js` overlap. Consolidate during Phase 2 to ensure all logs get `insightKeys`. |
| 2026-02-09 | Default `visibility` for existing logs: `public` for most, `admin` for user_signup | Conservative default. Most activity types are informational (sync, blog publish). User data should be admin-only. |

---

## Progress Log

| Date | Phase | Action | Notes |
|------|-------|--------|-------|
| 2026-02-09 | Phase 0 | ✅ Completed right-column tabs trace | Created RIGHT_SIDEBAR_TABS_TRACE.md. TabbedStickyPanel fully documented. |
| 2026-02-09 | All | ✅ Completed full codebase audit | Audited: TabbedStickyPanel, MainLayout, BlogPostPage, Calendar2Page, blogService, blogTypes, activityLogger, activityLoggingService, eventNotesService, favoritesService, ClockEventsFilters, SettingsContext, firestore.rules, firestore.indexes.json, i18n config. |
| 2026-02-09 | All | ✅ Created INSIGHTS_ROADMAP.md v0.1.0 | Design phase complete. 8 phases defined with tasks, schema, indexes, i18n plan, filter sync strategy, and decisions log. |
| 2026-02-09 | Phase 2 | ✅ Implemented insightKeys data layer | Created insightKeysUtils.js with computation functions. Integrated insightKeys into blogService.js (4 write paths), activityLogger.js, eventNotesService.js. Fixed bugs: normalizeKey hyphen handling, activity logger currency field. |
| 2026-02-09 | Phase 2 | ✅ Backend backfill service deployed | Created backfillInsightKeysService.ts, integrated into Cloud Function callable (v1.11.0). Idempotent backfill for blogPosts, systemActivityLog, eventNotes. Fixed Firebase initialization pattern. |
| 2026-02-09 | Phase 2 | ✅ Superadmin UI created | Added BuildIcon button to SettingsSidebar2.jsx header. Created BackfillProgressModal.jsx with 3-phase stepper, results table, aggregate totals. Added i18n keys (EN/ES/FR). |
| 2026-02-09 | Phase 2 | ✅ Firestore indexes deployed | 4 composite indexes added to firestore.indexes.json for insightKeys array-contains queries. Deployed via `firebase deploy --only firestore:indexes`. |
| 2026-02-09 | Phase 2 | ✅ Backfill execution verified | Backfill ran successfully: 142 total docs scanned (21 blogPosts, 115 activityLog, 6 eventNotes), 0 errors. All skipped (expected if docs already have correct insightKeys from Phase 2 write paths). |
| 2026-02-09 | Phase 7 | ✅ Backend visibility field added | Updated activityLoggingService.ts (v1.2.0): Added visibility field + insightKeys computation to all activity logs. Fixed return types in insightKeysUtils.ts. |
| 2026-02-09 | Phase 7 | ✅ Firestore rules enforced | Updated firestore.rules (v1.12.0): Added visibility-based read control (public→all, internal→admin+, admin→superadmin). Create validates visibility field present. |
| 2026-02-09 | Phase 7 | ✅ Backfill service created | Created backfillVisibilityService.ts for one-time migration of existing activity logs. Added callable backfillVisibility in index.ts (v1.12.0) with superadmin RBAC. |
| 2026-02-09 | Phase 7 | ✅ Query service with visibility filtering | Created insightsQueryService.js (v1.0.0): Resolves query plans, determines visibility filter per user role, queries activity logs with role-based constraints. Stubs for blog/note queries (Phase 5). |
| 2026-02-09 | Phase 7 | ✅ Deployment complete | Phase 7 deployed successfully via `firebase deploy --only functions`. Functions: backfillVisibility callable + visibility field additions ready. Backend: activityLoggingService.ts (v1.2.0) + backfillVisibilityService.ts. Firestore rules: visibility-based read enforcement active. |
| 2026-02-10 | Phase 3 | ✅ Prioritization algorithm created | Created insightsPrioritization.js (v1.0.0) with ranking (recency + severity + engagement + multiMatch) and diversity constraints (no >2 consecutive, max 3 per event, >1 article in top 6). Tested: exponential decay, engagement boost capping, constraint satisfaction. |
| 2026-02-10 | Phase 3 | ✅ COMPLETE | MVP fallback strategy implemented (aggregateTrendingKeys + deduplicateItems). Integrated ranking into insightsQueryService.js. Phase 3 fully operational: query plans resolved, Firestore queries execute with visibility filtering, results ranked + deduplicated + diversified. |
| 2026-02-10 | Phase 4 | 🟡 IN PROGRESS | Query plan resolver (Phase 7), per-key queries (Phase 7), and merge+rank (Phase 3) all implemented. Phase 4 now executes end-to-end: context/filters → query plan → Firestore queries → ranking/dedup → sorted results. Caching deferred unless performance issues detected. |

---

## Implementation Order (Recommended)

```
Phase 2 (insightKeys)  ←── FOUNDATION — must be first
  ↓
Phase 7 (visibility)   ←── Security before UI
  ↓
Phase 3 (prioritization engine)
  ↓
Phase 4 (data engine)
  ↓
Phase 5 (UI)
  ↓
Phase 6 (BlogPostPage integration)
  ↓
Phase 8 (Calendar readiness)
```

**Why Phase 2 first:** Every other phase depends on `insightKeys` being present on documents. The backfill + index deployment takes time (Firestore index building can take minutes to hours).

**Why Phase 7 before UI:** Security visibility field should be on new activity logs from the start. Backfilling later is harder than setting defaults now.

---

*This is a living document. Update after each PR with task checkoffs, dated progress entries, and any decision changes.*
