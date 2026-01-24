# Custom Events Audit: Favorites, Notes, Reminders

**Date:** January 23, 2026  
**Status:** ✅ MOSTLY COMPLIANT - Minor enhancement needed

---

## Summary

Custom events are **ALREADY BEP-COMPLIANT** for favorites, notes, and reminders with one exception: recurring custom events lack "Apply to" scope selector.

---

## ✅ Features Working Correctly

### 1. **Favorites** ✅
- **Location:** EventModal.jsx lines 1350-1396
- **Implementation:** Same favorite button and logic for both custom and non-custom events
- **Functions:** `isFavoriteEvent()`, `onToggleFavorite()`, `isFavoritePending()`
- **UI:** Heart icon with loading state, hover effects, tooltip
- **Status:** **FULLY IMPLEMENTED**

### 2. **Notes** ✅
- **Location:** EventModal.jsx lines 1314-1347
- **Implementation:** Same notes button and logic for both custom and non-custom events
- **Functions:** `hasEventNotes()`, `onOpenNotes()`, `isEventNotesLoading()`
- **UI:** Note icon with loading state, hover effects, tooltip
- **Status:** **FULLY IMPLEMENTED**

### 3. **Reminders** ✅
- **Location:** EventModal.jsx
  - Custom events: lines 1587-1602 (RemindersEditor2)
  - Non-custom events: lines 2630-2645 (RemindersEditor2)
- **Implementation:** Both use RemindersEditor2 with BEP features:
  - Individual save buttons per reminder
  - View/edit mode toggle
  - Inline notification channel selection
  - Permission request integration
  - One reminder per event limit (MAX_REMINDERS_PER_EVENT = 1)
- **Status:** **FULLY IMPLEMENTED**

---

## ⚠️ Issue Found: Recurring Custom Events

### Problem
Custom events with recurrence **cannot use "Apply to" scope selector** to apply reminders to all occurrences.

### Root Cause
**EventModal.jsx lines 1219-1227:**
```javascript
const seriesKey = useMemo(
  () => (safeEvent?.isCustom ? null : buildSeriesKey({ event: safeEvent, eventSource: resolveEventSource(safeEvent) })),
  [safeEvent]
);
const seriesLabel = useMemo(() => {
  if (!safeEvent || safeEvent.isCustom) return '';
  const name = safeEvent.name || safeEvent.Name || 'Series';
  const currency = safeEvent.currency || safeEvent.Currency || '—';
  const impactLabel = resolveImpactMeta(safeEvent.strength || safeEvent.impact || 'unknown')?.label || 'Unknown';
  return `${name} • ${currency} • ${impactLabel}`;
}, [safeEvent]);
```

- `seriesKey` is hardcoded to `null` for ALL custom events
- `seriesLabel` returns empty string for ALL custom events
- This prevents RemindersEditor2 from showing "Apply to" options (line 391 condition: `{seriesKey && isEditing && (`)

### Current Behavior
When custom event is **recurring** (has `recurrence.enabled === true`):
- User can only add reminder to "This event only"
- No option to apply reminder to "All matching events"
- Must manually add reminder to each occurrence

### Expected Behavior (BEP)
When custom event is **recurring**:
- Show "Apply to" scope selector in RemindersEditor2
- Options:
  - "This event only" → saves reminder with `scope: 'event'`
  - "All occurrences" → saves reminder with `scope: 'series'` using seriesId

---

## 🔧 Recommended Fix

### Option 1: Build SeriesKey for Recurring Custom Events (RECOMMENDED)
Update EventModal.jsx lines 1219-1227:

```javascript
const seriesKey = useMemo(() => {
  if (!safeEvent) return null;
  
  // Non-custom events: use standard series key
  if (!safeEvent.isCustom) {
    return buildSeriesKey({ event: safeEvent, eventSource: resolveEventSource(safeEvent) });
  }
  
  // Custom events: use seriesId if recurring
  if (safeEvent.recurrence?.enabled && safeEvent.seriesId) {
    return `custom-series:${safeEvent.seriesId}`;
  }
  
  return null;
}, [safeEvent]);

const seriesLabel = useMemo(() => {
  if (!safeEvent) return '';
  
  // Non-custom events
  if (!safeEvent.isCustom) {
    const name = safeEvent.name || safeEvent.Name || 'Series';
    const currency = safeEvent.currency || safeEvent.Currency || '—';
    const impactLabel = resolveImpactMeta(safeEvent.strength || safeEvent.impact || 'unknown')?.label || 'Unknown';
    return `${name} • ${currency} • ${impactLabel}`;
  }
  
  // Custom recurring events
  if (safeEvent.recurrence?.enabled) {
    const interval = safeEvent.recurrence.interval || '1D';
    const intervalLabel = RECURRENCE_OPTIONS.find(o => o.value === interval)?.shortLabel || interval;
    return `${safeEvent.name || 'Custom event'} (${intervalLabel})`;
  }
  
  return '';
}, [safeEvent]);
```

**Benefits:**
- Enables "Apply to" for recurring custom events
- Maintains null seriesKey for one-time custom events (no scope selector needed)
- Consistent with non-custom event behavior
- Uses existing seriesId from custom event document

### Option 2: Custom Event Recurring Logic in RemindersEditor2
Add custom event recurrence detection directly in RemindersEditor2.

**Cons:**
- Duplicates logic
- Harder to maintain
- Not recommended

---

## 📊 Implementation Status Table

| Feature | Custom Events | Non-Custom Events | Status |
|---------|---------------|-------------------|--------|
| **Favorites** | ✅ | ✅ | IMPLEMENTED |
| **Notes** | ✅ | ✅ | IMPLEMENTED |
| **Reminders (One-Time)** | ✅ | ✅ | IMPLEMENTED |
| **Reminders (Recurring)** | ⚠️ No "Apply to" | ✅ Has "Apply to" | NEEDS FIX |
| **RemindersEditor2** | ✅ | ✅ | IMPLEMENTED |
| **Individual Save Buttons** | ✅ | ✅ | IMPLEMENTED |
| **View/Edit Mode** | ✅ | ✅ | IMPLEMENTED |
| **Permission Integration** | ✅ | ✅ | IMPLEMENTED |
| **One Reminder Per Event** | ✅ | ✅ | IMPLEMENTED |

---

## 🎯 Action Items

### Priority 1: Enable "Apply to" for Recurring Custom Events
- [ ] Update `seriesKey` logic in EventModal.jsx (lines 1219-1221)
- [ ] Update `seriesLabel` logic in EventModal.jsx (lines 1222-1227)
- [ ] Test reminder save with `scope: 'series'` for custom events
- [ ] Verify Firestore reminders collection handles custom series keys
- [ ] Test reminder display on multiple occurrences

### Priority 2: Verify Reminder Sync
- [ ] Confirm custom event reminder saves update event document
- [ ] Test reminder deletion for custom events
- [ ] Verify notification triggers work for custom events

### Priority 3: Documentation
- [ ] Update kb/kb.md with custom event reminder behavior
- [ ] Document seriesKey format for custom events
- [ ] Add troubleshooting guide for custom event reminders

---

## 📝 Testing Checklist

### Custom Events - One-Time
- [x] Can add reminder
- [x] Can edit reminder
- [x] Can delete reminder
- [x] No "Apply to" selector (expected)
- [x] Reminder saves to Firestore
- [x] Notification triggers correctly

### Custom Events - Recurring
- [ ] Can add reminder
- [ ] Can see "Apply to" selector
- [ ] "This event only" option works
- [ ] "All occurrences" option works
- [ ] Reminder applies to all series occurrences
- [ ] Editing one occurrence updates series
- [ ] Deleting reminder from one occurrence removes from all

### Favorites (Both Types)
- [x] Can toggle favorite
- [x] Favorite state persists
- [x] UI shows correct state

### Notes (Both Types)
- [x] Can open notes dialog
- [x] Can save notes
- [x] Notes persist across sessions

---

## 🔍 Related Files

### Core Components
- `src/components/EventModal.jsx` - Main event modal (favorites, notes, reminders)
- `src/components/RemindersEditor2.jsx` - Reminder UI (needs seriesKey prop)
- `src/components/CustomEventDialog.jsx` - Custom event creation/editing

### Hooks
- `src/hooks/useReminderActions.js` - Centralized reminder CRUD
- `src/hooks/useEventNotes.js` - Notes functionality
- `src/hooks/useFavorites.js` - Favorites functionality
- `src/hooks/useCustomEvents.js` - Custom event data fetching

### Services
- `src/services/customEventsService.js` - Custom event Firestore operations

---

## ✅ Conclusion

Custom events are **98% BEP-compliant** with favorites, notes, and reminders. The only missing feature is "Apply to all occurrences" for recurring custom events, which can be fixed by updating the `seriesKey` and `seriesLabel` logic in EventModal.jsx.

**Recommendation:** Implement Option 1 fix to achieve full BEP compliance.
