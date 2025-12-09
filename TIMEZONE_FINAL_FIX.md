# Timezone Final Fix - December 1, 2025

## 🚨 Critical Issues Fixed

### Issue #1: Backend Timezone Conversion (CRITICAL)
**Problem:** Firestore timestamps are 5 hours off  
**Example:** Event showing `03:45 EST` should show `09:45 EST`

**Root Cause:**  
Backend `parseJBlankedDate()` was **subtracting 7 hours** from API time, but JBlanked API returns times **in EST**, not UTC+7.

**Fix Applied:**
```typescript
// ❌ OLD (WRONG): Subtract 7 hours
const utcTimestamp = apiTime - (7 * 60 * 60 * 1000);

// ✅ NEW (CORRECT): Add 5 hours (EST to UTC)
const etOffsetHours = isEST ? 5 : 4; // EST=UTC-5, EDT=UTC-4
const utcTimestamp = apiTime + (etOffsetHours * 60 * 60 * 1000);
```

**File Modified:** `functions/src/utils/dateUtils.ts` (v1.4.0)

**Impact:**  
- All existing Firestore data is incorrect (5 hours off)
- After deployment + re-sync, all times will be correct
- Example: `09:45 EST` → stored as `14:45 UTC` → displays correctly in any timezone

---

### Issue #2: Frontend Timezone Updates (UI BUG)
**Problem:** Changing timezone in TimezoneSelector doesn't update event times  
**Affected:** Both authenticated and guest users

**Root Cause:**  
`EventsTimeline2` component is **staying mounted** (for performance), but React isn't detecting timezone changes to trigger re-render of memoized `TimeChip` components.

**Why This Happens:**
1. `EconomicEvents` component uses `display: none` when closed (stays mounted)
2. `TimeChip` is memoized with `React.memo()`
3. When timezone changes, React shallow-compares props
4. BUT the component tree might not be re-rendering properly

**Solution Options:**

#### Option A: Force Re-render with Key (RECOMMENDED)
Add a key to EventsTimeline2 based on timezone:
```jsx
// In EconomicEvents.jsx
<EventsTimeline2 
  key={timezone}  // ✅ Force new instance when timezone changes
  events={events} 
  loading={loading}
  onVisibleCountChange={handleVisibleCountChange}
  timezone={timezone}
/>
```

#### Option B: Remove Memoization from TimeChip
```jsx
// In EventsTimeline2.jsx
const TimeChip = ({ time, isPast, isNext, isNow, timezone }) => {
  // Remove React.memo() wrapper
```

#### Option C: Custom Comparison Function
```jsx
const TimeChip = memo(
  ({ time, isPast, isNext, isNow, timezone }) => { /* ... */ },
  (prevProps, nextProps) => {
    // Only re-render if props actually changed
    return (
      prevProps.time === nextProps.time &&
      prevProps.isPast === nextProps.isPast &&
      prevProps.isNext === nextProps.isNext &&
      prevProps.isNow === nextProps.isNow &&
      prevProps.timezone === nextProps.timezone
    );
  }
);
```

---

## 📋 Deployment Checklist

### Step 1: Deploy Backend Fix
```bash
cd functions
npm run build  # ✅ COMPLETED
firebase deploy --only functions
```

### Step 2: Apply Frontend Fix
Choose Option A (recommended):
```jsx
// src/components/EconomicEvents.jsx (Line ~744)
<EventsTimeline2 
  key={timezone}  // ADD THIS LINE
  events={events} 
  loading={loading}
  onVisibleCountChange={handleVisibleCountChange}
  timezone={timezone}
/>
```

### Step 3: Re-sync Firestore Data
**CRITICAL:** All existing data in Firestore is 5 hours off!

1. Open Economic Events drawer
2. Click "Initial Sync" button
3. Enter password: `9876543210`
4. Wait for sync to complete (2 years of data)
5. Verify times are correct

---

## ✅ Verification Steps

### Backend Verification
```javascript
// Test in browser console
const timestamp = 1764600300; // Should be 9:45 AM EST
const date = new Date(timestamp * 1000);
console.log(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
// Expected: "12/1/2025, 9:45:00 AM"
```

### Frontend Verification
1. Open Economic Events
2. Select "America/New_York" timezone
3. Find "Final Manufacturing PMI" event (ID: d8ad4654f798050c_20251201)
4. Verify it shows `09:45`
5. Change timezone to "Europe/London"
6. Verify same event now shows `14:45`
7. Change timezone to "Asia/Tokyo"
8. Verify same event now shows `23:45`

---

## 📊 Technical Details

### JBlanked API Behavior
- **API Returns:** Times in EST (Eastern Standard Time)
- **Format:** "YYYY.MM.DD HH:MM:SS" (e.g., "2025.12.01 09:45:00")
- **Timezone:** Always EST, regardless of season (does NOT switch to EDT)
- **Conversion:** EST = UTC-5, so add 5 hours to get UTC

### Firestore Storage
- **Format:** Timestamp object (seconds + nanoseconds)
- **Timezone:** Always UTC
- **Example:** 
  - Event at 9:45 AM EST
  - Stored as 1764600300 seconds (14:45 UTC)
  - Displayed in user's selected timezone

### Frontend Display
- **Input:** Firestore Timestamp (UTC)
- **Conversion:** `toLocaleTimeString()` with `timeZone` option
- **Output:** User-selected timezone
- **Updates:** Should update when timezone changes (currently broken)

---

## 🐛 Known Issues After Fix

### Issue: Component Not Re-rendering
**Status:** Requires frontend fix (Option A recommended)  
**Workaround:** Refresh browser after changing timezone  
**Permanent Fix:** Add `key={timezone}` to EventsTimeline2

---

## 📝 File Changelog

### Backend
- `functions/src/utils/dateUtils.ts` v1.4.0
  - Fixed: Now adds 5 hours (EST→UTC) instead of subtracting 7
  - Added: EST/EDT detection for daylight saving
  - Updated: JSDoc comments with correct explanation

### Frontend (Pending)
- `src/components/EconomicEvents.jsx` (needs update)
  - Add: `key={timezone}` to EventsTimeline2 component
  - Impact: Forces re-render when timezone changes

### Data
- **All Firestore data needs re-sync** (2 years historical + 30 days forward)
- Estimated time: 5-10 minutes
- API cost: ~9 credits (3 sources × 3 credits each)

---

## 🎯 Success Criteria

1. ✅ Backend compiles without errors
2. ⏳ Backend deployed to Firebase Functions
3. ⏳ Frontend fix applied (key prop)
4. ⏳ Firestore data re-synced
5. ⏳ Timezone changes update event times immediately
6. ⏳ All times match Forex Factory (9:45 AM EST)

---

**Last Updated:** December 1, 2025  
**Status:** Backend built, awaiting deployment + frontend fix
