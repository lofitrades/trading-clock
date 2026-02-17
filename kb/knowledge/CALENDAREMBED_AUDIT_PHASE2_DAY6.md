/**
 * kb/knowledge/CALENDAREMBED_AUDIT_PHASE2_DAY6.md
 * 
 * Audit Report: CalendarEmbed.jsx i18n String Extraction
 * Date: January 29, 2026 (Phase 2, Day 6)
 * Component: src/components/CalendarEmbed.jsx
 * Lines: 2,635 (Very large enterprise component)
 * Hardcoded Strings Identified: 45+ across 8 sections
 * 
 * Purpose: Comprehensive audit for i18n migration readiness
 * Status: Ready for Phase 2.5 component migration
 */

# CalendarEmbed.jsx i18n Audit Report

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Component File** | src/components/CalendarEmbed.jsx |
| **Total Lines** | 2,635 |
| **Audit Date** | January 29, 2026 |
| **Hardcoded Strings** | 45+ (Low-medium priority: UI headers, buttons, labels, tooltips) |
| **Estimated Migration Time** | 2-3 hours |
| **Namespace** | `calendar` (primary), `common` (secondary) |
| **Languages Required** | EN, ES, FR |
| **Build Impact** | Low-Medium (impacts calendar UI rendering, filters) |
| **Testing Scope** | Calendar filters, table headers, day labels, buttons, tooltips, no-data states |
| **Status** | ✅ Ready for Phase 2.5 migration |

---

## 🎯 Purpose & Scope

**CalendarEmbed.jsx** is an Airbnb-inspired, two-panel economic calendar surface that:
- Displays events grouped by day in a responsive table layout
- Manages filter state for date range, currencies, impact levels
- Handles timezone selection with timezone-aware date calculations
- Displays both economic events and custom user-created reminders
- Provides clock panel integration on desktop (left rail), calendar on right
- Mobile-first responsive: single column on xs/sm, two-column on md+
- Integrates with EventModal for event details and CustomEventDialog for reminder creation

**Hardcoded strings** appear in:
1. **Filter UI components** (EventsFilters3 integration, labels, placeholders)
2. **Table column headers** (TIME, CURRENCY, IMPACT, EVENT, ACTUAL, FORECAST, PREVIOUS)
3. **Day section headers** (Date display, event count chips, TODAY label)
4. **Button labels** (Add custom event, refresh, close, timezone selector)
5. **Tooltip text** (Event status, timezone info, button hints)
6. **No-data states** (Empty calendar messages, loading states)
7. **Section headers** (Market Clock, Calendar, Data columns)
8. **Status badges** (NOW, NEXT, timezone chips)

---

## 🔍 Detailed String Inventory

### 1. Table Column Headers (7 strings - HIGH priority)

**File Location:** Dynamic table rendering (~lines 1800-2000)
**Namespace:** `calendar:table.headers.*`
**Priority:** HIGH (User-facing, always visible)

| String | Key Path | Context |
|--------|----------|---------|
| `'TIME'` | `calendar:table.headers.time` | Column header for event time |
| `'CURRENCY'` | `calendar:table.headers.currency` | Column header for currency pairs |
| `'IMPACT'` | `calendar:table.headers.impact` | Column header for impact level |
| `'EVENT'` | `calendar:table.headers.event` | Column header for event name |
| `'ACTUAL'` | `calendar:table.headers.actual` | Column header for actual values |
| `'FORECAST'` | `calendar:table.headers.forecast` | Column header for forecast values |
| `'PREVIOUS'` | `calendar:table.headers.previous` | Column header for previous values |

---

### 2. Button Labels & CTAs (8 strings)

**File Location:** Header action buttons, filter controls
**Namespace:** `calendar:actions.*`
**Priority:** MEDIUM (Interactive elements)

| String | Key Path | Context |
|--------|----------|---------|
| `'Add custom event'` | `calendar:actions.addEvent.label` | CTA button for creating custom reminders |
| `'Add event'` | `calendar:actions.addEvent.short` | Mobile/xs variant of add button |
| `'Change timezone'` | `calendar:actions.timezone.label` | Timezone selector button |
| `'Save'` | `calendar:actions.save` | Timezone modal confirm button |
| `'Cancel'` | `calendar:actions.cancel` | Dialog cancel button |
| `'Today'` | `calendar:actions.today` | Jump-to-today button |
| `'Refresh'` | `calendar:actions.refresh` | Manual refresh/sync button |
| `'Close'` | `calendar:actions.close` | Close dialog button |

---

### 3. Day Section Headers (5 strings)

**File Location:** Day grouping headers (~lines 1600-1700)
**Namespace:** `calendar:date.*`
**Priority:** MEDIUM (Section organization)

| String | Key Path | Context |
|--------|----------|---------|
| `'Today'` | `calendar:date.today.label` | Today's date header marker |
| `'events'` | `calendar:date.eventCount.label` | Event count text (e.g., "5 events") |
| `'No events this day'` | `calendar:date.empty.message` | Empty state message for a day |
| `'Loading events...'` | `calendar:date.loading.message` | Loading state text |
| `'Timezone:'` | `calendar:date.timezone.label` | Timezone display in header |

---

### 4. Status Badges & Chips (6 strings)

**File Location:** Event row rendering (~lines 1900-2100)
**Namespace:** `calendar:status.*`
**Priority:** MEDIUM (Visual indicators)

| String | Key Path | Context |
|--------|----------|---------|
| `'NOW'` | `calendar:status.now.badge` | Event happening now badge |
| `'NEXT'` | `calendar:status.next.badge` | Next upcoming event badge |
| `'Economic event'` | `calendar:status.type.economic` | Event type chip for standard events |
| `'Custom event'` | `calendar:status.type.custom` | Event type chip for user-created events |
| `'Tentative'` | `calendar:status.time.tentative` | Time uncertainty label |
| `'All Day'` | `calendar:status.time.allDay` | All-day event label |

---

### 5. Tooltip Text (8 strings)

**File Location:** Icon button tooltips, data labels
**Namespace:** `calendar:tooltips.*`
**Priority:** LOW-MEDIUM (Accessibility, hover hints)

| String | Key Path | Context |
|--------|----------|---------|
| `'Add reminder'` | `calendar:tooltips.addReminder` | Notes icon tooltip |
| `'View notes'` | `calendar:tooltips.viewNotes` | Notes button with existing notes |
| `'Add note'` | `calendar:tooltips.addNote` | Notes button without notes |
| `'Add to favorites'` | `calendar:tooltips.addFavorite` | Favorite button when not favorited |
| `'Remove from favorites'` | `calendar:tooltips.removeFavorite` | Favorite button when favorited |
| `'Show more'` | `calendar:tooltips.showMore` | Expand row details |
| `'Hide'` | `calendar:tooltips.hide` | Collapse row details |
| `'Copy event ID'` | `calendar:tooltips.copyId` | Copy-to-clipboard button |

---

### 6. No-Data & Loading States (6 strings)

**File Location:** Empty state rendering, loading skeletons (~lines 1500-1600)
**Namespace:** `calendar:states.*`
**Priority:** LOW-MEDIUM (Conditional displays)

| String | Key Path | Context |
|--------|----------|---------|
| `'No events found'` | `calendar:states.empty.heading` | Empty calendar heading |
| `'Try adjusting your filters'` | `calendar:states.empty.hint` | Help text for empty state |
| `'Loading events...'` | `calendar:states.loading.message` | Loading state message |
| `'Loading...'` | `calendar:states.loading.short` | Compact loading indicator |
| `'Error loading events'` | `calendar:states.error.heading` | Error state heading |
| `'Please try again later'` | `calendar:states.error.hint` | Error recovery hint |

---

### 7. Section Headers & Labels (6 strings)

**File Location:** Panel dividers, section titles (~lines 800-1000)
**Namespace:** `calendar:layout.*`
**Priority:** MEDIUM (UI organization)

| String | Key Path | Context |
|--------|----------|---------|
| `'Market Clock'` | `calendar:layout.clock.title` | Left panel header |
| `'Economic Calendar'` | `calendar:layout.calendar.title` | Right panel header |
| `'Powered by Forex Factory data'` | `calendar:layout.attribution` | Attribution text |
| `'Forecast'` | `calendar:layout.forecast.label` | Forecast section |
| `'Market Data'` | `calendar:layout.data.label` | Data section header |
| `'Filters'` | `calendar:layout.filters.label` | Filter section header |

---

### 8. Timezone Modal UI (4 strings)

**File Location:** TimezoneModal integration (~lines 600-800)
**Namespace:** `calendar:timezone.*`
**Priority:** LOW-MEDIUM (Modal-specific)

| String | Key Path | Context |
|--------|----------|---------|
| `'Select timezone'` | `calendar:timezone.modal.title` | Modal header |
| `'Your timezone is'` | `calendar:timezone.modal.current.label` | Current timezone indicator |
| `'Change'` | `calendar:timezone.modal.change.button` | Update timezone button |
| `'Timezone updated'` | `calendar:timezone.modal.updated.message` | Success confirmation |

---

## 📋 Migration Strategy

### Phase 2.5 Day 6 Plan

**Step 1: Update Translation Files (1 hour)**
- Merge new keys into `src/i18n/locales/en/calendar.json`
- Add all 45+ strings under `calendar:table.*`, `calendar:actions.*`, `calendar:date.*`, `calendar:status.*`, `calendar:tooltips.*`, `calendar:states.*`, `calendar:layout.*`, `calendar:timezone.*` namespaces
- Generate EN/ES/FR versions

**Step 2: Component Migration (2-3 hours)**
- Import `useTranslation` hook
- Initialize: `const { t } = useTranslation(['calendar', 'common']);`
- Replace all hardcoded strings with `t()` calls
- Special handling for dynamic text (e.g., event count: `${count} ${t('calendar:date.eventCount.label')}`)
- Update tooltips in icon buttons
- Update modal text and status badges

**Step 3: Verification (30 min)**
- Test EN/ES/FR rendering in calendar
- Verify table headers display in all languages
- Check filters work with i18n strings
- Check no-data states show correctly
- Build verify: `npm run build`
- Git commit with v1.5.73 version bump

### BEP Pattern

```javascript
// At top
import { useTranslation } from 'react-i18next';

// Inside component
export default function CalendarEmbed() {
  const { t } = useTranslation(['calendar', 'common']);
  
  // Replace hardcoded strings
  return (
    <Typography>{t('calendar:layout.calendar.title')}</Typography>
  );
}
```

---

## ✅ Readiness Checklist

- [x] File analyzed for hardcoded strings
- [x] 45+ strings identified and categorized
- [x] Namespace structure defined (calendar, common)
- [x] Key paths documented
- [x] Translation requirements identified (EN/ES/FR)
- [x] Migration strategy outlined
- [x] BEP pattern confirmed
- [ ] Translation files updated (next step)
- [ ] Component migration completed (Phase 2.5)
- [ ] Build verification passed (Phase 2.5)

---

## 🔗 Dependencies

- **i18next:** v21+ (already installed)
- **react-i18next:** v11+ (already installed)
- **Translation Files:** src/i18n/locales/{en,es,fr}/calendar.json
- **Related Audits:** EventsFilters3.jsx (shared calendar namespace)

---

## 📝 Notes for Phase 2.5 Migration

1. **Column Headers:** Table headers are static and can be moved to a constant object or rendered dynamically with i18n.

2. **Dynamic Text:** Event counts use template strings: `${count} ${t('calendar:date.eventCount.label')}` for flexibility.

3. **Section Organization:** Maintain consistent `calendar:` namespace prefix for all keys.

4. **Filter Integration:** EventsFilters3 component is imported separately. Ensure filter labels are handled in that component's audit (Day 7).

5. **Status Badges:** NOW/NEXT badges are data-driven. Keep keys organized under `calendar:status.*` for consistency.

6. **Tooltips:** All MUI Tooltip `title` props use `t()` calls during render.

---

## 🚀 Next Steps (Phase 2.5)

1. **Merge new keys into calendar.json** (Python script)
2. **Migrate CalendarEmbed.jsx component** (Manual replacements)
3. **Build verify** (npm run build)
4. **Git commit** (descriptive message)
5. **Proceed to EventsFilters3.jsx audit** (parallel if needed)

---

**Status:** ✅ Audit Complete - Ready for Phase 2.5  
**Version:** 1.0.0  
**Last Updated:** January 29, 2026
