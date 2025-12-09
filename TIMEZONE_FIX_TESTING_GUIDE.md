# Timezone Fix - Testing Guide

**Date:** December 1, 2025  
**Purpose:** Verify the timezone fix is working correctly

---

## Pre-Deployment Verification

### 1. Backend Test (Local)
```bash
cd functions
npm run build
node -e "const { parseJBlankedDate } = require('./lib/utils/dateUtils'); const result = parseJBlankedDate('2025.12.01 21:45:00'); console.log('Result:', result.toISOString()); console.log('Expected: 2025-12-01T14:45:00.000Z'); console.log('PASS:', result.toISOString() === '2025-12-01T14:45:00.000Z');"
```

**Expected Output:**
```
Result: 2025-12-01T14:45:00.000Z
Expected: 2025-12-01T14:45:00.000Z
PASS: true
```

---

## Post-Deployment Testing

### Step 1: Deploy Backend
```bash
cd functions
firebase deploy --only functions
```

Wait for: `✔ Deploy complete!`

### Step 2: Trigger Manual Sync

1. Open app: https://lofitrades.github.io/trading-clock/
2. Log in (or continue as guest)
3. Click **Economic Events** icon (calendar icon, bottom-right)
4. Click **Sync Calendar** button
5. Wait for success message: "✅ Sync completed successfully"
6. Check browser console for: `✅ Manual sync result:` with count

### Step 3: Verify Event Times

#### Test Event: "Final Manufacturing PMI" (USD) - Dec 1, 2025

**Expected Behavior:**

| Timezone | Expected Display | Current (Broken) |
|----------|-----------------|------------------|
| America/New_York (EST) | **09:45** | 15:45 ❌ |
| Europe/London (GMT) | **14:45** | 21:45 ❌ |
| Asia/Tokyo (JST) | **23:45** | 06:45 (next day) ❌ |

**Testing Steps:**

1. **Set timezone to EST:**
   - Click timezone selector (bottom center)
   - Type: "New York"
   - Select: "(UTC-05:00) America/New_York"
   - Check event displays: **09:45** ✅

2. **Set timezone to GMT:**
   - Change timezone to "London"
   - Select: "(UTC+00:00) Europe/London"
   - Check event displays: **14:45** ✅

3. **Set timezone to JST:**
   - Change timezone to "Tokyo"
   - Select: "(UTC+09:00) Asia/Tokyo"
   - Check event displays: **23:45** ✅

---

## Browser Console Tests

### Verify Firestore Timestamp

Open browser console and run:

```javascript
// Check if new timestamps are correct
const testEventId = 'd8ad4654f798050c_20251201';

// This will be available after opening EventModal or EventsTimeline
// Check the eventsCache or query Firestore directly

// Manual check:
const correctTimestamp = 1764600300; // 14:45 UTC
const wrongTimestamp = 1764625500;   // 21:45 UTC (old bug)

const correctDate = new Date(correctTimestamp * 1000);
console.log('Correct timestamp:', correctTimestamp);
console.log('As UTC:', correctDate.toISOString());
console.log('As EST:', correctDate.toLocaleString('en-US', {timeZone: 'America/New_York'}));
console.log('Expected EST: 12/1/2025, 9:45:00 AM');
```

**Expected Output:**
```
Correct timestamp: 1764600300
As UTC: 2025-12-01T14:45:00.000Z
As EST: 12/1/2025, 9:45:00 AM
Expected EST: 12/1/2025, 9:45:00 AM
```

---

## Multi-Source Testing

Test events from each source to ensure consistency:

### MQL5 Events
1. Switch news source to "MQL5"
2. Find any event (e.g., "CPI m/m")
3. Note the displayed time
4. Switch timezones - verify times adjust correctly

### Forex Factory Events  
1. Switch news source to "Forex Factory"
2. Find "Final Manufacturing PMI"
3. Verify: 09:45 in EST, 14:45 in GMT, 23:45 in JST

### FXStreet Events
1. Switch news source to "FXStreet"
2. Find any event
3. Verify times convert correctly across timezones

---

## Troubleshooting

### If times are still wrong:

#### Problem 1: Old timestamps in Firestore
**Symptom:** Events still show 15:45 instead of 09:45 in EST  
**Cause:** Manual sync didn't update existing events  
**Solution:**
1. Open browser console
2. Run cache invalidation: `localStorage.clear()`
3. Refresh page (Ctrl+F5)
4. Click "Sync Calendar" again
5. Wait for completion

#### Problem 2: Functions not deployed
**Symptom:** Deployment said "No changes detected"  
**Cause:** TypeScript wasn't compiled or changes not detected  
**Solution:**
```bash
cd functions
rm -rf lib  # Force rebuild
npm run build
firebase deploy --only functions --force
```

#### Problem 3: Cache issue
**Symptom:** Some events correct, others wrong  
**Cause:** Browser or service worker caching old data  
**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Clear application cache:
   - Open DevTools (F12)
   - Application tab → Clear storage → Clear site data
3. Re-sync calendar

---

## Success Checklist

- [ ] Backend deployed successfully
- [ ] Manual sync completed (12,966 events synced)
- [ ] "Final Manufacturing PMI" shows 09:45 in EST timezone
- [ ] Same event shows 14:45 in GMT timezone
- [ ] Same event shows 23:45 in JST timezone
- [ ] Multiple events tested across all 3 sources
- [ ] EventModal displays correct times
- [ ] EventsTimeline2 displays correct times
- [ ] TimeChip (if visible) displays correct time
- [ ] Browser console shows no timezone-related errors

---

## Rollback Plan

If the fix causes issues:

### Option 1: Revert Code
```bash
cd functions
git checkout HEAD~1 src/utils/dateUtils.ts
npm run build
firebase deploy --only functions
```

### Option 2: Restore from Git
```bash
git log --oneline  # Find commit before timezone fix
git revert <commit-hash>
cd functions
npm run build
firebase deploy --only functions
```

### Option 3: Emergency Hotfix
Temporarily disable sync:
1. Comment out sync button in EconomicEvents.jsx
2. Deploy frontend: `npm run deploy`
3. Fix backend offline
4. Re-deploy both when ready

---

## Performance Check

After successful deployment:

1. **Sync speed:** Should complete within 30-60 seconds
2. **Memory usage:** Check browser console for memory leaks
3. **Event count:** Verify 12,966 events (or current expected count)
4. **Firestore reads:** Monitor Firebase console for unexpected spikes
5. **Function execution:** Check Cloud Functions logs for errors

---

## Sign-Off

Test completed by: ___________________  
Date: ___________________  
All tests passed: ☐ Yes ☐ No

Issues found:
- [ ] None
- [ ] _________________________________
- [ ] _________________________________

Approved for production: ☐ Yes ☐ No

---

**Next Steps:**
- [ ] Monitor Firebase Console for 24 hours
- [ ] Check user reports for timezone issues
- [ ] Update kb/kb.md with timezone fix details
- [ ] Close GitHub issue (if exists)
- [ ] Update CHANGELOG.md
