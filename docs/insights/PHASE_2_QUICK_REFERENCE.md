/**
 * PHASE 2 QUICK REFERENCE
 * insightKeys Backfill & Runtime Generation
 * 
 * For: Claude Opus model (Phases 2-4 data layer)
 * Date: February 9, 2026
 * 
 * CRITICAL: Read INSIGHTS_ROADMAP.md Phase 2 section BEFORE starting.
 */

# Phase 2 Quick Reference: insightKeys Backfill & Runtime

## The Goal
Add `insightKeys: string[]` field to **all existing + new documents** across:
- `blogPosts/{id}` (computed from eventTags[] + currencyTags[])
- `systemActivityLog/{id}` (computed from metadata fields)
- `users/{uid}/eventNotes/{key}` (computed from note fields)

Plus deploy Firestore indexes to enable Phase 3+ queries.

---

## Phase 1 Deliverables (Already Built)

### Import These in Phase 2:

```javascript
// Computation utilities (all pure, deterministic, testable)
import {
  computeBlogInsightKeys,      // (post) => string[]
  computeActivityInsightKeys,  // (type, metadata) => string[]
  computeNoteInsightKeys,      // (note) => string[]
  normalizeKey,                // (str) => normalized
  findCanonicalSlug,           // (eventName) => slug | null
  BLOG_ECONOMIC_EVENTS,        // 25 event slugs array
  BLOG_CURRENCIES,             // 17 currency codes array
} from '../utils/insightKeysUtils';

// Type definitions for consistency
import {
  INSIGHT_SOURCE_TYPES,    // { ARTICLE, ACTIVITY, NOTE }
  ACTIVITY_SEVERITY,       // { CRITICAL, HIGH, MEDIUM, LOW }
  ACTIVITY_VISIBILITY,     // { PUBLIC, PRIVATE, ADMIN_ONLY }
} from '../types/insightsTypes';
```

---

## Task 1: Add insightKeys to blogService.js

### Location:
`src/services/blogService.js` (863 lines currently)

### Functions to Modify:
1. **publishBlogPost(post)** — When creating new post
2. **updateBlogPost(postId, updates)** — When editing post
3. **Any internal helper that writes blog data**

### Pattern:

```javascript
import { computeBlogInsightKeys } from '../utils/insightKeysUtils';

// In publishBlogPost() or updateBlogPost():
const postData = {
  // ... existing fields ...
  eventTags: post.eventTags || [],
  currencyTags: post.currencyTags || [],
  
  // NEW: Compute insightKeys from tags
  insightKeys: computeBlogInsightKeys({
    id: post.id || postId, // Document ID
    eventTags: post.eventTags,
    currencyTags: post.currencyTags,
  }),
  
  // Include timestamp for cache invalidation
  insightKeysComputedAt: serverTimestamp(),
};

// Write to Firestore
await setDoc(doc(db, 'blogPosts', postId), postData, { merge: true });
```

### Verification:
```javascript
// Test that insightKeys are computed correctly
const post = await getBlogPost('post_abc');
console.log(post.insightKeys);
// Expected: ['event:nfp', 'event:cpi', 'currency:USD', ..., 'post:post_abc']
```

---

## Task 2: Add insightKeys to Activity Logger

### Location:
`src/services/activityLogger.js` (527 lines)

### Functions to Modify:
1. **logActivity(type, metadata)** — When recording activity
2. **Any internal helper that writes log entries**

### Pattern:

```javascript
import { computeActivityInsightKeys } from '../utils/insightKeysUtils';

// In logActivity():
const logEntry = {
  id: activityId,
  userId: currentUser.uid,
  type: activityType,                    // e.g., 'event_favorited'
  metadata: {
    eventName: event.name,               // e.g., 'Non-Farm Payroll'
    currencyCode: event.currency,        // e.g., 'USD'
    postId: post?.id,                    // e.g., 'post_xyz'
    userAction: action,                  // e.g., 'note_created'
    // ... other metadata ...
  },
  
  // NEW: Compute insightKeys from metadata
  insightKeys: computeActivityInsightKeys(activityType, {
    eventName: event.name,
    currencyCode: event.currency,
    postId: post?.id,
    userAction: action,
  }),
  
  // NEW: Visibility field (Phase 7 uses this)
  visibility: determineVisibility(activityType), // PUBLIC | PRIVATE | ADMIN_ONLY
  
  timestamp: serverTimestamp(),
  insightKeysComputedAt: serverTimestamp(),
};

// Write to Firestore
await addDoc(collection(db, 'systemActivityLog'), logEntry);
```

### Visibility Logic (Preview from Phase 7):
```javascript
function determineVisibility(activityType) {
  // Most activities are PUBLIC (e.g., 'blog_post_published', 'event_favorited')
  // Some are PRIVATE (e.g., 'event_note_created')
  // Admin-only (e.g., 'system_health_check')
  
  const privateActivities = [
    'event_note_created',
    'event_note_deleted',
    'favorite_added',
    'favorite_removed',
  ];
  
  const adminActivities = [
    'system_health_check',
    'sync_job_completed',
  ];
  
  if (adminActivities.includes(activityType)) return ACTIVITY_VISIBILITY.ADMIN_ONLY;
  if (privateActivities.includes(activityType)) return ACTIVITY_VISIBILITY.PRIVATE;
  return ACTIVITY_VISIBILITY.PUBLIC;
}
```

### Verification:
```javascript
// Test that activity insightKeys are computed
const log = await getActivityLog('log_abc123');
console.log(log.insightKeys);
// Expected: ['eventNameKey:non_farm_payroll', 'currency:USD', 'eventCurrency:nfp_USD']
// Or if event name mapped: ['event:nfp', 'currency:USD', 'eventCurrency:nfp_USD']
```

---

## Task 3: Add insightKeys to Event Notes

### Location:
`src/services/eventNotesService.js` or wherever notes are saved

### Functions to Modify:
1. **createNote(note)** — When user creates note
2. **updateNote(noteId, updates)** — When user edits note

### Pattern:

```javascript
import { computeNoteInsightKeys } from '../utils/insightKeysUtils';

// In createNote() or updateNote():
const noteData = {
  userId: currentUser.uid,
  primaryNameKey: note.primaryNameKey,   // e.g., 'nfp'
  currencyKey: note.currencyKey,         // e.g., 'USD'
  dateKey: note.dateKey,                 // e.g., '2026-02-06'
  summary: note.summary,                 // User's note text
  
  // NEW: Compute insightKeys from note fields
  insightKeys: computeNoteInsightKeys({
    primaryNameKey: note.primaryNameKey,
    currencyKey: note.currencyKey,
    dateKey: note.dateKey,
  }),
  
  updatedAt: serverTimestamp(),
  insightKeysComputedAt: serverTimestamp(),
};

// Write to Firestore
// Path: users/{uid}/eventNotes/{key}
await setDoc(doc(db, 'users', currentUser.uid, 'eventNotes', noteKey), noteData, { merge: true });
```

### Verification:
```javascript
// Test that note insightKeys are computed
const note = await getEventNote(uid, 'note_abc');
console.log(note.insightKeys);
// Expected: ['event:nfp', 'currency:USD', 'eventCurrency:nfp_USD']
```

---

## Task 4: Create Backfill Script

### File Location:
`functions/src/scripts/backfillInsightKeys.ts` (TypeScript, Cloud Function context)

### Purpose:
One-time migration to add insightKeys to ALL EXISTING documents.

### Pattern:

```typescript
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

/**
 * Backfill insightKeys for all documents in a collection
 * Usage: firebase functions:shell → backfillBlogPostsInsightKeys()
 * 
 * CRITICAL: Test in dev before running in prod
 */
export async function backfillBlogPostsInsightKeys() {
  const batch = writeBatch(db);
  const postsSnap = await getDocs(collection(db, 'blogPosts'));
  let count = 0;

  for (const postDoc of postsSnap.docs) {
    const post = postDoc.data();
    
    // Skip if already has insightKeys (idempotent)
    if (post.insightKeys && post.insightKeys.length > 0) {
      console.log(`[SKIP] ${postDoc.id} - already has insightKeys`);
      continue;
    }

    const insightKeys = computeBlogInsightKeys({
      id: postDoc.id,
      eventTags: post.eventTags || [],
      currencyTags: post.currencyTags || [],
    });

    batch.update(doc(db, 'blogPosts', postDoc.id), {
      insightKeys,
      insightKeysComputedAt: new Date(),
    });
    
    count++;
    if (count % 100 === 0) console.log(`[PROGRESS] Backfilled ${count} blog posts`);
  }

  await batch.commit();
  console.log(`[COMPLETE] Backfilled ${count} blog posts with insightKeys`);
}

export async function backfillActivityLogInsightKeys() {
  // Similar pattern for systemActivityLog collection
  // Iterate, compute insightKeys, batch update
}

export async function backfillEventNotesInsightKeys() {
  // Similar pattern for users/{uid}/eventNotes subcollection
  // Requires iterating per-user
}
```

### Execution (via Firebase Shell):
```bash
cd functions
npm run build
firebase functions:shell

# In the interactive shell:
> backfillBlogPostsInsightKeys()
[PROGRESS] Backfilled 100 blog posts
[PROGRESS] Backfilled 200 blog posts
[COMPLETE] Backfilled 287 blog posts with insightKeys

> backfillActivityLogInsightKeys()
[COMPLETE] Backfilled 5241 activity log entries with insightKeys

> backfillEventNotesInsightKeys()
[COMPLETE] Backfilled 123 event notes with insightKeys
```

---

## Task 5: Deploy Firestore Indexes

### Indexes Needed:

#### Index 1: blogPosts Collection
```
Collection: blogPosts
Fields: insightKeys (Ascending)
         timestamp (Descending)
Status: REQUIRED for Phase 3 queries
```

#### Index 2: systemActivityLog Collection
```
Collection: systemActivityLog
Fields: insightKeys (Ascending)
        timestamp (Descending)
Status: REQUIRED for Phase 3 queries
```

### Deployment:

Option A (Auto): Firestore will suggest indexes in logs when queries run → Click "Create" in console

Option B (Manual): Add to `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "blogPosts",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "insightKeys", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "systemActivityLog",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "insightKeys", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## Testing Checklist (BEP)

### Unit Tests (Create `src/__tests__/insightKeysUtils.test.js`)
```javascript
describe('insightKeysUtils', () => {
  it('computeBlogInsightKeys deduplicates eventCurrency combinations', () => {
    const result = computeBlogInsightKeys({
      id: 'post_1',
      eventTags: ['nfp'],
      currencyTags: ['USD', 'USD'], // duplicate
    });
    
    const eventCurrencyKeys = result.filter(k => k.startsWith('eventCurrency:'));
    expect(eventCurrencyKeys.length).toBe(1); // Only one, not two
  });

  it('computeActivityInsightKeys falls back to eventNameKey for unmapped names', () => {
    const result = computeActivityInsightKeys('event_favorited', {
      eventName: 'Unknown Event Name',
      currencyCode: 'USD',
    });
    
    expect(result).toContain('eventNameKey:unknown_event_name');
  });

  it('normalizeKey converts spaces to underscores', () => {
    expect(normalizeKey('Non-Farm Payroll')).toBe('non_farm_payroll');
    expect(normalizeKey('  CPI  ')).toBe('cpi');
  });

  it('findCanonicalSlug matches event names against BLOG_ECONOMIC_EVENTS', () => {
    expect(findCanonicalSlug('Non-Farm Payroll')).toBe('nfp');
    expect(findCanonicalSlug('unemployment')).toBe('unemployment');
    expect(findCanonicalSlug('UNKNOWN EVENT')).toBeNull();
  });
});
```

### Integration Tests (Firestore)
```javascript
describe('insightKeys in Firestore', () => {
  it('blogPost writes include insightKeys', async () => {
    const postRef = await publishBlogPost({
      id: 'test_post_1',
      eventTags: ['nfp'],
      currencyTags: ['USD'],
    });
    
    const post = await getDoc(postRef);
    expect(post.data().insightKeys).toEqual(
      expect.arrayContaining(['event:nfp', 'currency:USD', 'eventCurrency:nfp_USD', 'post:test_post_1'])
    );
  });

  it('activity logs include insightKeys and visibility', async () => {
    await logActivity('event_favorited', {
      eventName: 'Non-Farm Payroll',
      currencyCode: 'USD',
    });
    
    const logs = await getDocs(collection(db, 'systemActivityLog'));
    const latestLog = logs.docs[logs.docs.length - 1].data();
    
    expect(latestLog.insightKeys).toBeDefined();
    expect(latestLog.visibility).toMatch(/PUBLIC|PRIVATE|ADMIN_ONLY/);
  });
});
```

### Manual Tests (BEP)
- [ ] Create new blog post with eventTags + currencyTags → Verify insightKeys added
- [ ] Favorite an event → Verify activity log has insightKeys + visibility
- [ ] Create event note → Verify insightKeys computed
- [ ] Run backfill script on dev database → Verify all docs updated
- [ ] Query via Firestore console: `insightKeys array-contains 'event:nfp'` → Verify returns correct posts
- [ ] Check Firestore indexes → Verify both new indexes active (green ✓)

---

## Phase 2 Acceptance Criteria

- [ ] blogPosts have insightKeys (runtime + backfill ✓)
- [ ] systemActivityLog has insightKeys + visibility (runtime + backfill ✓)
- [ ] eventNotes have insightKeys (runtime + backfill ✓)
- [ ] Firestore indexes deployed + active
- [ ] Queries like `insightKeys array-contains 'event:nfp'` work correctly
- [ ] Backfill scripts idempotent (safe to re-run)
- [ ] Unit + integration tests passing (>90% coverage)
- [ ] INSIGHTS_ROADMAP.md Phase 2 section marked COMPLETE ✓
- [ ] Ready for Phase 3 (Prioritization Engine)

---

## Troubleshooting

### Problem: insightKeys field is empty after update
**Solution:** Verify `computeXxxInsightKeys()` is returning non-empty array. Check if eventTags/currencyTags are populated in source data.

### Problem: Backfill script times out
**Solution:** Use batch operations (writeBatch), process in chunks of 500 docs, run during low-traffic hours.

### Problem: Firestore index still building
**Solution:** Indexes can take 5–15 min to build. Wait before running Phase 3 queries. Check Firebase Console → Firestore → Indexes.

### Problem: Activity log entries lack visibility field
**Solution:** This is OK for Phase 2 (Phase 7 will enforce). Ensure new logs include it. Backfill old logs if needed for Phase 7 testing.

---

## Next Phase (Phase 3)

After Phase 2 complete:
- Implement `insightsPrioritizationService.js` (ranking algorithm)
- Use insightKeys to group/rank items
- Test diversity constraints
- **Then proceed to Phase 4 (useInsightsFeed implementation)**

---

**Phase 2 Estimated Duration:** 2–3 days (Opus model)  
**Phase 2 Start Date:** [To be filled when Phase 2 begins]  
**Phase 2 Complete Date:** [To be filled when Phase 2 approved]

