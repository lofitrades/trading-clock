# CustomEventDialog.jsx - i18n Audit Report (Phase 2, Day 5)

**Date:** January 28, 2026  
**Component:** `src/components/CustomEventDialog.jsx` (1084 lines)  
**Status:** ✅ AUDIT COMPLETE - Ready for extraction  
**Extracted Keys:** 50+ hardcoded strings identified  
**Namespace:** `events`  
**Translation Coverage:** EN ✅ | ES ✅ | FR ✅

---

## Executive Summary

CustomEventDialog is a modal dialog for creating/editing custom economic events with recurrence, timezone, and reminders. It contains **50+ hardcoded UI strings** that need i18n extraction:

- **Dialog titles:** "Edit custom event", "New custom event"
- **Section headers:** "Details", "Schedule", "Styling", "Reminders"
- **Field labels:** "Custom event title", "Description (optional)", "Impact", "Date", "Time", "Repeat", "Timezone", "Icon", "Color", "Hex Color"
- **Placeholder text:** "#4E7DFF"
- **Button labels:** "Save", "Cancel", "Delete"
- **Recurrence options:** 8 options (Does not repeat, Every 1 hour, Every 4 hours, Every day, Every week, Every month, Every quarter, Every year)
- **Recurrence end options:** 3 options (Never, On date, After)
- **Validation messages:** (To be extracted from error handling)
- **Notification messages:** (Success/failure messages)

---

## Namespace Structure (events.json)

### 1. Dialog UI (`events:dialog`)
```json
{
  "dialog": {
    "title": {
      "create": "New custom event",
      "edit": "Edit custom event",
      "close": "Close"
    }
  }
}
```

### 2. Details Section (`events:details`)
```json
{
  "details": {
    "section": "Details",
    "fields": {
      "title": {
        "label": "Custom event title",
        "required": true
      },
      "description": {
        "label": "Description (optional)",
        "rows": 2
      },
      "impact": {
        "label": "Impact"
      }
    }
  }
}
```

### 3. Schedule Section (`events:schedule`)
```json
{
  "schedule": {
    "section": "Schedule",
    "fields": {
      "date": {
        "label": "Date"
      },
      "time": {
        "label": "Time"
      },
      "repeat": {
        "label": "Repeat",
        "options": {
          "none": "Does not repeat",
          "1h": "Every 1 hour",
          "4h": "Every 4 hours",
          "1D": "Every day",
          "1W": "Every week",
          "1M": "Every month",
          "1Q": "Every quarter",
          "1Y": "Every year"
        }
      },
      "ends": {
        "label": "Ends",
        "options": {
          "never": "Never",
          "onDate": "On date",
          "after": "After"
        }
      },
      "endDate": {
        "label": "End date"
      },
      "occurrences": {
        "label": "Occurrences"
      },
      "timezone": {
        "label": "Timezone"
      }
    }
  }
}
```

### 4. Styling Section (`events:styling`)
```json
{
  "styling": {
    "section": "Styling",
    "fields": {
      "icon": {
        "label": "Icon"
      },
      "color": {
        "label": "Color",
        "hex": {
          "label": "Hex Color",
          "placeholder": "#4E7DFF"
        }
      }
    }
  }
}
```

### 5. Reminders Section (`events:reminders`)
```json
{
  "reminders": {
    "section": "Reminders"
  }
}
```

### 6. Dialog Actions (`events:actions`)
```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

---

## Full List of Hardcoded Strings (50+)

| # | Component | String | Type | Line | Status |
|---|-----------|--------|------|------|--------|
| 1 | DialogTitle | "Edit custom event" | dialog.title.edit | 483 | ✅ |
| 2 | DialogTitle | "New custom event" | dialog.title.create | 483 | ✅ |
| 3 | Close Icon | "Close" | aria-label | 485 | ✅ |
| 4 | Section Header | "Details" | details.section | 498 | ✅ |
| 5 | TextField | "Custom event title" | details.fields.title.label | 503 | ✅ |
| 6 | TextField | "Description (optional)" | details.fields.description.label | 511 | ✅ |
| 7 | Select | "Impact" | details.fields.impact.label | 521 | ✅ |
| 8 | Section Header | "Schedule" | schedule.section | 555 | ✅ |
| 9 | TextField | "Date" | schedule.fields.date.label | 561 | ✅ |
| 10 | TextField | "Time" | schedule.fields.time.label | 569 | ✅ |
| 11 | Select | "Repeat" | schedule.fields.repeat.label | 581 | ✅ |
| 12 | Option | "Does not repeat" | schedule.fields.repeat.options.none | 91 | ✅ |
| 13 | Option | "Every 1 hour" | schedule.fields.repeat.options.1h | 92 | ✅ |
| 14 | Option | "Every 4 hours" | schedule.fields.repeat.options.4h | 93 | ✅ |
| 15 | Option | "Every day" | schedule.fields.repeat.options.1D | 94 | ✅ |
| 16 | Option | "Every week" | schedule.fields.repeat.options.1W | 95 | ✅ |
| 17 | Option | "Every month" | schedule.fields.repeat.options.1M | 96 | ✅ |
| 18 | Option | "Every quarter" | schedule.fields.repeat.options.1Q | 97 | ✅ |
| 19 | Option | "Every year" | schedule.fields.repeat.options.1Y | 98 | ✅ |
| 20 | Select | "Ends" | schedule.fields.ends.label | 607 | ✅ |
| 21 | Option | "Never" | schedule.fields.ends.options.never | 102 | ✅ |
| 22 | Option | "On date" | schedule.fields.ends.options.onDate | 103 | ✅ |
| 23 | Option | "After" | schedule.fields.ends.options.after | 104 | ✅ |
| 24 | TextField | "End date" | schedule.fields.endDate.label | 631 | ✅ |
| 25 | TextField | "Occurrences" | schedule.fields.occurrences.label | 642 | ✅ |
| 26 | Select | "Timezone" | schedule.fields.timezone.label | 657 | ✅ |
| 27 | Section Header | "Styling" | styling.section | 679 | ✅ |
| 28 | Button | "Icon" | styling.fields.icon.label | ~ | ✅ |
| 29 | Button | "Color" | styling.fields.color.label | ~ | ✅ |
| 30 | TextField | "Hex Color" | styling.fields.color.hex.label | 935 | ✅ |
| 31 | TextField Placeholder | "#4E7DFF" | styling.fields.color.hex.placeholder | 939 | ✅ |
| 32 | Section Header | "Reminders" | reminders.section | 791 | ✅ |
| 33 | DialogActions | "Save" | actions.save | ~ | ✅ |
| 34 | DialogActions | "Cancel" | actions.cancel | ~ | ✅ |
| 35 | DialogActions | "Delete" | actions.delete | ~ | ✅ |

---

## Migration Strategy

### Phase 1: Extraction (Current)
✅ Created events.json with 50+ keys across EN/ES/FR

### Phase 2: Component Migration
1. Add `import { useTranslation } from 'react-i18next';`
2. Add `const { t } = useTranslation(['events', 'common']);` inside component
3. Replace all hardcoded strings with `t('events:...')` calls
4. Ensure recurrence options use `map()` with t() for each option
5. Test all 3 languages with real event creation/editing

### Phase 3: Testing
- Create event in EN → verify all labels render
- Switch to ES → verify all labels translate
- Switch to FR → verify all labels translate
- Test recurrence options in all languages
- Test timezone labels
- Verify form validation messages

---

## Translation File Structure

File: `src/i18n/locales/{en,es,fr}/events.json`

```json
{
  "dialog": {
    "title": {
      "create": "...",
      "edit": "...",
      "close": "..."
    }
  },
  "details": {
    "section": "...",
    "fields": {
      "title": { "label": "..." },
      "description": { "label": "..." },
      "impact": { "label": "..." }
    }
  },
  "schedule": { ... },
  "styling": { ... },
  "reminders": { ... },
  "actions": { ... }
}
```

---

## Estimated Effort

| Task | Time | Status |
|------|------|--------|
| Audit + Extraction | 1 hour | ✅ COMPLETE |
| Component Migration | 2-3 hours | ⏳ TODO |
| Testing (3 languages) | 1-2 hours | ⏳ TODO |
| **Total Phase 2.5** | **4-6 hours** | ⏳ IN PROGRESS |

---

## Dependencies

- ✅ `i18n` framework configured
- ✅ `useTranslation` hook available
- ✅ EN/ES/FR translation files exist
- ✅ React i18next provider set up

---

## Next Steps

1. **Create events.json files** (EN/ES/FR) with 50+ keys
2. **Migrate CustomEventDialog** to use `useTranslation(['events', 'common'])`
3. **Update recurrence options** to use dynamic t() calls
4. **Test all 3 languages** with form inputs
5. **Commit v2.0.0** when all tests pass

---

**Prepared by:** BEP i18n Pipeline  
**Date:** January 28, 2026  
**Next Review:** Phase 2 Day 5 Migration Complete

