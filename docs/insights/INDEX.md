/**
 * INSIGHTS FEATURE - IMPLEMENTATION INDEX
 * 
 * Central reference for all Phase 1-8 work
 * Last Updated: February 9, 2026
 * Version: v1.0.0
 */

# Insights Feature Implementation Index

## 📁 Documentation Hierarchy

### Phase Planning & Design
1. **[INSIGHTS_ROADMAP.md](./INSIGHTS_ROADMAP.md)** (1100+ lines)
   - ✅ Complete 8-phase roadmap with decisions log
   - Firestore schema changes + composite indexes
   - i18n namespace planning
   - Filter sync strategy
   - **Start here for architectural overview**

2. **[RIGHT_SIDEBAR_TABS_TRACE.md](./RIGHT_SIDEBAR_TABS_TRACE.md)** (294 lines)
   - How-to guide for adding tabs to right column
   - TabbedStickyPanel + MainLayout integration
   - Mobile/responsive constraints
   - Z-index stack documentation

### Phase Implementation Guides
3. **[PHASE_1_COMPLETION_SUMMARY.md](./PHASE_1_COMPLETION_SUMMARY.md)** (v1.0.0)
   - ✅ COMPLETE — All Phase 1 deliverables locked
   - Type definitions, hook contracts, utility functions
   - Deliverable specs + integration points
   - Testing checklist + acceptance criteria

4. **[PHASE_2_QUICK_REFERENCE.md](./PHASE_2_QUICK_REFERENCE.md)** (v1.0.0)
   - 📋 NEXT PHASE — Quick start for Opus model
   - Task breakdown: blogService, activityLogger, eventNotes, backfill script
   - Code patterns with examples
   - Firestore index requirements
   - Testing checklist

---

## 📝 Source Code Files (Phase 1 ✅)

### Types & Constants
- **[src/types/insightsTypes.js](../../src/types/insightsTypes.js)** (v1.0.0 | 167 lines)
  - JSDoc type definitions (InsightItem, InsightsFilters, InsightsPageContext, UseInsightsFeedReturn)
  - Constants: INSIGHT_KEY_PREFIXES, INSIGHT_SOURCE_TYPES, ACTIVITY_SEVERITY, ACTIVITY_VISIBILITY, INSIGHT_TIMEFRAMES
  - Helper: timeframeToMs(timeframe)
  - **Import in:** Phase 2+ services/hooks/components

### Hooks (Stub)
- **[src/hooks/useInsightsFeed.js](../../src/hooks/useInsightsFeed.js)** (v1.0.0 | 165 lines)
  - React hook stub with full contract + documentation
  - Signature: `useInsightsFeed({ context?, filters? }) → { items, loading, error, hasMore, loadMore, totalBySource }`
  - Session-only cache, fully stateless (BEP)
  - TODO markers for Phase 4 implementation
  - **Use in:** Phase 5 UI components, Phase 6 BlogPostPage, Phase 8 Calendar

### Utilities
- **[src/utils/insightKeysUtils.js](../../src/utils/insightKeysUtils.js)** (v1.0.0 | 355 lines)
  - Pure functions for computing canonical insightKeys:
    - `computeBlogInsightKeys(post)` — Extract from blog posts
    - `computeActivityInsightKeys(type, metadata)` — Extract from activity logs
    - `computeNoteInsightKeys(note)` — Extract from event notes
    - `normalizeKey(str)` — String normalization
    - `findCanonicalSlug(eventName)` — Event slug lookup
  - Constants: BLOG_ECONOMIC_EVENTS (25), BLOG_CURRENCIES (17)
  - Helper: deduplicateKeys(), filterKeysByPrefix()
  - **Import in:** Phase 2 backfill/runtime, Phase 3+ services

---

## 🗺️ Phase Map & Status

| Phase | Goal | Files | Status | Next |
|-------|------|-------|--------|------|
| 0 | Right-column tabs traced | RIGHT_SIDEBAR_TABS_TRACE.md | ✅ DONE | Phase 1 |
| **1** | **Data contracts locked** | **insightsTypes.js, useInsightsFeed.js, insightKeysUtils.js** | **✅ DONE** | **Phase 2** |
| 2 | insightKeys backfill + runtime | blogService, activityLogger, eventNotes, backfill script | 📋 PLANNED | Phase 3 |
| 3 | Prioritization engine | insightsPrioritizationService.js, scoring algo | 🔴 NOT STARTED | Phase 4 |
| 4 | Data engine + queries | useInsightsFeed impl, multi-source merge, caching | 🔴 NOT STARTED | Phase 5 |
| 5 | UI components | InsightsPanel, InsightCard, InsightsTimeline | 🔴 NOT STARTED | Phase 6 |
| 6 | BlogPostPage integration | Convert right={} to rightTabs={} | 🔴 NOT STARTED | Phase 7 |
| 7 | Security + visibility | Firestore rules, role-based filtering | 🔴 NOT STARTED | Phase 8 |
| 8 | Calendar integration | Calendar rightTabs Insights placeholder | 🔴 NOT STARTED | LAUNCH |

---

## 🎯 Quick Start Guide

### For Designers/PMs (Review Architecture)
1. Read: [INSIGHTS_ROADMAP.md](./INSIGHTS_ROADMAP.md) — Section "8-Phase Roadmap"
2. Reference: [RIGHT_SIDEBAR_TABS_TRACE.md](./RIGHT_SIDEBAR_TABS_TRACE.md) — UI constraints

### For Phase 2 Developer (Opus Model)
1. Read: [PHASE_1_COMPLETION_SUMMARY.md](./PHASE_1_COMPLETION_SUMMARY.md) — Understand what's locked
2. Start: [PHASE_2_QUICK_REFERENCE.md](./PHASE_2_QUICK_REFERENCE.md) — Task breakdown with code patterns
3. Reference: [INSIGHTS_ROADMAP.md](./INSIGHTS_ROADMAP.md) — Phase 2 section for context

### For Phase 3+ Developers
1. Check: [PHASE_1_COMPLETION_SUMMARY.md](./PHASE_1_COMPLETION_SUMMARY.md) — Integration points
2. Import: Type definitions from `src/types/insightsTypes.js`
3. Import: Utilities from `src/utils/insightKeysUtils.js`
4. Review: [INSIGHTS_ROADMAP.md](./INSIGHTS_ROADMAP.md) — Your phase section

---

## 🔗 Integration Points (By Phase)

### Phase 1 (Done ✅)
- Created: insightsTypes.js, useInsightsFeed.js, insightKeysUtils.js
- Updated: docs/insights/ directory created

### Phase 2 (Next 📋)
- **Modify:** src/services/blogService.js (add insightKeys computation)
- **Modify:** src/services/activityLogger.js (add insightKeys + visibility)
- **Modify:** src/services/eventNotesService.js (add insightKeys)
- **Create:** functions/src/scripts/backfillInsightKeys.ts (one-time migration)
- **Update:** firestore.indexes.json (deploy new indexes)
- **Import:** computeXxxInsightKeys() from insightKeysUtils.js

### Phase 3 (📋 Planned)
- **Create:** src/services/insightsPrioritizationService.js
- **Import:** insightKeysUtils.js, insightsTypes.js
- **Use:** insightKeys for grouping/ranking

### Phase 4 (📋 Planned)
- **Implement:** src/hooks/useInsightsFeed.js (fill in stub logic)
- **Import:** insightsPrioritizationService, insightsTypes
- **Firestore queries:** Use insightKeys + array-contains

### Phase 5 (📋 Planned)
- **Create:** src/components/InsightsPanel.jsx
- **Create:** src/components/InsightCard.jsx
- **Create:** src/components/InsightsTimeline.jsx
- **Import:** useInsightsFeed, insightsTypes

### Phase 6 (📋 Planned)
- **Modify:** src/pages/BlogPostPage.jsx
- **Change:** `right={SimilarPosts}` → `rightTabs=[{ label: 'Insights', Component: InsightsPanel }]`
- **Pass:** context = { postId, eventTags, currencyTags }

### Phase 7 (📋 Planned)
- **Modify:** Firestore rules (visibility-based filtering)
- **Update:** useInsightsFeed.js (filter by user role + visibility)

### Phase 8 (📋 Planned)
- **Modify:** src/pages/Calendar2Page.jsx
- **Update:** Calendar rightTabs Tab2 placeholder → InsightsPanel
- **Pass:** context = { eventIdentity, eventTags }

---

## 📚 Key Constants & Types

### From insightsTypes.js
```javascript
INSIGHT_KEY_PREFIXES        // 6 prefix types for insightKeys
INSIGHT_SOURCE_TYPES        // { ARTICLE, ACTIVITY, NOTE }
ACTIVITY_SEVERITY           // { CRITICAL, HIGH, MEDIUM, LOW }
ACTIVITY_VISIBILITY         // { PUBLIC, PRIVATE, ADMIN_ONLY }
INSIGHT_TIMEFRAMES          // { HOURS_24, WEEK, MONTH, ALL }
timeframeToMs(timeframe)    // Helper: '7d' → milliseconds
```

### From insightKeysUtils.js
```javascript
BLOG_ECONOMIC_EVENTS        // 25 event slugs (nfp, fomc, cpi, ...)
BLOG_CURRENCIES             // 17 currency codes (USD, EUR, GBP, ...)
computeBlogInsightKeys()    // (post) → string[]
computeActivityInsightKeys() // (type, metadata) → string[]
computeNoteInsightKeys()     // (note) → string[]
normalizeKey()              // (str) → lowercase, underscores
findCanonicalSlug()         // (eventName) → slug | null
```

---

## 🧪 Testing Strategy (BEP)

### Unit Tests
- insightKeysUtils.js functions (pure, deterministic)
- Type definitions parseable (no syntax errors)
- Constants match codebase (BLOG_ECONOMIC_EVENTS × 25, BLOG_CURRENCIES × 17)

### Integration Tests
- blogService.js writes insightKeys ✓
- activityLogger.js writes insightKeys + visibility ✓
- eventNotes collection has insightKeys ✓
- Firestore queries via `array-contains` work ✓

### E2E Tests
- Create blog post → Verify insightKeys in Firestore
- Favorite event → Verify activity log has insightKeys
- Use Insights panel in BlogPostPage → Verify feed populates

---

## 📋 Acceptance Checklist (By Phase)

### Phase 1 ✅ COMPLETE
- [x] src/types/insightsTypes.js created with 6 typedefs
- [x] src/hooks/useInsightsFeed.js stub with contract
- [x] src/utils/insightKeysUtils.js utilities exported
- [x] All files have mandatory file headers
- [x] JSDoc types documented with @example
- [x] BEP principles documented (stateless, pure functions, testable)

### Phase 2 🔴 PENDING
- [ ] blogService.js has insightKeys computation
- [ ] activityLogger.js has insightKeys + visibility
- [ ] eventNotes have insightKeys
- [ ] Backfill script created + tested
- [ ] Firestore indexes deployed
- [ ] Unit + integration tests passing

### Phase 3+ 🔴 NOT STARTED
- [ ] Per-phase acceptance criteria (see INSIGHTS_ROADMAP.md)

---

## 🚀 How to Use This Index

### Finding Code
```
Looking for TypeScript definitions?
  → src/types/insightsTypes.js

Looking for utility functions?
  → src/utils/insightKeysUtils.js

Looking for hook stub?
  → src/hooks/useInsightsFeed.js

Looking for Phase 2 task breakdown?
  → PHASE_2_QUICK_REFERENCE.md

Looking for full architecture?
  → INSIGHTS_ROADMAP.md
```

### Finding Documentation
```
What's Phase 1 about?
  → PHASE_1_COMPLETION_SUMMARY.md

How do I add a right-sidebar tab?
  → RIGHT_SIDEBAR_TABS_TRACE.md

What are all 8 phases?
  → INSIGHTS_ROADMAP.md (Roadmap section)

What's my Phase 2 task?
  → PHASE_2_QUICK_REFERENCE.md (Tasks 1-5)
```

---

## 💡 Key Principles (Reference)

1. **insightKeys Format:** Standardized string array with prefixes (event:, currency:, eventCurrency:, post:, eventNameKey:, eventIdentity:)
2. **Pure Functions:** All computations deterministic, testable, no side effects
3. **Stateless Hooks:** useInsightsFeed reads filters from parent, no local persistence
4. **BEP Compliance:** Type-safe (JSDoc), documented (examples), tested (unit + integration)
5. **Atomic Phases:** Each phase can be reviewed/deployed independently
6. **Firestore-First:** Canonical data in collections, indexes enable queries

---

## 📞 Troubleshooting Quick Links

| Issue | Reference |
|-------|-----------|
| insightKeys not being computed | PHASE_2_QUICK_REFERENCE.md Task 1-3 |
| Hook not importing correctly | Check src/types/insightsTypes.js exports |
| Firestore index build time | PHASE_2_QUICK_REFERENCE.md Troubleshooting |
| Test structure unclear | PHASE_2_QUICK_REFERENCE.md Testing Checklist |
| Phase 2 task order | PHASE_2_QUICK_REFERENCE.md (Tasks 1-5 sequential) |

---

## 📈 Progress Tracking

**Last Updated:** February 9, 2026  
**Phase 1 Status:** ✅ COMPLETE  
**Next Milestone:** Phase 2 (Opus model) — Estimated 2–3 days  
**Current Focus:** Ready for Phase 2 kickoff

---

**For detailed information on any phase, see the corresponding document.**  
**For code questions, review PHASE_1_COMPLETION_SUMMARY.md integration points.**  
**For architecture decisions, review INSIGHTS_ROADMAP.md decisions log.**

