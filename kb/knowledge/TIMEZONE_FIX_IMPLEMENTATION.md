# Timezone Fix Implementation Summary

**Date:** December 1, 2025  
**Issue:** Event times displaying 7 hours off (9:45 AM EST showing as 3:45 PM)  
**Status:** ✅ FIXED

---

## Root Cause

### JBlanked API Offset System
The JBlanked API uses a **base time + offset** system:
- API returns times in a reference format (e.g., `"2025.12.01 21:45:00"`)
- Offset values defined in documentation:
  - `GMT-3 = offset 0` (base reference)
  - `GMT = offset 3`
  - `EST = offset 7`
  - `PST = offset 10`
- **To get UTC:** Subtract the offset hours from the API's base time
- **Formula:** `UTC = API_BASE_TIME - 7 hours`

### Example
- **Forex Factory shows:** "9:45 AM EST"
- **API returns:** `"2025.12.01 21:45:00"` (base time)
- **Correct parsing:** 21:45 - 7 hours = 14:45 UTC
- **Verify:** 14:45 UTC = 9:45 AM EST ✅

### Previous Bug
Old code was treating API times as Eastern Time and ADDING offset:
```typescript
// ❌ WRONG (old code)
const utcTimestamp = Date.UTC(year, month, day, hour, minute, second) + (5 * 60 * 60 * 1000);
// Result: 21:45 + 5 hours = 26:45 (wraps to next day) - INCORRECT
```

---

## Solution Implemented

### Backend Fix (`functions/src/utils/dateUtils.ts`)

**File:** `parseJBlankedDate()` function  
**Change:** Subtract 7-hour offset from API's base time

```typescript
export function parseJBlankedDate(dateStr: string): Date {
  // Parse: "2025.12.01 21:45:00" -> "2025-12-01T21:45:00"
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T");
  
  // Parse components
  const parts = isoFormat.split(/[-T:]/);
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]);
  const hour = parseInt(parts[3]);
  const minute = parseInt(parts[4]);
  const second = parseInt(parts[5]);
  
  // JBlanked API offset: subtract 7 hours to get UTC
  const JBLANKED_UTC_OFFSET_HOURS = 7;
  
  const apiTime = Date.UTC(year, month, day, hour, minute, second);
  const utcTimestamp = apiTime - (JBLANKED_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  
  return new Date(utcTimestamp);
}
```

**Result:**
- Stores correct UTC timestamps in Firestore
- Multi-source compatible (MQL5, Forex Factory, FXStreet all use same offset system)

### Frontend (Already Correct ✅)

**Files:** `EventModal.jsx`, `EventsTimeline2.jsx`  
**Function:** `formatTime(date, timezone)`

The frontend already correctly converts UTC to user-selected timezone:
```javascript
const formatTime = (date, timezone) => {
  // ... handle various date formats ...
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone, // User's selection from TimezoneSelector
  });
};
```

**How it works:**
1. Firestore stores: `1764600300` seconds (14:45 UTC)
2. Frontend receives: `Date` object or `Timestamp`
3. `formatTime()` converts to user's timezone:
   - America/New_York → 09:45 (9:45 AM EST)
   - Europe/London → 14:45 (2:45 PM GMT)
   - Asia/Tokyo → 23:45 (11:45 PM JST)

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. JBlanked API Response                                    │
│    "Date": "2025.12.01 21:45:00" (base time)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend: parseJBlankedDate()                             │
│    21:45 - 7 hours = 14:45 UTC                              │
│    Stored as: Timestamp(1764600300)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Firestore Storage                                        │
│    {                                                         │
│      "date": { "_seconds": 1764600300 },                    │
│      "name": "Final Manufacturing PMI",                     │
│      "source": "forex-factory"                              │
│    }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend: formatTime(date, timezone)                     │
│    User timezone: America/New_York                          │
│    14:45 UTC → 09:45 EST                                    │
│                                                              │
│    User timezone: Europe/London                             │
│    14:45 UTC → 14:45 GMT                                    │
│                                                              │
│    User timezone: Asia/Tokyo                                │
│    14:45 UTC → 23:45 JST                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Tests

### Backend Test
```bash
cd functions
npm run build
node -e "const { parseJBlankedDate } = require('./lib/utils/dateUtils'); \
  const result = parseJBlankedDate('2025.12.01 21:45:00'); \
  console.log('Parsed:', result.toISOString()); \
  console.log('Expected: 2025-12-01T14:45:00.000Z'); \
  console.log('Match:', result.toISOString() === '2025-12-01T14:45:00.000Z');"
```
**Expected output:** `Match: true`

### Frontend Test (Browser Console)
```javascript
const timestamp = 1764600300; // From Firestore
const date = new Date(timestamp * 1000);

console.log('UTC:', date.toISOString());
// Expected: 2025-12-01T14:45:00.000Z

console.log('EST:', date.toLocaleString('en-US', {timeZone: 'America/New_York'}));
// Expected: 12/1/2025, 9:45:00 AM

console.log('GMT:', date.toLocaleString('en-GB', {timeZone: 'Europe/London'}));
// Expected: 01/12/2025, 14:45:00

console.log('JST:', date.toLocaleString('en-US', {timeZone: 'Asia/Tokyo'}));
// Expected: 12/1/2025, 11:45:00 PM
```

---

## Deployment Checklist

- [x] ✅ Fix `parseJBlankedDate()` in `functions/src/utils/dateUtils.ts`
- [x] ✅ Build TypeScript: `cd functions && npm run build`
- [ ] 🔄 Deploy Firebase Functions: `firebase deploy --only functions`
- [ ] 🔄 Trigger manual re-sync to update all stored timestamps
- [ ] 🔄 Verify in browser: Events show correct times across all timezones

---

## Post-Deployment

### Manual Re-Sync Required
**Why:** Existing Firestore data has incorrect timestamps (21:45 UTC instead of 14:45 UTC)

**How to trigger:**
1. Open app in browser
2. Click **"Sync Calendar"** button in Economic Events drawer
3. Wait for sync to complete
4. Verify events now show correct times

### Testing Protocol
1. **Check EST timezone:**
   - "Final Manufacturing PMI" should show **09:45** (not 15:45)
   
2. **Change to London (GMT):**
   - Same event should show **14:45**
   
3. **Change to Tokyo (JST):**
   - Same event should show **23:45**

4. **Check multiple sources:**
   - Switch between MQL5, Forex Factory, FXStreet
   - All should show consistent times for same events

---

## Multi-Source Compatibility

✅ **Confirmed:** All sources use the same JBlanked API offset system
- **MQL5:** `offset = 7` 
- **Forex Factory:** `offset = 7`
- **FXStreet:** `offset = 7`

**Firestore structure:**
```
/economicEvents/{source}/events/{eventDocId}
```
Where `source` ∈ `['mql5', 'forex-factory', 'fxstreet']`

**Single parseJBlankedDate() handles all sources** ✅

---

## References

- **JBlanked API Docs:** https://www.jblanked.com/news/api/docs/
- **GitHub Repo:** https://github.com/jblanked/JB-News
- **Python Library Example:**
  ```python
  jb.offset = 7  # GMT-3=0, GMT=3, EST=7, PST=10
  ```
- **MQL Offset Documentation:** `int offset; // GMT-3 = 0, GMT = 3, EST = 7, PST = 10`

---

## Success Criteria

✅ Event `d8ad4654f798050c_20251201` displays as:
- **9:45 AM** in America/New_York timezone
- **2:45 PM** in Europe/London timezone  
- **11:45 PM** in Asia/Tokyo timezone

✅ All other events display correct times in all timezones

✅ New syncs store correct UTC timestamps in Firestore

---

**Status:** Ready for deployment 🚀
