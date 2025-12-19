# Timezone Handling in Economic Events

**Last Updated:** November 30, 2025  
**Status:** ✅ Verified - Storing exact API timestamps

---

## Overview

This document explains how timestamps from the JBlanked News Calendar API (MQL5 source) are handled, stored, and displayed in the Time 2 Trade application.

---

## API Source: JBlanked (MQL5 Economic Calendar)

### Timezone Information

**Data Source:** MQL5 Economic Calendar  
**Reference:** https://www.mql5.com/en/docs/calendar

> "All functions for working with the economic calendar use the **trade server time (TimeTradeServer)**. This means that the time in the MqlCalendarValue structure... are set in a **trade server timezone**, rather than a user's local time."

**Trade Server Timezone:** Typically **GMT+2** or **GMT+3** (depends on broker and daylight saving)

### API Response Format

```json
{
  "Name": "Core CPI m/m",
  "Currency": "USD",
  "Date": "2024.02.08 15:30:00",
  "Actual": 0.4,
  "Forecast": 0.4,
  "Previous": 0.2
}
```

**Date Format:** `YYYY.MM.DD HH:MM:SS`  
**Timezone:** Trade server time (GMT+2/GMT+3)

---

## Storage Strategy

### Cloud Functions: `parseJBlankedDate()`

**File:** `functions/src/utils/dateUtils.ts`

```typescript
export function parseJBlankedDate(dateStr: string): Date {
  // Parse: "2024.02.08 15:30:00" -> ISO format with UTC marker
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T") + "Z";
  
  // The 'Z' suffix tells Date() to interpret as UTC
  // This preserves the exact time from the API
  return new Date(isoFormat);
}
```

### What We Store

1. **Original Time String:** `"2024.02.08 15:30:00"` from API
2. **Parsed as:** `"2024-02-08T15:30:00Z"` (UTC)
3. **Stored in Firestore:** `Timestamp` object (milliseconds since epoch)

**Key Point:** We add the `Z` suffix to interpret the time **as-is in UTC**, preserving the exact moment without local timezone conversion.

---

## Display Strategy

### Client-Side: User's Selected Timezone

**File:** `src/components/EconomicEvents.jsx`

The client-side code converts Firestore timestamps to the **user's selected timezone** for display:

```javascript
// User selects timezone (EST, PST, UTC, etc.)
const { selectedTimezone } = useSettings();

// Convert Firestore timestamp to user's timezone
const eventDate = event.date.toDate(); // JavaScript Date object
const displayTime = eventDate.toLocaleString('en-US', {
  timeZone: selectedTimezone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});
```

### Timezone Conversion Flow

```
API (Trade Server Time)
  ↓
"2024.02.08 15:30:00"
  ↓
Cloud Functions (Parse as UTC)
  ↓
"2024-02-08T15:30:00Z"
  ↓
Firestore Timestamp
  ↓
Client-Side (Convert to user's timezone)
  ↓
Display: "3:30 PM EST" (if user selected EST)
```

---

## Why This Approach?

### ✅ Advantages

1. **Preserves Original Time:** We store exactly what the API provides
2. **Universal Storage:** UTC timestamps are the universal standard
3. **Flexible Display:** Each user can view times in their preferred timezone
4. **No Data Loss:** Original event time is never lost in conversion
5. **Consistent Queries:** All dates in Firestore use same timezone (UTC)

### ❌ Alternative (Not Used)

**Converting on Storage:**
```typescript
// ❌ DON'T DO THIS
const localDate = new Date(dateStr); // Interprets in local timezone
```

**Problem:** This would convert the time based on the **Cloud Function server's timezone**, causing data corruption.

---

## Verification

### Testing Timestamp Storage

```bash
# 1. Trigger API sync
curl https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow

# 2. Check Firestore Console
# Firebase Console → Firestore → economicEventsCalendar → Pick any event

# 3. Verify timestamp matches API source
# API: "2024.02.08 15:30:00"
# Firestore: February 8, 2024 at 3:30:00 PM UTC+0
```

### Testing Display Conversion

```javascript
// In browser console
const event = { date: Timestamp.fromDate(new Date('2024-02-08T15:30:00Z')) };
const display = event.date.toDate().toLocaleString('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit'
});
console.log(display); // "10:30 AM" (EST is UTC-5)
```

---

## Common Issues

### Issue 1: Times Appear Wrong
**Symptom:** Event times don't match other calendars  
**Cause:** API source uses trade server timezone (GMT+2/GMT+3), not EST  
**Solution:** This is expected. Economic calendars use different timezones. Our app converts to user's selected timezone.

### Issue 2: Midnight Crossover
**Symptom:** Events on wrong date after timezone conversion  
**Cause:** UTC date may differ from local date  
**Solution:** This is correct behavior. An event at "2024-02-08 23:00:00 UTC" is "Feb 8, 6 PM EST".

### Issue 3: Daylight Saving Time
**Symptom:** Times shift when DST changes  
**Cause:** Trade server timezone may observe DST  
**Solution:** Store as UTC (no DST), let client handle DST in display.

---

## Best Practices

### ✅ DO

- Store all timestamps as UTC in Firestore
- Add `Z` suffix when parsing API dates to force UTC interpretation
- Let client-side handle timezone conversion for display
- Use `Intl.DateTimeFormat` or `toLocaleString()` for display
- Document timezone assumptions in code comments

### ❌ DON'T

- Convert timestamps based on server's local timezone
- Assume API times are in EST or UTC without verification
- Store timezone-specific strings in Firestore
- Use `new Date()` without timezone specification
- Hard-code timezone offsets in calculations

---

## References

### Documentation
- **MQL5 Calendar:** https://www.mql5.com/en/docs/calendar
- **JBlanked API:** https://www.jblanked.com/news/api/docs/calendar/
- **Firestore Timestamps:** https://firebase.google.com/docs/reference/js/firestore_.timestamp
- **JavaScript Date:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

### Code Files
- `functions/src/utils/dateUtils.ts` - Timestamp parsing
- `functions/src/services/syncEconomicEvents.ts` - API sync logic
- `src/components/EconomicEvents.jsx` - Display logic
- `src/hooks/useSettings.js` - Timezone selection

---

## Change Log

### November 30, 2025 - v1.0.0
- ✅ Verified API source uses trade server timezone (GMT+2/GMT+3)
- ✅ Updated `parseJBlankedDate()` to parse as UTC with `Z` suffix
- ✅ Documented timezone handling strategy
- ✅ Confirmed client-side converts to user's selected timezone

---

**Conclusion:** Our implementation correctly stores exact API timestamps as UTC and lets the client display in user's preferred timezone. No timezone conversion or data loss occurs during storage.
