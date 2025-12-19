# Timezone Verification Test - November 30, 2025

## Purpose
Verify that economic event times from JBlanked API are correctly stored in UTC 
and properly converted to user-selected timezones.

## Data Flow
1. **JBlanked API** → Returns dates in format: `"2024.02.08 15:30:00"` (GMT/UTC)
2. **parseJBlankedDate()** → Converts to: `"2024-02-08T15:30:00Z"` (ISO 8601 UTC)
3. **Firestore** → Stores as Firestore Timestamp (UTC)
4. **Client Retrieval** → Converts Timestamp to JavaScript Date (UTC)
5. **Display** → Formats with `toLocaleTimeString()` using user's timezone

## Test Cases

### Test 1: Verify API Returns UTC Times
**Hypothesis:** JBlanked API returns times in GMT (UTC) by default

**Evidence:**
- API docs show `jb.offset` parameter: `0 = GMT-3, 3 = GMT, 7 = EST, 10 = PST`
- Default behavior (no offset param) returns GMT/UTC
- Our function adds 'Z' suffix to indicate UTC parsing

**Action:** Compare a known event from Forex Factory with Firestore data

Example:
- Event: "Non-Farm Payrolls" (First Friday of month, always 8:30 AM EST)
- Forex Factory (EST): 08:30
- Expected UTC: 13:30 (EST + 5 hours)
- Firestore should store: `T13:30:00.000Z`

### Test 2: Verify Client-Side Conversion
**Test with 3 timezones:**

Given event: `"2024-12-01T14:30:00.000Z"` (2:30 PM UTC)

| Timezone | Expected Display Time | Conversion |
|----------|----------------------|------------|
| UTC | 14:30 | No conversion |
| America/New_York (EST) | 09:30 | UTC - 5 hours |
| Europe/London (GMT) | 14:30 | Same as UTC (winter) |
| Asia/Tokyo (JST) | 23:30 | UTC + 9 hours |

**How to Test:**
1. Open app, select timezone in TimezoneSelector
2. Open Economic Events drawer
3. Compare times with Forex Factory (ensure FF is set to SAME timezone)
4. Check browser console for debug logs: `[formatTime] Time conversion:`

### Test 3: Compare with Forex Factory
**Steps:**
1. Go to https://www.forexfactory.com/calendar
2. Click timezone indicator (top right, shows current time like "4:02pm")
3. Set to "GMT-5 (EST)" or your desired timezone
4. Compare event times with T2T app

**Important Events to Check:**
- NFP (Non-Farm Payrolls): Always First Friday, 8:30 AM EST
- FOMC Rate Decision: Always 2:00 PM EST
- CPI Report: Usually 8:30 AM EST
- ECB Rate Decision: Usually 7:45 AM EST

### Test 4: Debug Logging
**Enable Debug Mode:**
The formatTime function now logs conversions in development mode:

```javascript
console.log('[formatTime] Time conversion:', {
  inputDate: date,
  utcTime: dateObj.toISOString(),
  timezone: timezone,
  formattedTime: formatted,
});
```

**Expected Console Output:**
```
[formatTime] Time conversion: {
  inputDate: "2024-12-01T14:30:00.000Z",
  utcTime: "2024-12-01T14:30:00.000Z",
  timezone: "America/New_York",
  formattedTime: "09:30"
}
```

## Known Issues & Fixes

### Issue 1: Times Don't Match Forex Factory
**Symptom:** Event shows 14:30 in T2T but 09:30 in Forex Factory

**Root Causes:**
1. ❌ Timezone not selected correctly in T2T
2. ❌ Forex Factory using different timezone than T2T
3. ❌ API returning non-UTC times (unlikely)
4. ❌ parseJBlankedDate() parsing incorrectly

**Solution:**
- Verify both FF and T2T use same timezone
- Check console logs for actual conversion
- Compare raw Firestore data with API response

### Issue 2: Incorrect Date Parsing
**Symptom:** Events appear on wrong day or 24 hours off

**Root Cause:** Adding/removing 'Z' incorrectly in date parsing

**Current Implementation:**
```typescript
const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T") + "Z";
return new Date(isoFormat); // Interprets as UTC
```

**If this is WRONG**, try:
```typescript
// Parse without 'Z' - interpret as local time
const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T");
return new Date(isoFormat + "+00:00"); // Explicitly set UTC offset
```

## API Documentation References

### JBlanked API
- **URL:** https://www.jblanked.com/news/api/docs/calendar/
- **Date Format:** `"YYYY.MM.DD HH:MM:SS"`
- **Default Timezone:** GMT (UTC) - based on offset parameter docs
- **Offset Parameter:** `jb.offset = 0` (GMT-3), `3` (GMT), `7` (EST), `10` (PST)

### Forex Factory
- **URL:** https://www.forexfactory.com/calendar
- **Timezone Setting:** Top right corner (clickable time display)
- **Default:** Often EST (GMT-5)
- **Data Source:** Multiple providers (more reliable than single source)

## Verification Checklist

### Pre-Deployment
- [ ] Updated `dateUtils.ts` documentation with correct timezone info
- [ ] Added debug logging to `formatTime()` function
- [ ] Compiled TypeScript functions: `cd functions && npm run build`
- [ ] Deployed functions: `firebase deploy --only functions`

### Post-Deployment
- [ ] Open T2T app in production (GitHub Pages)
- [ ] Select "America/New_York" timezone
- [ ] Open Economic Events drawer
- [ ] Find a known event (e.g., NFP, CPI)
- [ ] Compare time with Forex Factory (set to EST)
- [ ] Check browser console for debug logs
- [ ] Verify times match exactly

### If Times Still Don't Match
1. Check console logs - what timezone is being passed?
2. Check Firestore data - is the UTC time correct?
3. Manually calculate: UTC time + timezone offset = expected time
4. Compare with multiple sources (FF, Investing.com, DailyFX)

## Final Notes

**Remember:**
- Firestore always stores in UTC (best practice)
- Client-side converts to display timezone
- `toLocaleTimeString()` with `timeZone` option does the conversion
- Debug logs only appear in development mode
- Production uses compiled JS from `functions/lib/`

**If you need to fix the API timezone interpretation:**
1. Update `functions/src/utils/dateUtils.ts`
2. Rebuild: `cd functions && npm run build`
3. Deploy: `firebase deploy --only functions:syncEconomicEventsCalendarNow`
4. Re-sync events: Click "Sync Calendar" in app

**Verification Method:**
Use a calculator to manually verify UTC → Timezone conversion:
- Find an event in Firestore with known time
- Note the UTC time (e.g., 13:30 UTC)
- Calculate for EST: 13:30 - 5 = 08:30 EST ✓
- Calculate for PST: 13:30 - 8 = 05:30 PST ✓
- Compare with what T2T displays
