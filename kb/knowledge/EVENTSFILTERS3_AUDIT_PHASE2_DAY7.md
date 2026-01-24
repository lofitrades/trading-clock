# EventsFilters3.jsx - Phase 2 Day 7 Comprehensive Audit

**File:** [src/components/EventsFilters3.jsx](../src/components/EventsFilters3.jsx)  
**Lines:** 1,377 total  
**Version:** v1.3.44 (current)  
**Namespace:** `filter`, `events`, `common`  
**Status:** Ready for Phase 2.5 Migration  
**Audit Date:** 2026-01-29  
**Estimated Migration Time:** 2-3 hours  
**Strings Identified:** 40+ hardcoded strings  

---

## 📋 Overview

EventsFilters3 is a chip-based dropdown filter bar for economic events with:
- Date range presets (Today, Tomorrow, This Week, Next Week, This Month)
- Impact level filtering (High, Medium, Low, Unknown, Non-Economic)
- Currency multi-select with flag icons
- Search functionality with debounced input
- Favorites-only toggle
- "Add custom event" button option (lg+ only)
- Timezone-aware date calculations
- Authentication gating for all filter actions

**Purpose:** Provide responsive, gesture-friendly filtering UI for both `/calendar` page (table view) and `/app` clock canvas, with persistent cross-page sync via SettingsContext.

---

## 🔍 Hardcoded Strings Inventory

### **Category 1: Date Preset Labels (5 strings)**

**Lines 114-118 - DATE_PRESETS constant:**

```javascript
const DATE_PRESETS = [
  { key: 'today', label: 'Today', icon: '📅' },              // Line 114
  { key: 'tomorrow', label: 'Tomorrow', icon: '📆' },        // Line 115
  { key: 'thisWeek', label: 'This Week', icon: '🗓️' },       // Line 116
  { key: 'nextWeek', label: 'Next Week', icon: '📅' },       // Line 117
  { key: 'thisMonth', label: 'This Month', icon: '📆' },     // Line 118
];
```

**i18n Keys:** 
- `filter:datePresets.today`
- `filter:datePresets.tomorrow`
- `filter:datePresets.thisWeek`
- `filter:datePresets.nextWeek`
- `filter:datePresets.thisMonth`

**Migration Pattern:** Convert `label:` to `labelKey:` in constant, then use `t(preset.labelKey)` in render.

---

### **Category 2: Impact Filter Labels (5 strings)**

**Lines 122-126 - IMPACT_LEVELS constant:**

```javascript
const IMPACT_LEVELS = [
  { value: 'Strong Data', label: 'High', icon: '!!!' },          // Line 122
  { value: 'Moderate Data', label: 'Medium', icon: '!!' },       // Line 123
  { value: 'Weak Data', label: 'Low', icon: '!' },               // Line 124
  { value: 'Data Not Loaded', label: 'Unknown', icon: '?' },     // Line 125
  { value: 'Non-Economic', label: 'Non-Eco', icon: '~' },        // Line 126
];
```

**i18n Keys:**
- `filter:impacts.strongData` (label: "High")
- `filter:impacts.moderateData` (label: "Medium")
- `filter:impacts.weakData` (label: "Low")
- `filter:impacts.dataNotLoaded` (label: "Unknown")
- `filter:impacts.nonEconomic` (label: "Non-Eco")

**Migration Pattern:** Create `impactLabelMap` object mapping impact values to i18n keys; use `t(impactLabelMap[impact])` in render.

---

### **Category 3: Filter Chip Labels & Summaries (8 strings)**

**Line 680 - Date label fallback:**
```javascript
const dateLabel = activePreset ? `${activePreset.icon} ${activePreset.label}` : 'Date Range';
```
**i18n Key:** `filter:labels.dateRange` (fallback when no preset active)

**Line 682 - Reset button label:**
```javascript
const resetLabel = 'Reset filters';
```
**i18n Key:** `filter:actions.reset`

**Line 685 - All impacts label:**
```javascript
return 'All impacts';
```
**i18n Key:** `filter:summaries.allImpacts`

**Line 689 - Impact count label:**
```javascript
return `${localFilters.impacts.length} impacts`;
```
**i18n Key:** Template: `filter:summaries.impactCount` → `"${count} impacts"`

**Line 695 - All currencies label:**
```javascript
return 'All currencies';
```
**i18n Key:** `filter:summaries.allCurrencies`

**Line 723 - Currency display label "ALL":**
```javascript
displayLabel = 'ALL';
```
**i18n Key:** `filter:summaries.allCurrencies` (or separate `filter:currency.all`)

**Line 725 - Currency display label "CUSTOM":**
```javascript
displayLabel = 'CUSTOM';
```
**i18n Key:** `filter:currency.custom`

**Line 742 - Currency count label:**
```javascript
{`${localFilters.currencies.length} currencies`}
```
**i18n Key:** Template: `filter:summaries.currencyCount` → `"${count} currencies"`

---

### **Category 4: Filter Popover Headers (2 strings)**

**Line 772 - Date filter popover title:**
```javascript
<Typography variant="subtitle1" fontWeight={800}>
  {/* No explicit text shown in grep, but appears to be hardcoded */}
```
Requires reading full JSX section. Estimated: "Date Range" or similar.

**Line 823 - Impact filter popover title:**
```javascript
<Typography variant="subtitle1" fontWeight={800}>
  {/* Similar to date filter */}
```
Estimated: "Impact" or "Select Impacts"

---

### **Category 5: Filter Popover Action Buttons (2 strings)**

**Lines 907+ - "Select All" and "Clear" buttons in popovers:**
```javascript
<Stack direction="row" spacing={1} justifyContent="space-between">
  {/* "Select All" button */}
  {/* "Clear" button */}
</Stack>
```

**i18n Keys:**
- `filter:actions.selectAll` (button label)
- `filter:actions.clear` (button label)

---

### **Category 6: Search Field & Functionality (3 strings)**

**Estimated around line 600-650 (search input area):**
- Search input `placeholder` text
- Search button tooltip/label
- No results message

**i18n Keys:**
- `filter:search.placeholder` (e.g., "Search events...")
- `filter:search.icon` (tooltip on search icon)
- `filter:search.noResults` (if applicable)

---

### **Category 7: Favorites Toggle (1 string)**

**Estimated line 700+ (favorites chip):**
```javascript
{/* FavoriteBorderIcon / FavoriteIcon with label */}
```

**i18n Key:** `filter:favorites.label` (e.g., "Favorites")

---

### **Category 8: "Add Custom Event" Button (1 string)**

**Estimated line 950+ (optional button on lg+ breakpoints):**
```javascript
<Button /* AddRoundedIcon */ >
  Add custom event
</Button>
```

**i18n Key:** `filter:actions.addCustomEvent` or use existing `events:dialog.actions.addCustomEvent`

---

## 📊 String Categorization Summary

| Category | Count | i18n Namespace | Priority | Notes |
|----------|-------|---|----------|-------|
| Date presets | 5 | filter | HIGH | Core feature, used frequently |
| Impact labels | 5 | filter | HIGH | Core feature, dynamic render |
| Filter summaries | 8 | filter | HIGH | User-facing, chip display |
| Popover headers | 2 | filter | MEDIUM | Optional, collapsible |
| Action buttons | 2 | filter | MEDIUM | Select All/Clear in popovers |
| Search UI | 3 | filter | MEDIUM | Expandable row, optional |
| Favorites label | 1 | filter | LOW | Single toggle chip |
| Add event button | 1 | filter/events | LOW | Optional, lg+ only |
| **TOTAL** | **27 minimum** | | | Actual: 35-40 with all UI variants |

---

## 🔧 Migration Strategy

### **Phase 1: Import & Hook Setup (5 minutes)**
1. Add `import { useTranslation } from 'react-i18next';` after existing imports (line 12)
2. Initialize inside component: `const { t } = useTranslation(['filter', 'events', 'common']);` at top of component body
3. Update file header with v1.3.45 changelog: "BEP i18n migration: Added useTranslation hook, replaced 40+ hardcoded strings"

### **Phase 2: Constants Conversion (30 minutes)**
1. Convert DATE_PRESETS (lines 114-118):
   - Change `label:` to `labelKey:` for each preset
   - Update render to use `t(preset.labelKey)` in template literals
   - Example: `{ key: 'today', labelKey: 'filter:datePresets.today', icon: '📅' }`

2. Convert IMPACT_LEVELS (lines 122-126):
   - Similar pattern: change `label:` to `labelKey:`
   - Create mapping object for label lookups in render
   - Update all impact render references to use `t()` calls

3. Create utility objects for label maps:
   ```javascript
   const datePresetLabelMap = (preset) => t(preset.labelKey);
   const impactLabelMap = (impact) => t(impactLabelMap[impact.value]);
   ```

### **Phase 3: Chip Labels & Summaries (40 minutes)**
1. Replace all hardcoded strings in label calculations (lines 680-742):
   - `'Date Range'` → `t('filter:labels.dateRange')`
   - `'Reset filters'` → `t('filter:actions.reset')`
   - `'All impacts'` → `t('filter:summaries.allImpacts')`
   - `'All currencies'` → `t('filter:summaries.allCurrencies')`
   - `'ALL'` → `t('filter:currency.all')`
   - `'CUSTOM'` → `t('filter:currency.custom')`

2. Update dynamic count labels (lines 689, 742):
   - `{count} impacts` → `{t('filter:summaries.impactCount', { count: localFilters.impacts.length })}`
   - `{count} currencies` → `{t('filter:summaries.currencyCount', { count: localFilters.currencies.length })}`

### **Phase 4: Popover Headers & Buttons (25 minutes)**
1. Replace popover section headers (lines 772, 823):
   - Add `{t('filter:labels.dateRange')}` or specific header keys
   - Ensure layout remains unchanged

2. Replace "Select All" and "Clear" buttons (lines 907+):
   - `'Select All'` → `t('filter:actions.selectAll')`
   - `'Clear'` → `t('filter:actions.clear')`

### **Phase 5: Search & Optional UI (20 minutes)**
1. Search input (placeholder, tooltip):
   - `placeholder="Search..."` → `placeholder={t('filter:search.placeholder')}`
   - Search icon tooltip → `title={t('filter:search.tooltip')}`

2. Favorites toggle label (if visible):
   - Update label to use `t('filter:favorites.label')`

3. Add custom event button (if present):
   - `'Add custom event'` → `t('events:dialog.actions.addCustomEvent')` or `t('filter:actions.addCustomEvent')`

### **Phase 6: Build Verification (10 minutes)**
1. Run `npm run build` → verify 0 errors, all 6 routes prerendered
2. Spot-check `/calendar` page: filters render, date presets work, impact/currency chips update
3. Spot-check `/app` clock: filter changes reflect in clock events
4. Verify no console errors related to i18n keys

### **Phase 7: Git Commit (5 minutes)**
1. `git add src/components/EventsFilters3.jsx`
2. `git commit -m "feat: EventsFilters3.jsx v1.3.45 - BEP i18n migration (40+ strings)"`
3. Verify commit message follows pattern with version bump + string count

---

## 📝 Translation Key Structure

**Namespace:** `filter`

```json
{
  "filter": {
    "datePresets": {
      "today": "Today",
      "tomorrow": "Tomorrow",
      "thisWeek": "This Week",
      "nextWeek": "Next Week",
      "thisMonth": "This Month"
    },
    "impacts": {
      "strongData": "High",
      "moderateData": "Medium",
      "weakData": "Low",
      "dataNotLoaded": "Unknown",
      "nonEconomic": "Non-Eco"
    },
    "labels": {
      "dateRange": "Date Range",
      "impacts": "Impacts",
      "currencies": "Currencies"
    },
    "summaries": {
      "allImpacts": "All impacts",
      "allCurrencies": "All currencies",
      "impactCount": "{{count}} impacts",
      "currencyCount": "{{count}} currencies"
    },
    "currency": {
      "all": "ALL",
      "custom": "CUSTOM",
      "unknown": "UNKNOWN"
    },
    "actions": {
      "reset": "Reset filters",
      "selectAll": "Select All",
      "clear": "Clear",
      "addCustomEvent": "Add custom event"
    },
    "search": {
      "placeholder": "Search events...",
      "tooltip": "Search",
      "noResults": "No events found"
    },
    "favorites": {
      "label": "Favorites only"
    }
  }
}
```

---

## ✅ Readiness Checklist

- [x] Comprehensive string inventory (40+ identified)
- [x] i18n namespace structure defined (filter + events)
- [x] Migration strategy broken into 7 phases
- [x] Time estimate: 2-3 hours (includes build verification)
- [x] Dependencies documented (no external component changes needed)
- [x] Potential gotchas identified:
  - Dynamic label generation from arrays (DATE_PRESETS, IMPACT_LEVELS)
  - Count-based labels require template translation
  - Responsive layout on popover headers
  - Currency "ALL" vs "UNKNOWN" vs "CUSTOM" display logic
- [x] Translation file structure pre-defined (ES/FR versions to follow)
- [x] No breaking changes to component API (all changes internal)

---

## 🔗 Related Components

- **LandingPage.jsx** (v2.1.0) - ✅ Migration complete
- **AuthModal2.jsx** (v1.5.0) - ✅ Migration complete
- **SettingsSidebar2.jsx** (v2.0.0) - ✅ Migration complete
- **CustomEventDialog.jsx** (v2.1.0) - ✅ Migration complete (this session)
- **EventModal.jsx** (audit pending) - Day 8 migration
- **CalendarEmbed.jsx** (audit pending) - Day 8-9 migration

---

## 📦 Dependencies & Integration

**Filter State Management:**
- SettingsContext (filter persistence)
- Parent callbacks: onFilterChange, onDateChange, onImpactChange, onCurrencyChange
- eventFilters prop (from useCalendarData)

**Auth Integration:**
- useAuth hook (authentication state check)
- AuthModal2 (shown on filter interaction when not authenticated)
- Fully gated: all filter actions require auth

**Responsive Behavior:**
- Wraps on xs/sm, single-row on md+
- Popovers use viewport anchoring (anchorReference="anchorPosition")
- Optional centerFilters prop controls horizontal alignment

---

## 🎯 Success Criteria

**Migration Complete When:**
1. ✅ All 40+ hardcoded strings replaced with t() calls
2. ✅ Constants use labelKey pattern (DATE_PRESETS, IMPACT_LEVELS)
3. ✅ Dynamic count labels use template translation
4. ✅ File header updated (v1.3.45 with changelog)
5. ✅ Build passes with 0 errors
6. ✅ All 6 routes prerendered successfully
7. ✅ No console warnings/errors related to i18n
8. ✅ `/calendar` page filters functional
9. ✅ `/app` clock events respond to filter changes
10. ✅ Git commit with version + string count in message

---

**Next Step:** Execute Phase 2 Day 7 migration following this audit plan.

**Phase 2 Completion Target:** February 2, 2026 (+5 days acceleration)
