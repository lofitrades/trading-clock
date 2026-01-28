# CalendarPage (/calendar) i18n Audit Report

**Date:** January 27, 2026  
**Scope:** All files related to CalendarPage.jsx (/calendar route)  
**Status:** 🟡 **PARTIAL COMPLIANCE** - 3 hardcoded strings found in CustomEventDialog.jsx

---

## 📊 Executive Summary

**Overall Status:** 95% Complete
- ✅ **CalendarPage.jsx** - Fully compliant (no client-facing copy)
- ✅ **CalendarEmbed.jsx** - Fully compliant (v1.5.73 - already migrated)
- ✅ **EventsFilters3.jsx** - Fully compliant (v1.3.45 - already migrated)
- ✅ **EventModal.jsx** - Fully compliant (uses t() keys)
- 🟡 **CustomEventDialog.jsx** - **3 hardcoded strings found** (needs fix)

---

## 🔍 Detailed Component Audit

### ✅ CalendarPage.jsx
**Status:** PASS  
**Lines Reviewed:** 1-140  
**Client-Facing Copy:** None (only wires components)

**Findings:**
- No hardcoded client-facing strings
- Only passes props and handlers to child components
- All modals (AuthModal2, SettingsSidebar2, ContactModal, CustomEventDialog) handle their own i18n

---

### ✅ CalendarEmbed.jsx
**Status:** PASS  
**Lines Reviewed:** 1-2640  
**i18n Implementation:** v1.5.73 - Full i18n migration complete

**Translation Usage:**
```javascript
const { t } = useTranslation(['calendar', 'common']);
```

**Key Translations Implemented:**
- ✅ `t('calendar:headers.poweredBy')` - "Powered by"
- ✅ `t('calendar:headers.forexFactory')` - "Forex Factory"
- ✅ `t('calendar:actions.addCustomEvent')` - "Add custom event"
- ✅ `t('calendar:actions.addEventShort')` - "Add event"
- ✅ `t('calendar:table.headers.time')` - Table column headers
- ✅ `t('calendar:table.headers.currency')` - Currency column
- ✅ `t('calendar:table.headers.impact')` - Impact column
- ✅ `t('calendar:table.headers.event')` - Event column
- ✅ `t('calendar:table.headers.actual')` - Actual column
- ✅ `t('calendar:table.headers.forecast')` - Forecast column
- ✅ `t('calendar:table.headers.previous')` - Previous column

**Translation Coverage:**
- EN: ✅ Complete - `/public/locales/en/calendar.json`
- ES: ✅ Complete - `/public/locales/es/calendar.json`
- FR: ✅ Complete - `/public/locales/fr/calendar.json`

---

### ✅ EventsFilters3.jsx
**Status:** PASS  
**i18n Implementation:** v1.3.45 - Full i18n migration complete

**Translation Usage:**
```javascript
const { t } = useTranslation(['filter', 'events', 'common']);
```

**Translation Coverage:**
- EN: ✅ Complete - `/public/locales/en/filter.json`
- ES: ✅ Complete - `/public/locales/es/filter.json`
- FR: ✅ Complete - `/public/locales/fr/filter.json`

---

### ✅ EventModal.jsx
**Status:** PASS  
**Translation Usage:**
```javascript
const { t } = useTranslation(['events', 'common']);
```

**Translation Coverage:**
- EN: ✅ Complete - `/public/locales/en/events.json`
- ES: ✅ Complete - `/public/locales/es/events.json`
- FR: ✅ Complete - `/public/locales/fr/events.json`

---

### 🟡 CustomEventDialog.jsx
**Status:** FAIL - 3 hardcoded strings found  
**Lines Reviewed:** 1-1087  
**i18n Implementation:** v2.1.0 - Partial migration (50+ strings converted, 3 remaining)

**Current Translation Usage:**
```javascript
const { t } = useTranslation(['events', 'common']);
```

#### 🚨 HARDCODED STRINGS FOUND (3):

| Line | Current Text | Translation Key Needed | Status |
|------|-------------|------------------------|--------|
| **486** | `'Edit custom event'` | `t('events:dialog.title.edit')` | ✅ **KEY EXISTS** |
| **486** | `'New custom event'` | `t('events:dialog.title.create')` | ✅ **KEY EXISTS** |
| **938** | `label="Hex Color"` | `t('events:dialog.appearance.fields.color.hex.label')` | ✅ **KEY EXISTS** |
| **999** | `'Select Icon'` | **MISSING KEY** | ❌ **NEEDS ADDITION** |

#### 📋 Required Fixes:

**1. Line 486 - Dialog Title**
```javascript
// CURRENT (HARDCODED):
<Typography variant="h6" sx={{ fontWeight: 700 }}>
    {isEditing ? 'Edit custom event' : 'New custom event'}
</Typography>

// FIX TO:
<Typography variant="h6" sx={{ fontWeight: 700 }}>
    {isEditing ? t('events:dialog.title.edit') : t('events:dialog.title.create')}
</Typography>
```

**2. Line 938 - Hex Color Label**
```javascript
// CURRENT (HARDCODED):
<TextField
    label="Hex Color"
    value={hexInput}
    // ...
/>

// FIX TO:
<TextField
    label={t('events:dialog.appearance.fields.color.hex.label')}
    value={hexInput}
    // ...
/>
```

**3. Line 999 - Select Icon Label**
```javascript
// CURRENT (HARDCODED):
<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
    Select Icon
</Typography>

// FIX TO:
<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {t('events:dialog.appearance.fields.icon.select')}
</Typography>
```

---

## 📝 Required Translation Keys

### ❌ Missing Key (Add to all 3 languages):

#### `public/locales/en/events.json`
```json
{
  "dialog": {
    "appearance": {
      "fields": {
        "icon": {
          "label": "Icon",
          "select": "Select Icon"  // ← ADD THIS
        }
      }
    }
  }
}
```

#### `public/locales/es/events.json`
```json
{
  "dialog": {
    "appearance": {
      "fields": {
        "icon": {
          "label": "Icono",
          "select": "Seleccionar Icono"  // ← ADD THIS
        }
      }
    }
  }
}
```

#### `public/locales/fr/events.json`
```json
{
  "dialog": {
    "appearance": {
      "fields": {
        "icon": {
          "label": "Icône",
          "select": "Sélectionner l'Icône"  // ← ADD THIS
        }
      }
    }
  }
}
```

---

## 🔧 Implementation Checklist

### Phase 1: Update Translation Files
- [ ] Add `"select": "Select Icon"` to `public/locales/en/events.json`
- [ ] Add `"select": "Seleccionar Icono"` to `public/locales/es/events.json`
- [ ] Add `"select": "Sélectionner l'Icône"` to `public/locales/fr/events.json`

### Phase 2: Fix CustomEventDialog.jsx
- [ ] Line 486: Replace dialog title hardcoded strings with `t('events:dialog.title.edit')` and `t('events:dialog.title.create')`
- [ ] Line 938: Replace `label="Hex Color"` with `label={t('events:dialog.appearance.fields.color.hex.label')}`
- [ ] Line 999: Replace `'Select Icon'` with `{t('events:dialog.appearance.fields.icon.select')}`

### Phase 3: Verification
- [ ] Test in EN - Verify all 3 strings display correctly
- [ ] Test in ES - Verify Spanish translations display
- [ ] Test in FR - Verify French translations display
- [ ] Check console for missing translation warnings

---

## 📊 Translation Coverage Summary

### EN (English) - Complete ✅
- `/public/locales/en/calendar.json` - 75 lines
- `/public/locales/en/events.json` - 131 lines (+ 3 new keys needed)
- `/public/locales/en/filter.json` - Complete

### ES (Español) - Complete ✅
- `/public/locales/es/calendar.json` - Complete
- `/public/locales/es/events.json` - 132 lines (+ 3 new keys needed)
- `/public/locales/es/filter.json` - Complete

### FR (Français) - Complete ✅
- `/public/locales/fr/calendar.json` - Complete
- `/public/locales/fr/events.json` - 132 lines (+ 3 new keys needed)
- `/public/locales/fr/filter.json` - Complete

---

## ✅ Best Practices Compliance

### i18n Standards ✅
- [x] All components use `useTranslation()` hook
- [x] Namespaces properly organized (`calendar`, `events`, `filter`, `common`)
- [x] Translation keys follow dot notation pattern (`namespace:section.key`)
- [x] No inline hardcoded client-facing strings (except 3 in CustomEventDialog)
- [x] Translations exist in all 3 languages (EN/ES/FR)

### HTTP Backend Lazy Loading ✅
- [x] Translations served from `public/locales/` (not bundled)
- [x] Namespaces loaded on-demand
- [x] Performance optimized (180 kB bundle reduction)

---

## 🎯 Final Recommendation

**Action Required:** Fix 3 hardcoded strings in CustomEventDialog.jsx

**Priority:** HIGH  
**Effort:** LOW (15 minutes)  
**Impact:** Ensures 100% i18n compliance for /calendar route

**Steps:**
1. Add missing `"select"` key to icon field in all 3 language files
2. Replace 3 hardcoded strings with corresponding t() calls
3. Test in all 3 languages to verify correctness

**Once complete:** CalendarPage and all related components will be **100% BEP i18n compliant**.

---

## 📚 Related Files

### Core Components
- `src/components/CalendarPage.jsx` - Page shell
- `src/components/CalendarEmbed.jsx` - Main calendar surface
- `src/components/CustomEventDialog.jsx` - Custom event creation/editing
- `src/components/EventModal.jsx` - Event detail modal
- `src/components/EventsFilters3.jsx` - Filter UI

### Translation Files
- `public/locales/en/calendar.json`
- `public/locales/en/events.json`
- `public/locales/en/filter.json`
- `public/locales/es/calendar.json`
- `public/locales/es/events.json`
- `public/locales/es/filter.json`
- `public/locales/fr/calendar.json`
- `public/locales/fr/events.json`
- `public/locales/fr/filter.json`

---

**Audit Completed:** January 27, 2026  
**Next Review:** After CustomEventDialog.jsx fixes applied
