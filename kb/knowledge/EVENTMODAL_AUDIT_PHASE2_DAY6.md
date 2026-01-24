/**
 * kb/knowledge/EVENTMODAL_AUDIT_PHASE2_DAY6.md
 * 
 * Audit Report: EventModal.jsx i18n String Extraction
 * Date: January 29, 2026 (Phase 2, Day 6)
 * Component: src/components/EventModal.jsx
 * Lines: 2,869 (Large enterprise component)
 * Hardcoded Strings Identified: 35+ across 5 sections
 * 
 * Purpose: Comprehensive audit for i18n migration readiness
 * Status: Ready for Phase 2.5 component migration
 */

# EventModal.jsx i18n Audit Report

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Component File** | src/components/EventModal.jsx |
| **Total Lines** | 2,869 |
| **Audit Date** | January 29, 2026 |
| **Hardcoded Strings** | 35+ (Low priority: 6 impact labels, 29 field labels & messages) |
| **Estimated Migration Time** | 2-3 hours |
| **Namespace** | `events` (primary), `common` (secondary) |
| **Languages Required** | EN, ES, FR |
| **Build Impact** | Low (impacts modal UI rendering) |
| **Testing Scope** | Event modal display, impact badges, reminders section, custom event section |
| **Status** | ✅ Ready for Phase 2.5 migration |

---

## 🎯 Purpose & Scope

**EventModal.jsx** displays comprehensive economic event details in an enterprise-grade modal. The component handles:
- Economic event metadata (date, time, impact, currency)
- Event data values (actual, forecast, previous)
- Event descriptions and trading implications
- Key thresholds and frequency information
- Custom event support with icon, color, timezone, reminders, visibility
- Reminders management with scoping (event-specific vs series-wide)
- Favorite and notes functionality
- Full-screen on mobile, dialog on desktop

**Hardcoded strings** appear in:
1. **Impact badges** (6 labels + descriptions) - HIGH priority for trading context
2. **Section headers** (field names like "Notes", "Timezone", "Appearance", "Visibility", "Reminders")
3. **Data labels** (column headers: "Actual", "Forecast", "Previous")
4. **Action tooltips** (button descriptions)
5. **Alert messages** (reminder loading, sign-in prompts, error states)
6. **Chip labels** (visibility status, custom event type badge)

---

## 🔍 Detailed String Inventory

### 1. Impact Configuration Labels (6 strings - CRITICAL FOR TRADING CONTEXT)

**File Location:** Lines 170-198 (IMPACT_CONFIG object)
**Namespace:** `events:impact.*`
**Priority:** HIGH (User-facing trading terminology)

| Line | Hardcoded String | Key Path | Context | Current Value |
|------|-----------------|----------|---------|---------------|
| 173 | `'High Impact'` | `events:impact.strong.label` | Impact badge for strong/high impact events | icon: '!!!' |
| 174 | `'Major market-moving event that typically causes significant volatility and price action'` | `events:impact.strong.description` | Tooltip description for high impact | Trading context |
| 178 | `'Medium Impact'` | `events:impact.moderate.label` | Impact badge for moderate impact events | icon: '!!' |
| 179 | `'Notable event that can influence market direction with moderate price movements'` | `events:impact.moderate.description` | Tooltip description for medium impact | Trading context |
| 183 | `'Low Impact'` | `events:impact.weak.label` | Impact badge for low impact events | icon: '!' |
| 184 | `'Minor event with limited market impact and minimal expected volatility'` | `events:impact.weak.description` | Tooltip description for low impact | Trading context |
| 188 | `'Data Not Loaded'` | `events:impact.notLoaded.label` | Impact badge when data loading | icon: '?' |
| 189 | `'Impact data not yet available; will update when feed loads'` | `events:impact.notLoaded.description` | Tooltip for loading state | System message |
| 193 | `'Non-Economic'` | `events:impact.nonEconomic.label` | Impact badge for non-economic events | icon: '~' |
| 194 | `'Non-economic event or announcement with indirect market influence'` | `events:impact.nonEconomic.description` | Tooltip description | System message |
| 198 | `'Unknown'` | `events:impact.unknown.label` | Impact badge for unknown impact | icon: '?' |
| 199 | `'Impact level not yet classified or unavailable'` | `events:impact.unknown.description` | Tooltip description | System message |

**Current Code (Lines 170-198):**
```javascript
const IMPACT_CONFIG = {
  strong: {
    icon: '!!!',
    label: 'High Impact',
    description: 'Major market-moving event that typically causes significant volatility and price action'
  },
  moderate: {
    icon: '!!',
    label: 'Medium Impact',
    description: 'Notable event that can influence market direction with moderate price movements'
  },
  weak: {
    icon: '!',
    label: 'Low Impact',
    description: 'Minor event with limited market impact and minimal expected volatility'
  },
  'not-loaded': {
    icon: '?',
    label: 'Data Not Loaded',
    description: 'Impact data not yet available; will update when feed loads'
  },
  'non-economic': {
    icon: '~',
    label: 'Non-Economic',
    description: 'Non-economic event or announcement with indirect market influence'
  },
  unknown: {
    icon: '?',
    label: 'Unknown',
    description: 'Impact level not yet classified or unavailable'
  },
};
```

---

### 2. Section Headers & Field Labels (12 strings)

**File Location:** Lines 1500-1620 (CardContent sections)
**Namespace:** `events:modal.custom.*` or `events:modal.economic.*`
**Priority:** MEDIUM (UI section organization)

| Line | Hardcoded String | Key Path | Context |
|------|-----------------|----------|---------|
| 1516 | `'Appearance'` | `events:modal.custom.appearance.title` | Custom event appearance section header |
| 1567 | `'Icon'` | `events:modal.custom.appearance.icon.label` | Custom event icon display label |
| 1587 | `'Color'` | `events:modal.custom.appearance.color.label` | Custom event color display label |
| 1605 | `'Notes'` | `events:modal.custom.details.notes.title` | Custom event notes section header |
| 1614 | `'Timezone'` | `events:modal.custom.details.timezone.title` | Custom event timezone section header |
| 1623 | `'Visibility'` | `events:modal.custom.details.visibility.title` | Custom event visibility section header |
| 1626 | `'Visible on clock'` | `events:modal.custom.details.visibility.visible` | Chip label for visible status |
| 1626 | `'Hidden from clock'` | `events:modal.custom.details.visibility.hidden` | Chip label for hidden status |
| 1631 | `'Reminders'` | `events:modal.custom.details.reminders.title` | Custom event reminders section header |
| 1637 | `'Sign in to save reminders across devices.'` | `events:modal.custom.details.reminders.signInPrompt` | Alert message when not authenticated |
| 1642 | `'Reminder details are still loading. Reopen this event if Save stays disabled.'` | `events:modal.custom.details.reminders.loadingPrompt` | Alert message during reminder load |
| 1652 | `'Reminder Debug'` | `events:modal.debug.reminders.title` | Debug panel header (optional - can skip) |

---

### 3. Data Value Column Headers (4 strings)

**File Location:** Dynamically generated from event data structure (lines 1700+)
**Namespace:** `events:modal.economic.values.*`
**Priority:** MEDIUM (Column organization)

| String | Key Path | Context |
|--------|----------|---------|
| `'Forecast'` | `events:modal.economic.values.forecast.label` | Column header for forecast values |
| `'Actual'` | `events:modal.economic.values.actual.label` | Column header for actual values |
| `'Previous'` | `events:modal.economic.values.previous.label` | Column header for previous values |
| `'Revised'` | `events:modal.economic.values.revised.label` | Column header for revised values |

---

### 4. Action Button Tooltips (5 strings)

**File Location:** Lines 1340-1410 (Header action buttons)
**Namespace:** `events:modal.actions.*`
**Priority:** MEDIUM (Accessibility/UX)

| Line | Hardcoded String | Key Path | Context |
|------|-----------------|----------|---------|
| 1342 | `'Loading notes...'` | `events:modal.actions.notes.loading` | Notes button tooltip while loading |
| 1343 | `'View notes'` | `events:modal.actions.notes.view` | Notes button tooltip when notes exist |
| 1343 | `'Add note'` | `events:modal.actions.notes.add` | Notes button tooltip when no notes exist |
| 1369 | `'Loading favorites...'` | `events:modal.actions.favorite.loading` | Favorite button tooltip while loading |
| 1369 | `'Remove from favorites'` | `events:modal.actions.favorite.remove` | Favorite button tooltip when favorited |
| 1369 | `'Save to favorites'` | `events:modal.actions.favorite.save` | Favorite button tooltip when not favorited |
| 1405 | `'Edit reminder'` | `events:modal.actions.edit.custom` | Edit button tooltip for custom events |

---

### 5. Economic Event Section Headers (6 strings)

**File Location:** Lines 1700+ (CardContent for economic events)
**Namespace:** `events:modal.economic.*`
**Priority:** MEDIUM (UI organization for economic event view)

| String | Key Path | Context | Component |
|--------|----------|---------|-----------|
| `'Metadata'` | `events:modal.economic.metadata.title` | Section header for impact/currency/category | Card header |
| `'Event Data'` | `events:modal.economic.data.title` | Section header for data values | Card header |
| `'Key Information'` | `events:modal.economic.keyInfo.title` | Section header for thresholds/frequency | Card header |
| `'Description'` | `events:modal.economic.description.title` | Section header for event description | Card header |
| `'Trading Implications'` | `events:modal.economic.implications.title` | Section header for market impact | Card header |
| `'Refresh Data'` | `events:modal.economic.refresh.button` | Refresh button label | Action button |

---

## 📋 Migration Strategy

### Phase 2.5 Day 6 Plan

**Step 1: Update Translation Files (1 hour)**
- Merge new keys into `src/i18n/locales/en/events.json`
- Add all 35+ strings under `events:impact.*`, `events:modal.custom.*`, `events:modal.economic.*`, `events:modal.actions.*` namespaces
- Generate EN/ES/FR versions using Python merge script

**Step 2: Component Migration (2-3 hours)**
- Import `useTranslation` hook at top
- Initialize hook inside component: `const { t } = useTranslation(['events', 'common']);`
- Replace IMPACT_CONFIG labels with dynamic i18n keys
- Replace section headers with `t()` calls
- Replace button tooltips with `t()` calls
- Replace alert messages with `t()` calls

**Step 3: Verification (30 min)**
- Test EN/ES/FR rendering in modal
- Verify impact badges display correctly
- Check reminders section renders in all languages
- Build verify: `npm run build`
- Git commit with v2.2.0 version bump

### BEP Pattern (From SettingsSidebar2 v2.0.0)

```javascript
// At top of component
import { useTranslation } from 'react-i18next';

// Inside component render
export default function EventModal({ ... }) {
  const { t } = useTranslation(['events', 'common']);
  
  // Use t() for all hardcoded strings
  const impactLabel = t(`events:impact.${impact}.label`);
  
  return (
    <Typography>{t('events:modal.custom.appearance.title')}</Typography>
  );
}
```

---

## ✅ Readiness Checklist

- [x] File analyzed for hardcoded strings
- [x] 35+ strings identified and categorized
- [x] Namespace structure defined (events, common)
- [x] Key paths documented
- [x] Translation requirements identified (EN/ES/FR)
- [x] Migration strategy outlined
- [x] BEP pattern confirmed (SettingsSidebar2 v2.0.0)
- [ ] Translation files updated (next step)
- [ ] Component migration completed (Phase 2.5)
- [ ] Build verification passed (Phase 2.5)

---

## 📊 Impact Assessment

| Category | Assessment |
|----------|-----------|
| **Complexity** | Medium (35+ strings, straightforward replacements) |
| **Risk Level** | Low (UI rendering only, no logic changes) |
| **Testing Required** | Modal rendering, all 3 languages, impact badges |
| **Breaking Changes** | None (backward compatible with i18next fallback) |
| **Performance Impact** | Negligible (no additional API calls) |
| **Accessibility Impact** | Positive (enables language switching for screen readers) |

---

## 🔗 Dependencies

- **i18next:** v21+ (already installed)
- **react-i18next:** v11+ (already installed)
- **Translation Files:** src/i18n/locales/{en,es,fr}/events.json
- **Related Audit:** CustomEventDialog (same events namespace)

---

## 📝 Notes for Phase 2.5 Migration

1. **Impact Config Patterns:** The IMPACT_CONFIG object uses direct object properties. Consider moving to namespace structure `t(`events:impact.${key}.label`)` inside component render.

2. **Alert Messages:** Sign-in and loading prompts should maintain current error-level severity. Translations should preserve urgency level.

3. **Debug Panel:** The "Reminder Debug" section (optional diagnostic) can be i18n'd or left as-is. Recommend leaving as dev-only for now.

4. **Section Headers:** Economic event sections (Metadata, Event Data, etc.) should use consistent `events:modal.economic.*` namespace for parallel structure with custom event sections.

5. **Button Tooltips:** All tooltips use MuiTooltip title prop. Ensure `t()` calls execute during render, not in static constants.

6. **Testing Strategy:**
   - Change language to ES/FR
   - Open event modal
   - Verify all labels, headers, tooltips display correctly
   - Check impact badges render with correct labels
   - Test custom event section fully renders
   - Test economic event section fully renders
   - Verify reminders section displays proper language

---

## 🚀 Next Steps (Phase 2.5)

1. **Merge new keys into events.json** (Python script)
2. **Migrate EventModal.jsx component** (Manual replacements following BEP)
3. **Build verify** (npm run build)
4. **Git commit** (descriptive message with string count)
5. **Proceed to CalendarEmbed.jsx audit** (parallel with migration if needed)

---

**Status:** ✅ Audit Complete - Ready for Phase 2.5  
**Version:** 1.0.0  
**Last Updated:** January 29, 2026
