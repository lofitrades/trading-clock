# Event Reschedule Detection - Implementation Roadmap

**Created:** February 5, 2026  
**Status:** ✅ IMPLEMENTED  
**Priority:** Critical - Fixes duplicate/stale event bug  
**Estimated Effort:** 4-6 hours  
**Completed:** February 5, 2026

---

## 📋 Executive Summary

### The Problem
When an economic event (e.g., USD NFP) is rescheduled to a different date (e.g., Feb 7 → Feb 12 due to government shutdown), the current sync logic:
1. **Fails to find the existing event** (datetime window is only ±5 minutes)
2. **Creates a duplicate** for the new date
3. **Leaves the old event as stale** (never cleaned up)

### The Solution
Implement **identity-first matching** with a **15-day window** before falling back to datetime-window matching. Track original scheduled dates and detect rescheduling.

---

## 🏗️ Architecture Overview

### Current Flow (Broken)
```
NFS Feed → Parse Event → findExistingCanonicalEvent(±5 min window)
                                    ↓
                         No match (date changed 5+ days)
                                    ↓
                         Create NEW event (duplicate!)
```

### New Flow (Fixed)
```
NFS Feed → Parse Event → findByIdentity(±15 days, same currency+name)
                                    ↓
                         Match found? → Update datetime (reschedule detected)
                                    ↓
                         No match? → findExistingCanonicalEvent(±5 min)
                                    ↓
                         Still no match? → Create NEW event (genuinely new)
```

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `functions/src/models/economicEvent.ts` | Add `originalDatetimeUtc`, `rescheduledFrom`, new identity matcher |
| `functions/src/services/nfsSyncService.ts` | Use identity-first matching, add reschedule logging |
| `functions/src/types/economicEvents.ts` | Update type definitions (if needed) |

---

## 🔧 Implementation Phases

### Phase 1: Schema Updates (economicEvent.ts)

#### 1.1 Add New Fields to CanonicalEconomicEvent Interface

```typescript
export interface CanonicalEconomicEvent {
  // ... existing fields ...
  
  // NEW: Track original scheduled date for reschedule detection
  originalDatetimeUtc?: FirebaseFirestore.Timestamp;
  
  // NEW: If rescheduled, store the previous datetime
  rescheduledFrom?: FirebaseFirestore.Timestamp;
  
  // NEW: Track if event was removed from feed (potential cancellation)
  lastSeenInFeed?: FirebaseFirestore.Timestamp;
}
```

#### 1.2 Update createEmptyCanonicalEvent()

```typescript
export function createEmptyCanonicalEvent(
  eventId: string,
  partial: Partial<CanonicalEconomicEvent> = {}
): CanonicalEconomicEvent {
  const now = admin.firestore.Timestamp.now();
  return {
    // ... existing fields ...
    originalDatetimeUtc: partial.datetimeUtc ?? now, // Set on creation
    rescheduledFrom: undefined,
    lastSeenInFeed: now,
    ...partial,
  };
}
```

#### 1.3 Add New Identity Matching Function

```typescript
/**
 * Find existing canonical event by identity (currency + normalized name)
 * within a wider time window (±15 days) for reschedule detection.
 * 
 * Use case: NFP scheduled for Feb 7 gets rescheduled to Feb 12.
 * Standard ±5 min window won't find it, but ±15 day identity match will.
 * 
 * @param params.normalizedName - Normalized event name for fuzzy matching
 * @param params.currency - Currency code (exact match required)
 * @param params.datetimeUtc - New scheduled datetime from feed
 * @param params.windowDays - Search window in days (default: 15)
 * @param params.similarityThreshold - Name similarity threshold (default: 0.85)
 * @returns Existing event if found, undefined otherwise
 */
export async function findByIdentityWindow(params: {
  normalizedName: string;
  currency: string | null;
  datetimeUtc: Timestamp;
  windowDays?: number;
  similarityThreshold?: number;
}): Promise<{eventId: string; event: CanonicalEconomicEvent; isReschedule: boolean} | undefined> {
  const currency = params.currency ? params.currency.toUpperCase() : null;
  if (!currency) return undefined;

  const windowDays = params.windowDays ?? 15;
  const similarityThreshold = params.similarityThreshold ?? 0.85;
  const millis = params.datetimeUtc.toMillis();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  // Search ±15 days from incoming datetime
  const start = Timestamp.fromMillis(millis - windowDays * msPerDay);
  const end = Timestamp.fromMillis(millis + windowDays * msPerDay);

  const snapshot = await getCanonicalEventsCollection()
    .where("currency", "==", currency)
    .where("datetimeUtc", ">=", start)
    .where("datetimeUtc", "<=", end)
    .get();

  let bestMatch: {
    eventId: string;
    event: CanonicalEconomicEvent;
    score: number;
    timeDiffMs: number;
  } | undefined;

  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;
    const matchAgainst = data.normalizedName || data.name;
    const score = computeStringSimilarity(matchAgainst, params.normalizedName);
    const timeDiffMs = Math.abs(data.datetimeUtc.toMillis() - millis);
    
    // Only consider if name matches well enough
    if (score >= similarityThreshold) {
      // Prefer exact time match, then closest time match
      if (!bestMatch || 
          (score > bestMatch.score) || 
          (score === bestMatch.score && timeDiffMs < bestMatch.timeDiffMs)) {
        bestMatch = {eventId: doc.id, event: data, score, timeDiffMs};
      }
    }
  });

  if (bestMatch) {
    // Determine if this is a reschedule (datetime differs by more than 5 minutes)
    const isReschedule = bestMatch.timeDiffMs > 5 * 60 * 1000;
    return {
      eventId: bestMatch.eventId,
      event: bestMatch.event,
      isReschedule,
    };
  }

  return undefined;
}
```

#### 1.4 Update mergeProviderEvent() for Reschedule Handling

Add reschedule detection and tracking to the merge function:

```typescript
export function mergeProviderEvent(
  canonical: CanonicalEconomicEvent | undefined,
  incoming: {
    // ... existing params ...
  },
  options?: {
    isReschedule?: boolean; // NEW: Flag indicating this is a date change
  }
): CanonicalEconomicEvent {
  // ... existing logic ...

  // NEW: Handle reschedule detection
  if (options?.isReschedule && canonical) {
    const existingMillis = canonical.datetimeUtc.toMillis();
    const incomingMillis = incoming.datetimeUtc.toMillis();
    
    // Only track as reschedule if datetime actually changed significantly (>5 min)
    if (Math.abs(existingMillis - incomingMillis) > 5 * 60 * 1000) {
      merged = {
        ...merged,
        rescheduledFrom: canonical.datetimeUtc, // Store old datetime
        datetimeUtc: incoming.datetimeUtc,      // Update to new datetime
        timezoneSource: incoming.provider,
      };
      
      // Preserve original datetime if not already set
      if (!merged.originalDatetimeUtc) {
        merged.originalDatetimeUtc = canonical.datetimeUtc;
      }
    }
  }

  // NEW: Track last seen in feed
  merged.lastSeenInFeed = now;

  // ... rest of existing logic ...
}
```

---

### Phase 2: Update NFS Sync Service (nfsSyncService.ts)

#### 2.1 Import New Function

```typescript
import {
  CanonicalEconomicEvent,
  findExistingCanonicalEvent,
  findByIdentityWindow,  // NEW
  getCanonicalEventsCollection,
  mergeProviderEvent,
  normalizeEventName,
} from "../models/economicEvent";
```

#### 2.2 Update syncWeekFromNfs() - Identity-First Matching

Replace the current matching logic with two-phase approach:

```typescript
export async function syncWeekFromNfs(): Promise<void> {
  // ... existing fetch and parse logic ...

  for (const raw of payload) {
    processed += 1;
    try {
      const rawName = raw.title || "";
      const normalizedName = normalizeEventName(rawName);
      const currency = raw.country ? raw.country.trim().toUpperCase() : null;
      if (!raw.date) {
        logger.warn("⚠️ Skipping NFS event with missing date", {title: rawName});
        continue;
      }
      const datetimeUtc = parseNfsDateToTimestamp(raw.date);
      const status: "scheduled" = "scheduled";

      // ========== NEW: Two-Phase Matching ==========
      
      // Phase 1: Identity match (±15 days) - catches reschedules
      let existingMatch = await findByIdentityWindow({
        normalizedName,
        currency,
        datetimeUtc,
        windowDays: 15,
        similarityThreshold: 0.85,
      });
      
      let isReschedule = existingMatch?.isReschedule ?? false;
      
      // Phase 2: Narrow datetime match (±5 min) - for new events with similar times
      if (!existingMatch) {
        const narrowMatch = await findExistingCanonicalEvent({
          normalizedName,
          currency,
          datetimeUtc,
        });
        if (narrowMatch) {
          existingMatch = {
            eventId: narrowMatch.eventId,
            event: narrowMatch.event,
            isReschedule: false,
          };
        }
      }
      
      // ========== Reschedule Logging ==========
      if (isReschedule && existingMatch) {
        const oldDate = existingMatch.event.datetimeUtc.toDate();
        const newDate = datetimeUtc.toDate();
        logger.info("📅 EVENT RESCHEDULED DETECTED", {
          eventName: rawName,
          currency,
          oldDatetime: oldDate.toISOString(),
          newDatetime: newDate.toISOString(),
          daysDiff: Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24)),
        });
      }
      
      // ========== Rest of existing logic ==========
      
      // Use Firestore auto ID if no match found, otherwise use existing event ID
      const eventId = existingMatch?.eventId ?? collection.doc().id;

      const existingDoc = existingMatch?.event ??
        (await collection.doc(eventId).get()).data() as CanonicalEconomicEvent | undefined;

      const merged = mergeProviderEvent(
        existingDoc,
        {
          provider: "nfs",
          eventId,
          originalName: rawName,
          normalizedName,
          currency,
          datetimeUtc,
          impact: raw.impact ?? null,
          category: null,
          forecast: raw.forecast != null ? String(raw.forecast) : null,
          previous: raw.previous != null ? String(raw.previous) : null,
          actual: null,
          status,
          raw,
          parsedExtras: {},
        },
        { isReschedule } // NEW: Pass reschedule flag
      );

      // ... rest of existing validation and batch logic ...
    } catch (error) {
      logger.error("❌ Error processing NFS event", {error, raw});
    }
  }

  // ... existing batch write logic ...
}
```

---

### Phase 3: Stale Event Detection (Optional Enhancement)

Add a post-sync check to identify events that may have been cancelled:

```typescript
/**
 * Mark events as potentially cancelled if they:
 * 1. Were previously seen in NFS feed (has nfs source)
 * 2. Have future datetimes
 * 3. Haven't been seen in feed for 3+ days
 * 
 * Called after weekly sync completes.
 */
export async function detectStaleEvents(): Promise<void> {
  const now = admin.firestore.Timestamp.now();
  const threeDaysAgo = Timestamp.fromMillis(now.toMillis() - 3 * 24 * 60 * 60 * 1000);
  
  const collection = getCanonicalEventsCollection();
  
  // Find future events with NFS source that haven't been seen recently
  const snapshot = await collection
    .where("datetimeUtc", ">", now)
    .where("lastSeenInFeed", "<", threeDaysAgo)
    .get();
  
  let staleCount = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data() as CanonicalEconomicEvent;
    // Only flag if event has NFS source (was from Forex Factory)
    if (data.sources?.nfs) {
      logger.warn("⚠️ POTENTIALLY STALE EVENT", {
        eventId: doc.id,
        name: data.name,
        currency: data.currency,
        scheduledFor: data.datetimeUtc.toDate().toISOString(),
        lastSeenInFeed: data.lastSeenInFeed?.toDate().toISOString(),
      });
      staleCount++;
    }
  });
  
  if (staleCount > 0) {
    logger.info("🔍 Stale event detection complete", {staleCount});
  }
}
```

---

## 🧪 Test Cases

### Test Case 1: Event Rescheduled Within 15 Days
**Setup:**
- Existing event: USD NFP, Feb 7, 2026 @ 13:30 UTC
- Incoming feed: USD NFP, Feb 12, 2026 @ 13:30 UTC

**Expected:**
- ✅ Finds existing event via identity match
- ✅ Updates `datetimeUtc` to Feb 12
- ✅ Sets `rescheduledFrom` to Feb 7
- ✅ Logs: "📅 EVENT RESCHEDULED DETECTED"
- ✅ NO duplicate created

### Test Case 2: New Event (No Match)
**Setup:**
- No existing events for this currency/name
- Incoming feed: GBP MPC Meeting, Feb 10, 2026 @ 12:00 UTC

**Expected:**
- ✅ No identity match (new event)
- ✅ No narrow match (new event)
- ✅ Creates new canonical event with auto-generated ID
- ✅ Sets `originalDatetimeUtc` to Feb 10

### Test Case 3: Minor Time Adjustment (≤5 min)
**Setup:**
- Existing event: EUR CPI, Feb 8, 2026 @ 10:00:00 UTC
- Incoming feed: EUR CPI, Feb 8, 2026 @ 10:03:00 UTC (3 min later)

**Expected:**
- ✅ Finds via identity match (same day, same name)
- ✅ `isReschedule = false` (time diff ≤ 5 min)
- ✅ Updates datetime to 10:03 (higher priority source wins)
- ✅ NO `rescheduledFrom` set

### Test Case 4: Monthly Recurring Event (Should NOT Match)
**Setup:**
- Existing event: USD NFP, Jan 10, 2026 @ 13:30 UTC (last month)
- Incoming feed: USD NFP, Feb 7, 2026 @ 13:30 UTC (this month)

**Expected:**
- ✅ Identity search window is ±15 days from Feb 7
- ✅ Jan 10 is 28 days before Feb 7 (outside window)
- ✅ NO match found
- ✅ Creates new event for Feb 7 (correct behavior)

### Test Case 5: Edge Case - Name Similarity Below Threshold
**Setup:**
- Existing event: USD "Nonfarm Payrolls", Feb 7, 2026
- Incoming feed: USD "Employment Situation", Feb 12, 2026

**Expected:**
- ✅ Name similarity likely < 85% (different wording)
- ✅ NO identity match
- ✅ Creates new event (these might be different events)

---

## 🔄 Rollback Plan

If issues arise after deployment:

1. **Immediate:** Revert to previous Cloud Functions version:
   ```bash
   firebase functions:delete syncWeekFromNfsNow
   firebase deploy --only functions:syncWeekFromNfsNow
   ```

2. **Data Fix:** New fields (`originalDatetimeUtc`, `rescheduledFrom`, `lastSeenInFeed`) are optional and backwards-compatible. No data migration needed for rollback.

3. **Duplicate Cleanup:** If duplicates were created before fix:
   ```typescript
   // Manual cleanup script to merge duplicates
   // Find events with same currency + normalizedName within ±15 days
   // Keep the one with most recent lastSeenInFeed, delete others
   ```

---

## 📊 Monitoring

After deployment, monitor Cloud Functions logs for:

1. **Reschedule detections:** Search for "📅 EVENT RESCHEDULED DETECTED"
2. **Stale events:** Search for "⚠️ POTENTIALLY STALE EVENT"
3. **Error rates:** Ensure no increase in "❌ Error processing NFS event"

### Success Metrics
- Zero duplicate events for rescheduled releases
- Reschedule detections logged correctly
- No regression in sync performance (batch writes should remain similar)

---

## 📝 Implementation Checklist

- [x] **Phase 1.1:** Add new fields to `CanonicalEconomicEvent` interface
- [x] **Phase 1.2:** Update `createEmptyCanonicalEvent()` with new fields
- [x] **Phase 1.3:** Implement `findByIdentityWindow()` function
- [x] **Phase 1.4:** Update `mergeProviderEvent()` for reschedule handling
- [x] **Phase 2.1:** Import new function in nfsSyncService.ts
- [x] **Phase 2.2:** Update `syncWeekFromNfs()` with two-phase matching
- [x] **Phase 3:** Implement `detectStaleEvents()` function + call after sync
- [x] **Test:** TypeScript build passes
- [x] **Deploy Backend:** `firebase deploy --only functions` ✅ Feb 5, 2026
- [x] **Verify:** Trigger manual sync - 4 events marked cancelled (NFP, Avg Hourly Earnings, Unemployment Rate, etc.)
- [x] **Phase 4:** Frontend filter - Exclude `status: "cancelled"` events from calendar display
- [x] **Deploy Frontend:** `firebase deploy --only hosting` ✅ Feb 5, 2026
- [ ] **Monitor:** Watch for reschedule detections over next week

---

## 🎯 Summary

| Aspect | Before | After |
|--------|--------|-------|
| Matching window | ±5 minutes only | ±15 days (identity) + ±5 min (fallback) |
| Reschedule detection | ❌ None | ✅ Logged with old/new dates |
| Duplicate prevention | ❌ Fails for date changes | ✅ Identity match prevents duplicates |
| Original date tracking | ❌ None | ✅ `originalDatetimeUtc` preserved |
| Stale event detection | ❌ None | ✅ Optional: `lastSeenInFeed` tracking |

**End Result:** When NFP moves from Feb 7 to Feb 12, the system will:
1. Find the existing Feb 7 event via identity match
2. Update its `datetimeUtc` to Feb 12
3. Store Feb 7 in `rescheduledFrom`
4. Log the reschedule clearly
5. NOT create a duplicate

---

**Ready for implementation approval.**
