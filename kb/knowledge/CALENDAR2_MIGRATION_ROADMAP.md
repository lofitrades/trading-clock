# Calendar 2.0 Migration Roadmap

**Created:** 2026-02-07  
**Status:** 🟡 In Progress  
**Goal:** Replace legacy `/calendar` stack with `Calendar2Page.jsx`, sync filters cross-session via `SettingsContext`, preserve SEO, then remove dead files.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Filter Sync Gap (Critical)](#3-filter-sync-gap-critical)
4. [Migration Phases](#4-migration-phases)
5. [Phase 1: Route Swap](#phase-1-route-swap)
6. [Phase 2: Filter Sync](#phase-2-filter-sync)
7. [Phase 3: Feature Parity](#phase-3-feature-parity)
8. [Phase 4: Cleanup & Deletion](#phase-4-cleanup--deletion)
9. [Phase 5: Documentation & Verification](#phase-5-documentation--verification)
10. [SEO Preservation Checklist](#seo-preservation-checklist)
11. [Files Affected](#files-affected)
12. [Validation Checklist](#validation-checklist)
13. [Execution Log](#execution-log)

---

## 1. Architecture Overview

### Before Migration (current)

```
/calendar route (AppRoutes.jsx)
└── CalendarPage.jsx (src/components/)
    └── CalendarEmbed.jsx (~2500 lines)
        ├── EventsFilters3.jsx (controlled component, ~800 lines)
        ├── CalendarGridLayout.jsx (two-column layout)
        ├── ClockPanelPaper.jsx (clock sidebar)
        └── useCalendarData.js (bidirectional SettingsContext sync)

/calendar2 route (AppRoutes.jsx)
└── Calendar2Page.jsx (src/pages/, ~1021 lines)
    ├── MainLayout.jsx (simple 2fr/1fr grid, ~99 lines)
    ├── Inline filters (date preset, currencies, impacts, favorites)
    ├── ClockPanelPaper.jsx (lazy)
    └── useCalendarData.js (named import)

CalendarEmbedLayout.jsx — ORPHANED (zero imports, already dead)
```

### After Migration (target)

```
/calendar route (AppRoutes.jsx)
└── Calendar2Page.jsx (src/pages/, primary calendar page)
    ├── MainLayout.jsx (reusable 2fr/1fr grid)
    ├── Inline filters ← synced with SettingsContext (read + write)
    ├── ClockPanelPaper.jsx (lazy, receives synced eventFilters)
    └── useCalendarData.js (applyFilters → persistFilters → SettingsContext)

/clock route (App.jsx) — unchanged
└── EventsFilters3.jsx (still used for clock page compact filters)

DELETED:
  - CalendarPage.jsx
  - CalendarEmbed.jsx
  - CalendarEmbedLayout.jsx
  - CalendarGridLayout.jsx
```

---

## 2. Current State Analysis

### Calendar2Page.jsx — Current Capabilities

| Feature | Status | Notes |
|---------|--------|-------|
| Date preset filter (today/tomorrow/week/month) | ✅ | Inline `<Select>` |
| Currency multi-select filter | ✅ | `ClearableSelect` with flags |
| Impact multi-select filter | ✅ | `ClearableSelect` with color dots |
| Favorites toggle | ✅ | Icon button in filter row |
| Day-grouped table with dividers | ✅ | `DayDividerRow` + `EventRow` |
| NOW/NEXT badges and detection | ✅ | `computeNowNextState` + `Chip` |
| Jump-to-Now FAB | ✅ | Fixed `Fab` button |
| ClockPanelPaper (right column) | ✅ | Lazy-loaded, full settings pass-through |
| EventModal (click row → details) | ✅ | Lazy-loaded |
| AuthModal2 | ✅ | Lazy-loaded |
| SettingsSidebar2 | ✅ | Lazy-loaded |
| ContactModal | ✅ | Lazy-loaded |
| PublicLayout + AppBar nav | ✅ | `useAppBarNavItems` |
| Responsive A/F/P columns (lg+) | ✅ | `hideBelow: 'lg'` |
| i18n (all text via t keys) | ✅ | Namespaces: calendar, filter, common |
| Search query filter | 🟡 Deferred | Skipped in Phase 3 MVP for performance. Infrastructure ready (searchTokens on events). Implement in future with Algolia or batched client-side search. |
| CustomEventDialog | ❌ Missing | CalendarPage had this lazy-loaded |
| Filter sync FROM SettingsContext | ❌ Missing | Initializes with hardcoded defaults |
| Filter sync TO SettingsContext | ❌ Missing | Local state never writes back |
| `onOpenAddReminder` nav prop | ❌ Missing | PublicLayout support exists, not wired |

### EventsFilters3.jsx — Kept for /clock

`App.jsx` lazy-imports `EventsFilters3` for the `/clock` page's compact filter strip (impact, currency, favorites — **no date, no search**). It reads/writes `SettingsContext.eventFilters` directly. This is NOT removed during Calendar2 migration.

---

## 3. Filter Sync Gap (Critical)

### The Problem

Calendar2Page's filter state is local-only — hardcoded defaults on mount, never reads from or writes to `SettingsContext`:

```javascript
// Calendar2Page.jsx lines 575-578 — CURRENT (broken sync)
const [datePreset, setDatePreset] = useState('today');           // ❌ hardcoded
const [selectedCurrencies, setSelectedCurrencies] = useState([]); // ❌ hardcoded
const [selectedImpacts, setSelectedImpacts] = useState([]);       // ❌ hardcoded
const [favoritesOnly, setFavoritesOnly] = useState(false);        // ❌ hardcoded
```

### The Impact

1. **Cross-page desync:** User sets "USD + Strong Data" on `/clock` → navigates to `/calendar` → filters reset to empty
2. **No persistence:** Refresh `/calendar` → filters gone (no localStorage/Firestore)  
3. **Clock overlay stale:** `ClockPanelPaper` receives `settingsContext.eventFilters` (line 948) which is never updated by Calendar2Page's local changes

### The Fix (Phase 2)

**Read from SettingsContext** on init:
```javascript
const { eventFilters, updateEventFilters } = settingsContext;

const [selectedCurrencies, setSelectedCurrencies] = useState(
    () => eventFilters?.currencies?.length ? eventFilters.currencies : []
);
const [selectedImpacts, setSelectedImpacts] = useState(
    () => eventFilters?.impacts?.length ? eventFilters.impacts : []
);
const [favoritesOnly, setFavoritesOnly] = useState(
    () => eventFilters?.favoritesOnly ?? false
);
```

**Write back to SettingsContext** on change (via `applyFilters` which already calls `persistFilters` → `updateEventFilters`):

The `useCalendarData.applyFilters()` already calls `persistFilters(resolved)` → `updateEventFilters(nextFilters)` → SettingsContext → localStorage + Firestore. So the write-back is already handled — the gap is only on the **read** side.

### Data Flow After Fix

```
Calendar2Page local state (fast UI updates)
      │
      ├──→ applyFilters() → useCalendarData
      │         │
      │         ├──→ setFilters() → fetchEvents (data layer)
      │         └──→ persistFilters() → updateEventFilters() → SettingsContext
      │                                        │
      │                                   ┌────┴────┐
      │                                   │         │
      │                              localStorage  Firestore
      │                                   │    (authenticated)
      │                                   │
      └──→ ClockPanelPaper receives overlayEventFilters (derived from local state)

/clock page (App.jsx)
      │
      └──→ EventsFilters3 reads SettingsContext.eventFilters (in-sync after navigation)
```

### datePreset Caveat

`SettingsContext` stores `startDate`/`endDate` (Date objects), NOT preset names like `'today'`. So:
- Calendar2Page keeps `datePreset` as local state (UI-only concept)
- On init, we detect preset from persisted dates (or default to `'today'`)
- `applyFilters()` converts preset → date range → persists dates

---

## 4. Migration Phases

| Phase | Description | Risk | Reversible |
|-------|-------------|------|------------|
| **1. Route Swap** | `/calendar` → Calendar2Page, remove `/calendar2` | Low | ✅ Git revert |
| **2. Filter Sync** | Init from SettingsContext, write-back via applyFilters | Low | ✅ Git revert |
| **3. Feature Parity** | Add search, CustomEventDialog, onOpenAddReminder | Medium | ✅ Incremental |
| **4. Cleanup** | Delete dead files | Low | ✅ Git history |
| **5. Docs & Verify** | Update kb.md, headers, run validation | Low | N/A |

---

## Phase 1: Route Swap

**Goal:** `/calendar` renders Calendar2Page. Zero SEO impact.

### Step 1.1 — AppRoutes.jsx

**File:** `src/routes/AppRoutes.jsx`

| Change | Details |
|--------|---------|
| Remove lazy import | `const CalendarPage = lazy(() => import('../components/CalendarPage'));` |
| Update Calendar2Page comment | Rename from "Calendar 2.0" to "Calendar Page (primary)" |
| Swap `/calendar` route | Replace `<CalendarPage />` with `<Calendar2Page />` |
| Remove `/calendar2` route block | Entire `<Route path="/calendar2">` block |

### Step 1.2 — Calendar2Page.jsx redirectPath

**File:** `src/pages/Calendar2Page.jsx` (line ~999)

Change `redirectPath="/calendar2"` → `redirectPath="/calendar"` in the `AuthModal2` render.

### Step 1.3 — Prerender Shell (pages/calendar.page.jsx)

**File:** `pages/calendar.page.jsx` (line ~25)

Change dynamic import target:
```javascript
// BEFORE
calendarPageModulePromise = import('../src/components/CalendarPage');
// AFTER
calendarPageModulePromise = import('../src/pages/Calendar2Page');
```

**SEO Impact:** ZERO — the prerender shell HTML, meta tags, structured data, FAQ schema, breadcrumbs, `route = '/calendar'`, and `prerender = true` all remain identical. Only the client-side hydration module changes.

### Step 1.4 — Calendar2Page.jsx Header Update

Update file header version and changelog.

### Verification

- [ ] `npm run dev` → navigate to `/calendar` → Calendar2Page renders
- [ ] `/calendar2` → 404 (route removed)
- [ ] Navigation AppBar "Calendar" link → `/calendar` works
- [ ] Prerender: `npm run build` → check `dist/calendar/index.html` exists with correct meta

---

## Phase 2: Filter Sync

**Goal:** Calendar2Page initializes from and writes back to `SettingsContext.eventFilters`. Filters persist across sessions, pages, and devices.

### Step 2.1 — Initialize from SettingsContext

**File:** `src/pages/Calendar2Page.jsx`

Replace hardcoded `useState` defaults with `SettingsContext` values:

```javascript
const { eventFilters, updateEventFilters } = settingsContext;

const [selectedCurrencies, setSelectedCurrencies] = useState(
    () => eventFilters?.currencies?.length ? eventFilters.currencies : []
);
const [selectedImpacts, setSelectedImpacts] = useState(
    () => eventFilters?.impacts?.length ? eventFilters.impacts : []
);
const [favoritesOnly, setFavoritesOnly] = useState(
    () => eventFilters?.favoritesOnly ?? false
);
```

`datePreset` remains `'today'` default — SettingsContext stores raw dates, not preset names.

### Step 2.2 — Write-back is Already Handled

`applyFilters()` in `useCalendarData.js` already calls:
```
applyFilters(merged) → persistFilters(resolved) → updateEventFilters(resolved) → SettingsContext
```

So every filter change from Calendar2Page's `useEffect` → `applyFilters()` already persists. No additional write-back code needed.

### Step 2.3 — Sync ClockPanelPaper Filters

**File:** `src/pages/Calendar2Page.jsx`

Currently passes `eventFilters={settingsContext.eventFilters}` (stale until write-back completes). Replace with derived overlay filters:

```javascript
const overlayEventFilters = useMemo(() => ({
    ...settingsContext.eventFilters,
    currencies: selectedCurrencies,
    impacts: selectedImpacts,
    favoritesOnly,
}), [settingsContext.eventFilters, selectedCurrencies, selectedImpacts, favoritesOnly]);

// In ClockPanelPaper:
eventFilters={overlayEventFilters}
```

### Step 2.4 — Incoming Sync (SettingsContext → local)

Add an effect to sync FROM SettingsContext when filters change externally (e.g., SettingsSidebar2 reset, Firestore remote sync):

```javascript
const prevContextFiltersRef = useRef(eventFilters);
useEffect(() => {
    const prev = prevContextFiltersRef.current;
    if (prev === eventFilters) return;
    prevContextFiltersRef.current = eventFilters;
    
    // Only sync non-date fields (date preset is local UI concept)
    if (JSON.stringify(eventFilters.currencies) !== JSON.stringify(selectedCurrencies)) {
        setSelectedCurrencies(eventFilters.currencies || []);
    }
    if (JSON.stringify(eventFilters.impacts) !== JSON.stringify(selectedImpacts)) {
        setSelectedImpacts(eventFilters.impacts || []);
    }
    if (eventFilters.favoritesOnly !== favoritesOnly) {
        setFavoritesOnly(eventFilters.favoritesOnly || false);
    }
}, [eventFilters]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Verification

- [ ] Set USD + Strong Data on `/clock` → navigate to `/calendar` → filters show USD + Strong Data
- [ ] Change filters on `/calendar` → navigate to `/clock` → EventsFilters3 reflects changes
- [ ] Refresh `/calendar` → filters persist (localStorage)
- [ ] Log out → log in → filters restore from Firestore
- [ ] ClockPanelPaper overlay shows events matching current filters

---

## Phase 3: Feature Parity

**Goal:** Add missing features that CalendarEmbed had.

### Step 3.1 — Search Query Filter (Deferred)

**Status:** SKIPPED in this migration (Phase 3 MVP). Infrastructure already in place for future implementation.

**Why deferred:** Search requires iterating 1000+ events per language and scoring against searchTokens (CPU-intensive). Better suited for:
- Firestore full-text search (requires backend index)
- Algolia integration (managed search service)
- Batched client-side search with memoization

**Infrastructure ready:**
- `economicEvents` Firestore collection already has `searchTokens` field on each event (computed during sync)
- `useCalendarData` hook already accepts `searchQuery` parameter and filters results
- EventsFilters3 on `/clock` page is NOT being modified (no search there either)

**To implement later:**
1. Add `TextField` to Calendar2Page filters row
2. Store search query in local state (UI-only, not in SettingsContext — search is ephemeral)
3. Pass `searchQuery` to `applyFilters()` → `useCalendarData` filters events
4. Benchmark performance with 1000+ events before production

**No code changes needed now.** When ready, just uncomment TextField and add parameter to applyFilters().

---

### Step 3.2 — CustomEventDialog

Add lazy import and state management (same pattern as CalendarPage.jsx):

```javascript
const CustomEventDialog = lazy(() => import('../components/CustomEventDialog'));

const [customDialogOpen, setCustomDialogOpen] = useState(false);
const handleOpenCustomDialog = useCallback(() => setCustomDialogOpen(true), []);
const handleCloseCustomDialog = useCallback(() => setCustomDialogOpen(false), []);
```

Wire `onOpenAddReminder={handleOpenCustomDialog}` in `PublicLayout` props.

### Step 3.3 — Auth-Gated Custom Event Save

Same pattern as CalendarPage:

```javascript
const { isAuthenticated } = useAuth();

const handleSaveCustomEvent = useCallback(() => {
    if (!isAuthenticated()) {
        setCustomDialogOpen(false);
        setAuthModalOpen(true);
        return;
    }
    setCustomDialogOpen(false);
}, [isAuthenticated]);
```

### Verification

- [ ] "Add Event" nav item opens CustomEventDialog
- [ ] Non-auth user → save custom event → AuthModal2 appears
- [ ] Auth user → save custom event → dialog closes, event created

---

## Phase 4: Cleanup & Deletion

**Goal:** Remove dead code. Only proceed after Phases 1-3 are validated.

### Files to DELETE

| File | Reason |
|------|--------|
| `src/components/CalendarPage.jsx` | No route, no imports after Phase 1 |
| `src/components/CalendarEmbed.jsx` | Only imported by CalendarPage |
| `src/components/CalendarEmbedLayout.jsx` | Already orphaned (zero imports) |
| `src/components/CalendarGridLayout.jsx` | Only imported by CalendarEmbed |

### Files to KEEP

| File | Reason |
|------|--------|
| `src/components/EventsFilters3.jsx` | Still used by `App.jsx` for `/clock` page |
| `src/components/ClockPanelPaper.jsx` | Used by Calendar2Page |
| `src/hooks/useCalendarData.js` | Used by Calendar2Page |
| `src/components/layouts/MainLayout.jsx` | Used by Calendar2Page + admin pages |

### Verification

- [ ] `npm run build` succeeds with zero errors
- [ ] No broken imports in console
- [ ] `/calendar` renders correctly
- [ ] `/clock` renders correctly (EventsFilters3 still works)
- [ ] No references to deleted files in remaining code

---

## Phase 5: Documentation & Verification

### Step 5.1 — Update Calendar2Page Header

```javascript
/**
 * src/pages/Calendar2Page.jsx
 *
 * Purpose: Primary /calendar page — economic calendar with two-column layout.
 * Left column: date/currency/impact/search filters + compact MUI table with day dividers.
 * Right column: ClockPanelPaper (trading clock).
 * Filters sync bidirectionally with SettingsContext for cross-page/session persistence.
 *
 * Changelog:
 * v2.0.0 - 2026-02-07 - MIGRATION: Became primary /calendar page. Added filter sync
 *                       with SettingsContext, search query, CustomEventDialog.
 * v1.1.0 - 2026-02-06 - Integrated ClockPanelPaper into right column
 * v1.0.0 - 2026-02-06 - Initial implementation (Calendar 2.0 fast table)
 */
```

### Step 5.2 — Update AppRoutes.jsx Header

Add changelog entry for route swap.

### Step 5.3 — Update kb/kb.md Change Log

Add entry documenting Calendar 2.0 migration.

### Step 5.4 — Locale Sync

```bash
npm run sync-locales
```

Verify no orphaned translation keys.

### Step 5.5 — SEO Verification

```bash
npm run build
```

Check `dist/calendar/index.html`:
- [ ] Has correct `<title>` and `<meta name="description">`
- [ ] Has `<link rel="canonical" href="https://time2.trade/calendar">`
- [ ] Has hreflang tags for `/es/calendar` and `/fr/calendar`
- [ ] Has FAQ structured data (`FAQPage` schema)
- [ ] Has BreadcrumbList structured data
- [ ] Has WebPage structured data
- [ ] Noscript fallback content is present

---

## SEO Preservation Checklist

| SEO Element | Location | Change Required | Risk |
|-------------|----------|-----------------|------|
| URL `/calendar` | AppRoutes.jsx | Route target changes, URL stays same | None |
| Canonical `https://time2.trade/calendar` | prerender.mjs | No change | None |
| `<title>` tag | prerender.mjs + pages/calendar.page.jsx | No change | None |
| `<meta description>` | prerender.mjs + pages/calendar.page.jsx | No change | None |
| hreflang `/es/calendar`, `/fr/calendar` | prerender.mjs | No change | None |
| OG tags (title, description, image) | prerender.mjs | No change | None |
| FAQ schema (FAQPage) | pages/calendar.page.jsx | No change | None |
| WebPage schema | pages/calendar.page.jsx | No change | None |
| BreadcrumbList schema | pages/calendar.page.jsx | No change | None |
| sitemap.xml `/calendar` entry | generate-sitemap.mjs | No change | None |
| robots.txt | public/robots.txt | No change | None |
| Prerender noscript content | pages/calendar.page.jsx | No change | None |
| Firebase hosting rewrites | firebase.json | No change | None |

**Summary:** Zero SEO risk. Only the dynamically-imported SPA component changes. All static SEO artifacts (prerender shell, meta tags, structured data, sitemap, canonical) are untouched.

---

## Files Affected

### Modified

| File | Phase | Changes |
|------|-------|---------|
| `src/routes/AppRoutes.jsx` | 1 | Swap route, remove `/calendar2`, remove CalendarPage import |
| `src/pages/Calendar2Page.jsx` | 1,2,3 | Fix redirectPath, add filter sync, add CustomEventDialog (search deferred) |
| `pages/calendar.page.jsx` | 1 | Update dynamic import path |

### Deleted (Phase 4 only)

| File | Lines | Reason |
|------|-------|--------|
| `src/components/CalendarPage.jsx` | ~140 | Dead route |
| `src/components/CalendarEmbed.jsx` | ~2500 | Dead import chain |
| `src/components/CalendarEmbedLayout.jsx` | ~330 | Already orphaned |
| `src/components/CalendarGridLayout.jsx` | ~300 | Dead import chain |

### Unchanged

| File | Reason |
|------|--------|
| `src/App.jsx` | Still uses EventsFilters3 for /clock |
| `src/components/EventsFilters3.jsx` | Still used by App.jsx |
| `src/hooks/useCalendarData.js` | No changes needed (applyFilters already syncs) |
| `src/contexts/SettingsContext.jsx` | No changes needed |
| `scripts/prerender.mjs` | No changes needed (SEO metadata unchanged) |
| `scripts/generate-sitemap.mjs` | No changes needed |
| `public/robots.txt` | No changes needed |
| `firebase.json` | No changes needed |

---

## Validation Checklist

### Functional Tests

- [ ] `/calendar` loads Calendar2Page with two-column layout
- [ ] `/calendar2` returns 404
- [ ] Date preset filter changes event list
- [ ] Currency filter narrows events by currency
- [ ] Impact filter narrows events by impact level
- [ ] Favorites toggle shows only favorited events
- [ ] Event row click opens EventModal with correct data
- [ ] EventModal shows favorite toggle, notes, details
- [ ] Jump-to-Now FAB scrolls to current/next event
- [ ] NOW/NEXT badges appear on correct event rows
- [ ] ClockPanelPaper renders clock with correct timezone
- [ ] ClockPanelPaper overlay reflects current filters
- [ ] AuthModal2 opens from nav and settings
- [ ] SettingsSidebar2 opens and settings persist
- [ ] ContactModal opens from nav
- [ ] CustomEventDialog opens and saves

### Filter Sync Tests

- [ ] Set filters on `/calendar` → navigate to `/clock` → EventsFilters3 reflects same currencies/impacts/favorites
- [ ] Set filters on `/clock` → navigate to `/calendar` → inline filters reflect same currencies/impacts/favorites
- [ ] Refresh `/calendar` → filters restore from localStorage
- [ ] Log in → set filters → log out → log in → filters restore from Firestore
- [ ] Reset settings (SettingsSidebar2) → `/calendar` filters reset to defaults
- [ ] ClockPanelPaper overlay updates when Calendar2Page filters change

### SEO Tests

- [ ] `npm run build` produces `dist/calendar/index.html` with all meta tags
- [ ] `dist/es/calendar/index.html` exists with Spanish meta tags
- [ ] `dist/fr/calendar/index.html` exists with French meta tags
- [ ] Sitemap includes `/calendar` with priority 0.9
- [ ] Canonical URL is `https://time2.trade/calendar`
- [ ] FAQ structured data is intact

### Responsive Tests

- [ ] Mobile (xs): Single column, table with 4 visible columns (time, currency, impact, event)
- [ ] Tablet (md): Two-column grid, clock panel visible
- [ ] Desktop (lg+): Two-column grid, A/F/P columns visible in table
- [ ] Bottom nav visible on xs/sm, hidden on md+
- [ ] FAB positioned above bottom nav on xs, standard position on md+

---

## Execution Log

Track each implementation step here. Update status as work progresses.

| Step | Status | Date | Notes |
|------|--------|------|-------|
| Phase 1.1 — AppRoutes route swap | ⬜ Not Started | | |
| Phase 1.2 — Calendar2Page redirectPath fix | ⬜ Not Started | | |
| Phase 1.3 — Prerender shell import update | ⬜ Not Started | | |
| Phase 1.4 — Calendar2Page header update | ⬜ Not Started | | |
| Phase 1 Verification | ⬜ Not Started | | |
| Phase 2.1 — Init filters from SettingsContext | ⬜ Not Started | | |
| Phase 2.3 — Sync ClockPanelPaper filters | ⬜ Not Started | | |
| Phase 2.4 — Incoming sync effect | ⬜ Not Started | | |
| Phase 2 Verification | ⬜ Not Started | | |
| Phase 3.1 — Search query filter | ⏭️ Skipped (deferred) | | Infrastructure ready, implement in future iteration |
| Phase 3.2 — CustomEventDialog | ⬜ Not Started | | |
| Phase 3.3 — Auth-gated save | ⬜ Not Started | | |
| Phase 3 Verification | ⬜ Not Started | | |
| Phase 4 — Delete dead files | ⬜ Not Started | | |
| Phase 5.1 — Update file headers | ⬜ Not Started | | |
| Phase 5.2 — Update kb.md | ⬜ Not Started | | |
| Phase 5.3 — Locale sync | ⬜ Not Started | | |
| Phase 5.4 — SEO verification | ⬜ Not Started | | |
| Phase 5.5 — Final build & deploy | ⬜ Not Started | | |

---

## Key Technical References

| Resource | Path | Purpose |
|----------|------|---------|
| Calendar2Page (target) | `src/pages/Calendar2Page.jsx` | New primary calendar page |
| CalendarPage (legacy) | `src/components/CalendarPage.jsx` | To be removed |
| CalendarEmbed (legacy) | `src/components/CalendarEmbed.jsx` | To be removed |
| AppRoutes | `src/routes/AppRoutes.jsx` | Route configuration |
| Prerender shell | `pages/calendar.page.jsx` | SSR/SEO prerender |
| SettingsContext | `src/contexts/SettingsContext.jsx` | Filter persistence |
| useCalendarData | `src/hooks/useCalendarData.js` | Data fetching + filter bridge |
| EventsFilters3 | `src/components/EventsFilters3.jsx` | KEEP — used by /clock |
| MainLayout | `src/components/layouts/MainLayout.jsx` | 2-column grid |
| ClockPanelPaper | `src/components/ClockPanelPaper.jsx` | Clock sidebar |
| Prerender script | `scripts/prerender.mjs` | Build-time HTML generation |
| Sitemap generator | `scripts/generate-sitemap.mjs` | Sitemap generation |

### SettingsContext eventFilters Shape

```javascript
{
    startDate: Date | null,       // Persisted to Firestore as Timestamp
    endDate: Date | null,         // Persisted to Firestore as Timestamp
    impacts: string[],            // e.g., ['Strong Data', 'Moderate Data']
    eventTypes: string[],         // Legacy field, rarely used
    currencies: string[],         // e.g., ['USD', 'EUR']
    favoritesOnly: boolean,       // Show only favorited events
    searchQuery: string,          // Text search filter
}
```

### Persistence Layers

```
SettingsContext.updateEventFilters(filters)
    │
    ├── setEventFilters(normalized)     → React state (instant)
    ├── localStorage.setItem(serialized) → localStorage (instant)
    └── saveSettingsToFirestore(firestore) → Firestore (debounced, authenticated)
```

---

*This document is the single source of truth for the Calendar 2.0 migration. Update the Execution Log as each step completes.*
