# API Timezone Analysis - CRITICAL FINDINGS

**Date:** December 1, 2025  
**Event:** Final Manufacturing PMI (USD)  
**Expected Time:** 09:45 EST (per Forex Factory)

---

## 🔍 API Response Analysis

### Raw API Data (from JBlanked):
```json
{
    "Name": "Final Manufacturing PMI",
    "Currency": "USD",
    "Date": "2025.12.01 16:45:00",  ← RAW API TIME
    "Actual": 52.2,
    "Forecast": 51.9,
    "Previous": 51.9
}
```

---

## 📊 Conversion Calculations

### Backend v1.6.0 Conversion (7-hour subtraction):
```
API Input:    16:45:00 (interpreted as GMT+7)
Subtract 7h:  16:45 - 7 = 09:45 UTC
Convert EST:  09:45 UTC - 5 = 04:45 EST  ❌ WRONG!
```

### What Firestore Currently Has:
```
Timestamp:    1764561600
UTC Time:     2025-12-01 04:00:00 UTC
EST Time:     2025-11-30 23:00:00 EST  (previous day!)
Display:      23:00 or 03:45 (timezone confusion)
```

### Expected Result:
```
Forex Factory: 09:45 EST
UTC Time:      14:45 UTC
Timestamp:     1764600300
```

---

## 🧮 Timestamp Math

| Description | Timestamp | UTC Time | EST Time | Calculation |
|-------------|-----------|----------|----------|-------------|
| **Expected (Correct)** | 1764600300 | 14:45 UTC | 09:45 EST | API: 21:45 - 7h = 14:45 UTC |
| **Backend v1.6.0 Result** | 1764582300 | 09:45 UTC | 04:45 EST | API: 16:45 - 7h = 09:45 UTC |
| **Firestore Current** | 1764561600 | 04:00 UTC | 23:00 EST | API: 11:00 - 7h = 04:00 UTC |

**Time Differences:**
- Expected vs Backend v1.6.0: 18000 seconds (5.0 hours)
- Expected vs Firestore: 38700 seconds (10.75 hours)
- Backend v1.6.0 vs Firestore: 20700 seconds (5.75 hours)

---

## ❌ Problem Identification

### Issue #1: API Time Changed or Never Was 21:45
**Evidence:**
- Current API returns: `16:45:00`
- Expected API input (per backend v1.6.0): `21:45:00`
- **Conclusion:** API is NOT returning 21:45!

### Issue #2: 7-Hour Offset May Be Wrong
**Hypothesis:**
- If API returns `16:45` for an event that should be `09:45 EST`
- Then: `16:45 - X hours = 09:45 EST (14:45 UTC)`
- Calculation: `16:45 - 14:45 = 2 hours` (NOT 7 hours!)

### Issue #3: Multiple Time Zone References
**Possibilities:**
1. API might be returning **EST+7** (16:45 EST + 7 = 23:45 GMT+7)
2. API might be returning **UTC+X** where X is unknown
3. API format changed between testing and production

---

## 🔬 Verification Tests

### Test 1: Check Forex Factory Directly
1. Visit: https://www.forexfactory.com/calendar
2. Find: "Final Manufacturing PMI" (USD) on Dec 1, 2025
3. Expected: 09:45 EST
4. **Need to verify:** What timezone is Forex Factory actually showing?

### Test 2: Test Other Events
Compare multiple events from API vs Forex Factory:
- EUR Final Manufacturing PMI: API shows `11:00` → Should be?
- GBP Final Manufacturing PMI: API shows `11:30` → Should be?
- JPY Final Manufacturing PMI: API shows `02:30` → Should be?

### Test 3: Calculate Correct Offset
If API shows `16:45` and should display `09:45 EST (14:45 UTC)`:
- UTC result needed: 14:45
- API shows: 16:45
- **Offset:** 16:45 - 14:45 = **2 hours** (not 7!)

---

## 💡 Possible Solutions

### Solution A: Change Offset from 7 to 2 Hours
```typescript
// functions/src/utils/dateUtils.ts
const JBLANKED_OFFSET_HOURS = 2; // Change from 7 to 2
const utcTimestamp = apiTime - (JBLANKED_OFFSET_HOURS * 60 * 60 * 1000);
```

**Result:**
- API: 16:45 - 2h = 14:45 UTC ✅
- EST: 14:45 UTC - 5h = 09:45 EST ✅ CORRECT!

### Solution B: API Time is Actually EST, Add Hours
```typescript
// If API is returning EST times directly
const estTime = parseComponents(dateStr); // 16:45 EST
const utcTimestamp = estTime + (5 * 60 * 60 * 1000); // Add 5 hours
```

**Test This:**
- 16:45 EST + 5h = 21:45 UTC ❌ Wrong
- Doesn't match expected 14:45 UTC

### Solution C: Verify API Documentation
- Check: https://www.jblanked.com/news/api/docs/
- Look for: Timezone specification for "Date" field
- Determine: What timezone does API actually use?

---

## 🎯 Recommended Next Steps

1. **IMMEDIATE:** Check Forex Factory website manually
   - Visit calendar, find USD Final Manufacturing PMI
   - Confirm it shows 09:45 EST (or verify actual time)

2. **TEST:** Try 2-hour offset instead of 7-hour
   - Change `JBLANKED_OFFSET_HOURS = 2` in dateUtils.ts
   - Deploy and re-sync
   - Verify: 16:45 - 2h = 14:45 UTC = 09:45 EST ✅

3. **VERIFY:** Check JBlanked API documentation
   - Find timezone specification
   - Confirm what "Date" field represents
   - Update conversion logic accordingly

4. **COMPARE:** Test multiple events across timezones
   - Compare API times with Forex Factory
   - Calculate offset for each event
   - Determine if offset is consistent

---

## 📝 Questions to Answer

1. **What timezone does JBlanked API actually use?**
   - Is it GMT+7?
   - Is it EST+X?
   - Is it UTC+X?

2. **Did the API format change?**
   - Was it ever returning 21:45 for this event?
   - Or was the 7-hour offset always wrong?

3. **Is the offset source-specific?**
   - Does Forex Factory use different timezone than MQL5?
   - Should offset be configurable per source?

4. **What does Forex Factory website show?**
   - Manually verify the actual event time
   - Confirm 09:45 EST is correct

---

## 🔧 Current State

**Backend Code:**
- `parseJBlankedDate()` subtracts 7 hours
- Formula: `API_TIME - 7 hours = UTC`
- Result: 16:45 - 7 = 09:45 UTC = 04:45 EST ❌

**Expected Result:**
- Should produce: 14:45 UTC = 09:45 EST
- **Gap:** 5 hours off

**Possible Fix:**
- Change offset to 2 hours
- Formula: `API_TIME - 2 hours = UTC`
- Result: 16:45 - 2 = 14:45 UTC = 09:45 EST ✅

---

**Last Updated:** December 1, 2025  
**Status:** CRITICAL - API returning different time than expected (16:45 vs 21:45)  
**Action Required:** Verify Forex Factory, test 2-hour offset, update backend
