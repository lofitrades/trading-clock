# Economic Events Data Source Comparison

**Generated:** December 1, 2025  
**Analysis Date:** November 30 - December 1, 2025

---

## 📊 Overview Summary

| Metric | MQL5 | Forex Factory | FXStreet |
|--------|------|---------------|----------|
| **Total Events** | 8,531 | 9,269 | 48 |
| **Date Range** | Jan 2, 2024 → Dec 9, 2025 | Jan 1, 2024 → Dec 1, 2025 | Nov 30, 2025 → Dec 2, 2025 |
| **Days Back** | 699 days (~23 months) | 700 days (~23 months) | 0 days |
| **Days Forward** | 9 days | 0 days | 1 day |
| **Total Span** | 708 days (~24 months) | 700 days (~23 months) | 2 days |
| **Historical Coverage** | ✅ Excellent | ✅ Excellent | ❌ None |
| **Future Coverage** | ⚠️ Limited (9 days) | ❌ None | ⚠️ Very Limited (1 day) |

---

## 🎯 Field Coverage Analysis

### Category Field (Event Types)

| Source | Coverage | Unique Categories | Notes |
|--------|----------|-------------------|-------|
| **MQL5** | ✅ 100% (8,531/8,531) | 12 categories | Full categorization |
| **Forex Factory** | ❌ 0% (0/9,269) | 0 categories | No category data |
| **FXStreet** | ❌ 0% (0/48) | 0 categories | No category data |

**MQL5 Categories:**
- Commodity Report
- Consumer Inflation Report
- Core Economy Report
- Currency Report
- Economy Report
- Interest Rate Report
- Job Inflation Report
- Job Report
- Producer Inflation Report
- Production Report
- Speech Report
- Survey Report

### Strength/Impact Field

| Source | Coverage | Values | Notes |
|--------|----------|--------|-------|
| **MQL5** | ✅ 100% (8,531/8,531) | 3 levels | Strong Data, Weak Data, Data Not Loaded |
| **Forex Factory** | ✅ 100% (9,269/9,269) | 3 levels | Strong Data, Weak Data, Data Not Loaded |
| **FXStreet** | ✅ 100% (48/48) | 3 levels | Strong Data, Weak Data, Data Not Loaded |

**✅ All sources provide impact/strength data**

### Currency Field

| Source | Coverage | Unique Currencies | Notes |
|--------|----------|-------------------|-------|
| **MQL5** | ✅ 100% (8,531/8,531) | 8 currencies | USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY |
| **Forex Factory** | ✅ 100% (9,269/9,269) | 8 currencies | Same 8 major currencies |
| **FXStreet** | ✅ 100% (48/48) | 8 currencies | Same 8 major currencies |

**✅ All sources provide full currency coverage**

### Data Completeness (Forecast/Previous/Actual)

| Source | Forecast | Previous | Actual |
|--------|----------|----------|--------|
| **MQL5** | 88% (7,480/8,531) | 97% (8,316/8,531) | 95% (8,092/8,531) |
| **Forex Factory** | 59% (5,442/9,269) | 71% (6,600/9,269) | 68% (6,274/9,269) |
| **FXStreet** | 35% (17/48) | 92% (44/48) | 4% (2/48) |

**🏆 MQL5 has the most complete data for forecast/previous/actual values**

---

## 💡 Key Insights

### ✅ Strengths by Source

**MQL5:**
- ✅ Best overall data quality
- ✅ Only source with event categories (enables Event Type filtering)
- ✅ Highest forecast/previous/actual coverage
- ✅ Good forward-looking data (9 days ahead)
- ✅ Longest total span (24 months)
- 🏆 **Recommended as default source**

**Forex Factory:**
- ✅ Most events (9,269 total)
- ✅ Excellent historical coverage (23 months back)
- ⚠️ No category data (Event Type filter won't work)
- ⚠️ Lower data completeness (59% forecast, 71% previous, 68% actual)
- ❌ No forward-looking data

**FXStreet:**
- ❌ **Minimal coverage** (only 48 events, 2 days total)
- ❌ No historical data
- ❌ No future data beyond 1 day
- ❌ No category data
- ❌ Very low actual data (4%)
- ⚠️ **Not suitable for production use** (appears to be a recent/live feed only)

### ⚠️ Limitations Identified

1. **Event Type Filtering Limited:**
   - Only works with MQL5 source (has categories)
   - Forex Factory and FXStreet return 0 results when filtering by event type

2. **Forward-Looking Data Gap:**
   - All sources have limited future event data
   - Maximum is 9 days (MQL5)
   - May require daily syncs for up-to-date future events

3. **FXStreet Insufficient:**
   - Only 48 events across 2 days
   - Appears to be a "today + tomorrow" feed
   - Not suitable for historical analysis or date range queries

---

## 🔧 Multi-Source Implementation Status

### ✅ Correctly Implemented Files:

1. **`economicEventsService.js`**
   - ✅ Queries correct subcollection: `/economicEvents/{source}/events`
   - ✅ Passes `source` parameter to Firestore queries
   - ✅ Field normalization (lowercase + PascalCase support)
   - ✅ Enhanced filter logging

2. **`EconomicEvents.jsx`**
   - ✅ Uses `newsSource` from Settings context
   - ✅ Passes `source` to `getEventsByDateRange()`
   - ✅ Refetches when `newsSource` changes
   - ✅ Multi-source sync modal

3. **`EventsFilters2.jsx`**
   - ✅ Receives `newsSource` prop
   - ✅ Passes `newsSource` to `getEventCategories()` and `getEventCurrencies()`
   - ✅ Refetches filter options when source changes

4. **`ExportEvents.jsx`**
   - ✅ Exports all 3 sources separately
   - ✅ Correct collection paths
   - ✅ Successfully exports 8,531 (mql5), 9,269 (forex-factory), 48 (fxstreet) events

5. **`syncEconomicEvents.ts` (Cloud Functions)**
   - ✅ Multi-source sync support
   - ✅ Correct Firestore structure: `/economicEvents/{source}/events/{docId}`
   - ✅ API endpoint mapping per source

6. **`firestoreHelpers.js`**
   - ✅ `getEconomicEventsCollectionRef(source)` - returns correct subcollection reference
   - ✅ Used consistently across service layer

### ⚠️ Files Needing Attention:

1. **`eventsCache.js`**
   - ⚠️ **Caching disabled** - TODO comment indicates multi-source migration in progress
   - ⚠️ `fetchAndCacheAllEvents()` returns empty array
   - ⚠️ Not querying new structure
   - **Action:** Update caching logic to support multi-source or keep disabled

2. **`EventsTimeline.jsx` (Old Component)**
   - ⚠️ Appears to be legacy component (EventsTimeline2.jsx is newer)
   - ⚠️ No multi-source awareness
   - **Action:** Verify if still in use, remove if replaced by EventsTimeline2

3. **`EventsFilters.jsx` (Old Component)**
   - ⚠️ Legacy component (EventsFilters2.jsx is newer)
   - ⚠️ No multi-source parameter
   - **Action:** Verify if still in use, remove if replaced by EventsFilters2

4. **`kb/kb.md` (Documentation)**
   - ⚠️ Shows old query example using `economicEventsCalendar` collection
   - **Action:** Update documentation with multi-source examples

---

## 📋 Recommendations

### Immediate Actions:

1. **Set MQL5 as Default Source**
   - Already implemented: `DEFAULT_NEWS_SOURCE = 'mql5'`
   - ✅ Best data quality and only source with categories

2. **Disable Event Type Filter for Non-MQL5 Sources**
   - ✅ Already handled: `eventTypes` filter returns 0 results for Forex Factory/FXStreet
   - Consider adding UI warning when Event Type filter is used with non-MQL5 sources

3. **Consider Removing FXStreet**
   - Only 48 events (2 days coverage) - not production-ready
   - Or clarify it's for "live/today" events only

4. **Update Caching Strategy**
   - Decide if caching should be:
     - Per-source (cache each source separately)
     - Single source (cache user's preferred source only)
     - No caching (rely on Firestore directly)

### Future Enhancements:

1. **Hybrid Source Strategy**
   - Use MQL5 for historical analysis (categories, complete data)
   - Use Forex Factory for broader event coverage
   - Use FXStreet for live/breaking events (if coverage improves)

2. **Source-Specific UI Indicators**
   - Show which features are available per source
   - Disable Event Type filter when Forex Factory/FXStreet selected
   - Show data completeness metrics

3. **Automated Daily Syncs**
   - Schedule daily syncs to maintain forward-looking data
   - Prioritize MQL5 (most reliable forward data - 9 days)

---

## 🧪 Testing Checklist

### Multi-Source Functionality:

- [x] ✅ Export works for all 3 sources
- [x] ✅ MQL5 data loads correctly
- [x] ✅ Forex Factory data loads correctly
- [x] ✅ FXStreet data loads correctly
- [ ] ⏳ Currency filters work with all sources
- [ ] ⏳ Impact filters work with all sources
- [ ] ⏳ Event Type filter works with MQL5 (and correctly returns 0 for others)
- [ ] ⏳ Date range queries work across all sources
- [ ] ⏳ Pagination works with multi-source data
- [ ] ⏳ Source switching in Settings triggers correct refetch

### Field Normalization:

- [x] ✅ Service layer provides both lowercase and PascalCase
- [x] ✅ EventsTimeline2 supports both field name cases
- [ ] ⏳ All filters apply correctly with normalized fields
- [ ] ⏳ Console logging shows filter effectiveness

---

## 📊 Data Quality Score

| Source | Coverage | Completeness | Forward Data | Categories | **Overall** |
|--------|----------|--------------|--------------|------------|-------------|
| **MQL5** | ⭐⭐⭐⭐⭐ (24 months) | ⭐⭐⭐⭐⭐ (88-97%) | ⭐⭐⭐⭐ (9 days) | ⭐⭐⭐⭐⭐ (12) | **⭐⭐⭐⭐⭐** |
| **Forex Factory** | ⭐⭐⭐⭐⭐ (23 months) | ⭐⭐⭐ (59-71%) | ⭐ (0 days) | ⭐ (0) | **⭐⭐⭐** |
| **FXStreet** | ⭐ (2 days) | ⭐⭐ (35-92%) | ⭐ (1 day) | ⭐ (0) | **⭐** |

**🏆 MQL5 is the clear winner for production use**

---

**Analysis Complete** ✅  
*Files exported to: `d:\Lofi Trades\trading-clock\data\`*
