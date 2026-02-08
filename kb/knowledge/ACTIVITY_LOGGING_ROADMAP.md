# Activity Logging System - Implementation Roadmap

**Version:** 1.8.0  
**Created:** February 5, 2026  
**Updated:** February 5, 2026  
**Purpose:** Track implementation of unified admin activity logging across Time 2 Trade  
**Status:** 🟡 In Progress (Phases 1-8.0 Complete, Phase 8.1 In Progress)

---

## Overview

Implement a comprehensive activity logging system that provides admin/superadmin visibility into all system events - both frontend (user actions) and backend (Cloud Functions jobs).

### Goals
- ✅ Single Firestore collection for all activity (`systemActivityLog`)
- ✅ Real-time dashboard visibility for admins
- ✅ Frontend activity logger for client-side events
- ✅ Backend logging for all sync services
- ✅ Deduplication to prevent duplicate logs
- ⬜ User engagement tracking (optional, privacy-conscious)

### Non-Goals
- Analytics replacement (use Firebase Analytics for that)
- User-facing activity feed
- Rate limiting / quota management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard (/admin)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Stats Cards │  │ Sync Status │  │ Activity Feed       │  │
│  └─────────────┘  └─────────────┘  │ (Real-time onSnap)  │  │
│                                     └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Firestore: systemActivityLog                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ { type, title, description, severity, metadata,       │  │
│  │   createdAt, source: 'frontend'|'backend' }           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    ▲                       ▲
                    │                       │
     ┌──────────────┴──────────┐   ┌───────┴───────────────┐
     │   Frontend Logger       │   │   Backend Logger      │
     │   (activityLogger.js)   │   │   (activityLogging    │
     │                         │   │    Service.ts)        │
     │ • Blog CMS actions      │   │ • NFS sync            │
     │ • Custom events CRUD    │   │ • JBlanked sync       │
     │ • User signups          │   │ • GPT uploads         │
     │ • Settings changes      │   │ • Scheduled jobs      │
     └─────────────────────────┘   └───────────────────────┘
```

---

## Activity Types

| Type | Source | Trigger | Priority |
|------|--------|---------|----------|
| `sync_completed` | Backend | NFS/JBlanked sync success | P0 ✅ |
| `sync_failed` | Backend | NFS/JBlanked sync error | P0 ✅ |
| `event_rescheduled` | Backend | Date change detected | P0 ✅ |
| `event_cancelled` | Backend | Stale event marked | P0 ✅ |
| `event_created` | Frontend | User creates custom event | P1 ✅ |
| `event_updated` | Frontend | User edits custom event | P1 ✅ |
| `event_deleted` | Frontend | User deletes custom event | P1 ✅ |
| `event_reinstated` | Backend | Cancelled event reappears | P1 |
| `blog_created` | Frontend | New blog post draft | P1 ✅ |
| `blog_published` | Frontend | Blog post goes live | P1 ✅ |
| `blog_updated` | Frontend | Blog post edited | P2 ✅ |
| `blog_deleted` | Frontend | Blog post removed | P2 ✅ |
| `user_signup` | Frontend | New user registration | P1 |
| `gpt_upload` | Frontend | GPT events uploaded | P1 |
| `settings_changed` | Frontend | User settings updated | P3 |

**Priority Legend:**
- P0 = Critical (already implemented)
- P1 = High (this phase)
- P2 = Medium (next phase)
- P3 = Low (future)

---

## Phase 1: Foundation ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Deliverables
- [x] Backend activity logging service (`functions/src/services/activityLoggingService.ts`)
- [x] NFS sync logging integration
- [x] Firestore security rules for `systemActivityLog`
- [x] Admin Dashboard page (`/admin`)
- [x] Real-time activity feed with `onSnapshot`
- [x] Activity type filtering (All, Syncs, Events, Blog, Users)
- [x] Sync Status Card with error details

### Files Created/Modified
- `functions/src/services/activityLoggingService.ts` - v1.0.0
- `functions/src/services/nfsSyncService.ts` - v1.5.0
- `src/pages/AdminDashboardPage.jsx` - v1.1.0
- `src/services/adminActivityService.js` - v1.0.0
- `firestore.rules` - v1.8.0

---

## Phase 2: Frontend Activity Logger ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Create a reusable frontend logging service that any component can call to log admin-visible activities.

### Deliverables
- [x] Frontend logger service (`src/services/activityLogger.js`) - v1.0.0
- [x] Firestore rules updated for authenticated user writes (v1.9.0)
- [x] Admin Dashboard enhanced with source filtering
- [x] Activity items display user context and source badges

### Tasks Completed

#### 2.1 Create Frontend Logger Service ✅
- [x] Created `src/services/activityLogger.js` with full API
- [x] Mirrors backend activity types (EVENT_CREATED, BLOG_PUBLISHED, etc.)
- [x] Adds `source: 'frontend'` to distinguish from backend logs
- [x] Includes user context (uid, email, displayName) in metadata
- [x] Specialized functions: logEventCreated, logBlogPublished, logGptUpload, etc.
- [x] Graceful error handling (doesn't break main app if logging fails)

#### 2.2 Update Firestore Rules ✅
- [x] Updated to v1.9.0
- [x] Allow authenticated users to `create` activities
- [x] Validate required fields on write (type, title, description, createdAt)
- [x] Superadmin-only `update` and `delete`
- [x] Maintains read restriction for admin/superadmin

#### 2.3 Update Admin Dashboard ✅
- [x] Added dual filter system: Type filters + Source filters
- [x] Type filters: All, Syncs, Events, Blog, Users (with counts)
- [x] Source filters: All Sources, Frontend (Person icon), Backend (Storage icon)
- [x] Activity items show source badge (blue for Backend, green for Frontend)
- [x] Display user info for frontend activities (by {displayName})
- [x] Updated version to v1.2.0
- [x] Added new icons: StorageIcon, PersonIcon

### Files Created/Modified
- `src/services/activityLogger.js` - v1.0.0 (NEW)
- `firestore.rules` - v1.9.0
- `src/pages/AdminDashboardPage.jsx` - v1.2.0

---

## Phase 3: JBlanked Sync Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Add activity logging to JBlanked sync service, mirroring NFS implementation.

### Deliverables
- [x] Activity logging integrated into jblankedActualsService.ts - v1.4.0
- [x] Logs `sync_completed` on successful sync with event counts
- [x] Logs `sync_failed` on errors with error messages
- [x] API key missing scenario logged as failure
- [x] Fetch errors logged to activity trail
- [x] TypeScript compilation verified

### Tasks Completed

#### 3.1 JBlanked Activity Logging ✅
- [x] Imported `logSyncCompleted` and `logSyncFailed` from activityLoggingService
- [x] Added error logging for missing API key
- [x] Added error logging for fetch failures
- [x] Added `logSyncCompleted` call after successful sync
- [x] Includes provider name, processed/merged/written counts
- [x] Updated changelog to v1.4.0

### Files Modified
- `functions/src/services/jblankedActualsService.ts` - v1.4.0 (Added logging)

---

## Phase 3.5: Deduplication Fix ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Problem
Activity logs were being duplicated in the dashboard. Each sync created multiple entries because:
1. Cloud Functions may retry on transient failures
2. Using `add()` generates random document IDs, causing duplicates
3. No idempotency for sync operations

### Solution: Deterministic Document IDs
Instead of using `add()` (random IDs), now using `set()` with deterministic IDs:

```typescript
// Format: {type}_{date}_{dedupeKey}
// Examples:
// sync_completed_2026-02-05_nfs
// event_rescheduled_2026-02-05_NonFarm_Payrolls_2026-02-07
// blog_published_2026-02-05_abc123
```

### Deduplication Strategy by Activity Type

| Activity Type | Dedupe Key | Behavior |
|---------------|------------|----------|
| `sync_completed` | source (nfs, jblanked) | One log per source per day |
| `sync_failed` | source | One failure log per source per day |
| `event_rescheduled` | eventName + originalDate | One log per event reschedule |
| `event_cancelled` | eventName + currency | One log per event cancellation |
| `event_reinstated` | eventName + currency | One log per reinstatement |
| `event_created` | eventName + currency | One log per event creation |
| `event_deleted` | eventName + currency | One log per deletion |
| `blog_published` | postId | One log per blog post per day |
| `blog_created` | postId | One log per draft per day |
| `blog_updated` | postId | One log per update per day |
| `blog_deleted` | postId | One log per deletion |
| `gpt_upload` | source | One log per GPT upload session |
| `user_signup` | userId | One log per user |
| `settings_changed` | category + setting | One log per setting per day |

### Files Modified
- `functions/src/services/activityLoggingService.ts` - v1.1.0
  - Added `generateActivityId()` helper function
  - Updated `logActivity()` to accept `dedupeKey` parameter
  - Updated all specialized logging functions with appropriate dedupe keys
  - Added `source: 'backend'` to ActivityLog interface
- `src/services/activityLogger.js` - v1.1.0
  - Added `generateActivityId()` helper function
  - Updated `logActivity()` to accept `dedupeKey` parameter
  - Updated all specialized logging functions with appropriate dedupe keys
  - Changed from `addDoc()` to `setDoc()` with deterministic IDs

---

## Phase 4: Blog CMS Activity Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Track all blog-related activities for content audit trail.

### Deliverables
- [x] Log `blog_created` when draft is saved (AdminBlogEditorPage, BlogUploadDrawer)
- [x] Log `blog_published` when status changes to published (AdminBlogEditorPage, AdminBlogPage)
- [x] Log `blog_updated` when post is edited (AdminBlogEditorPage)
- [x] Log `blog_deleted` when post is deleted (AdminBlogPage)
- [x] Include author, languages, post metadata
- [x] GPT upload logging via BlogUploadDrawer

### Files Modified
- `src/pages/AdminBlogEditorPage.jsx` - v2.3.0
  - Added imports for logBlogCreated, logBlogUpdated, logBlogPublished
  - Added logging calls in handleSave for create/update/publish actions
  - Logs include post title, post ID, author ID, language keys
- `src/pages/AdminBlogPage.jsx` - v1.7.0
  - Added imports for logBlogPublished, logBlogDeleted
  - Updated handlePublish to accept full post object for logging
  - Updated handleUnpublish to accept full post object
  - Added logging in handleDelete with post title
- `src/components/BlogUploadDrawer.jsx` - v1.3.0
  - Added import for logBlogCreated
  - Added logging after successful GPT JSON upload

---

## Phase 5: Custom Events Activity Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Track user-created custom events for admin visibility.

### Deliverables
- [x] Log `event_created` when user adds custom event
- [x] Log `event_deleted` when user removes custom event
- [x] Log `event_updated` when user edits custom event
- [x] Include event details in metadata

### Files Modified
- `src/hooks/useCustomEvents.js` - v1.1.0
  - Added imports for logEventCreated, logEventDeleted, logEventUpdated
  - Added logging calls in createEvent for new custom events
  - Added logging calls in saveEvent for event updates
  - Added logging calls in removeEvent for event deletions
  - Logs include event name, currency, user ID, scheduled date
  - Deduplication key: `${eventName}_${currency}` ensures one log per day per event
- `src/services/activityLogger.js` - v1.2.0
  - Added logEventUpdated() export function for custom event edits
  - Deduplication-aware logging with ACTIVITY_TYPES.EVENT_UPDATED

---

## Phase 6: User Activity Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Track user account activities for admin insights.

### Deliverables
- [x] Log `user_signup` on new user registration (both OAuth and magic link)
- [x] Track signup source (google / magic_link)
- [x] Include email and userId in metadata

### Implementation Details
**Google OAuth Signups:**
- Location: `src/components/AuthModal2.jsx` v1.8.0
- Logs after successful `signInWithPopup()` when `isNewUser === true`
- Source: `'google'`
- Metadata: userId, email, source

**Magic Link Signups:**
- Location: `src/components/EmailLinkHandler.jsx` v2.2.0
- Logs after successful `signInWithEmailLink()` when `isNewUser === true`
- Source: `'magic_link'`
- Metadata: userId, email, source

### Files Modified
- `src/components/AuthModal2.jsx` - v1.8.0
  - Added import for logUserSignup from activityLogger
  - Added logging call after Google OAuth signup (isNewUser check)
  - Logs email and userId with source='google'
- `src/components/EmailLinkHandler.jsx` - v2.2.0
  - Added import for logUserSignup from activityLogger
  - Added logging call after magic link signup (newUser check)
  - Logs email and userId with source='magic_link'

### Privacy Notes
- Only logs on NEW user creation (not on login)
- Email is required for auth, included in logs
- No sensitive auth details (passwords, tokens) logged
- Deduplication by userId ensures one signup log per user

---

## Phase 7: GPT Upload Activity Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Track GPT event uploads from FFTTUploader for admin audit trail.

### Deliverables
- [x] Log `gpt_upload` on successful upload
- [x] Track event count and event names
- [x] Include source ('GPT') and metadata

### Implementation Details
**Location:** `src/components/FFTTUploader.jsx` v1.9.0

**Trigger:** After successful batch upload via Cloud Function `uploadGptEvents()`

**Logic:**
- Calculates total events: `created + merged`
- Extracts first 5 event names from upload for preview
- Calls `logGptUpload(eventNames, totalEvents, 'GPT')` only if events > 0
- Logs happen after Cloud Function returns successful response

**Deduplication:** By source ('GPT') - one upload log per source per day

### Files Modified
- `src/components/FFTTUploader.jsx` - v1.9.0
  - Added import for logGptUpload from activityLogger
  - Added activity logging after successful upload (lines 1144-1150)
  - Extracts event names from selectedEventsToUpload for metadata
  - Only logs if totalEvents > 0 (skip empty uploads)

### Success Metrics
- Activity log captures GPT upload events
- Event count matches Firestore response (created + merged)
- Event names provide visibility into what was uploaded
- Dashboard shows gpt_upload activities with full details

---

## Phase 8.0: Admin Action Logging ✅ COMPLETE

**Status:** ✅ Complete  
**Date:** February 5, 2026

### Objectives
Track all admin CRUD operations across event management, descriptions, and blog pages for complete audit trail.

### Deliverables
- [x] Log `canonical_event_updated` in AdminEventsPage
- [x] Log `event_description_created/updated/deleted` in AdminDescriptionsPage
- [x] Log `blog_author_created/updated/deleted` in AdminBlogAuthorsPage
- [x] Log `events_exported` in ExportEvents

### Activity Types Implemented
| Type | Location | Trigger |
|------|----------|---------|
| `canonical_event_updated` | AdminEventsPage.jsx | Admin edits event fields (timezone-aware) |
| `event_description_created` | AdminDescriptionsPage.jsx | Admin creates description |
| `event_description_updated` | AdminDescriptionsPage.jsx | Admin edits description |
| `event_description_deleted` | AdminDescriptionsPage.jsx | Admin deletes description |
| `blog_author_created` | AdminBlogAuthorsPage.jsx | Admin creates author profile |
| `blog_author_updated` | AdminBlogAuthorsPage.jsx | Admin edits author profile |
| `blog_author_deleted` | AdminBlogAuthorsPage.jsx | Admin deletes author profile |
| `events_exported` | ExportEvents.jsx | Superadmin exports canonical events |

### Files Modified
- `src/services/activityLogger.js` - v1.3.0
  - Added 8 new ACTIVITY_TYPES constants
  - Added 8 new logging functions with proper deduplication
- `src/pages/AdminEventsPage.jsx` - v1.3.0
  - Added import for logCanonicalEventUpdated
  - Added logging in handleEventUpdate after successful save
- `src/pages/AdminDescriptionsPage.jsx` - v1.1.0
  - Added imports for description logging functions
  - Added logging in handleCreate, handleDescriptionUpdate, handleDelete
- `src/pages/AdminBlogAuthorsPage.jsx` - v1.1.0
  - Added imports for author logging functions
  - Added logging in handleSave and handleDelete
- `src/components/ExportEvents.jsx` - v2.2.0
  - Added import for logEventsExported
  - Added logging after successful export

### Deduplication Strategy
- `canonical_event_updated`: By eventId - tracks field changes per event per day
- `event_description_created/updated`: By descriptionId - one per description per day
- `event_description_deleted`: By eventName - prevents duplicate deletion logs
- `blog_author_created/updated`: By authorId - one per author per day
- `blog_author_deleted`: By displayName - prevents duplicate deletion logs
- `events_exported`: By 'events_export' - one export log per day

---

## Phase 8.1: Dashboard Enhancements � IN PROGRESS

**Status:** 🟡 In Progress  
**Target:** March 2026

### Objectives
Advanced dashboard features for better admin UX.

### Tasks
- [x] Activity search/filter by date range
- [x] Export activity log to CSV/JSON
- [x] Activity summary charts (line graph of events over time)
- [ ] Email alerts for critical activities (sync failures)
- [ ] Activity retention policy (auto-delete old logs)
- [x] JBlanked status card on dashboard

### Deliverables (Completed)
- **AdminDashboardPage.jsx (v1.2.0)**: 
  - Added date range filter (fromDate/toDate inputs with clear button)
  - Added CSV/JSON export buttons with dynamic timestamps
  - Added ActivityTrendChart component showing activity count over last 30 days (bar chart)
  - Updated System Status section to 3-column grid
  - Added JBlanked Sync Status card showing last sync, success rate, and event count
  - Added aggregateActivitiesByDay() helper for trend calculations

### Pending Tasks
- Email alerts for critical activities (Cloud Function + settings config)
- Activity retention policy (scheduled cleanup function)

### Considerations
- Firestore query limitations (composite indexes needed)
- Storage costs for high-volume logging
- Performance impact on dashboard load

---

## Post-Phase Documentation (Future)

This section documents proposed enhancements beyond Phase 8:

### Advanced Features
- User activity heat maps (when users create events, etc.)
- Sync performance metrics (time taken, success rate)
- Event-by-event activity tracking (rather than bulk)
- Webhook notifications for critical failures
- Activity log API for external audit systems

### Performance Optimizations
- Activity batching (reduce Firestore writes)
- Scheduled cleanup jobs (old log archival)
- Activity indexing improvements
- Real-time stats aggregation (Cloud Firestore aggregations)

---

## Activity Types Master List

| Type | Source | Implemented | Priority | Notes |
|------|--------|-------------|----------|-------|
| `sync_completed` | Backend | ✅ | P0 | NFS + JBlanked |
| `sync_failed` | Backend | ✅ | P0 | NFS + JBlanked |
| `event_rescheduled` | Backend | ✅ | P0 | Date change detection |
| `event_cancelled` | Backend | ✅ | P0 | Stale events |
| `event_created` | Frontend | ✅ | P1 | Custom events (Phase 5) |
| `event_updated` | Frontend | ✅ | P1 | Custom events (Phase 5) |
| `event_deleted` | Frontend | ✅ | P1 | Custom events (Phase 5) |
| `blog_created` | Frontend | ✅ | P1 | Blog CMS (Phase 4) |
| `blog_published` | Frontend | ✅ | P1 | Blog CMS (Phase 4) |
| `blog_updated` | Frontend | ✅ | P1 | Blog CMS (Phase 4) |
| `blog_deleted` | Frontend | ✅ | P2 | Blog CMS (Phase 4) |
| `user_signup` | Frontend | ✅ | P1 | Auth (Phase 6) |
| `gpt_upload` | Frontend | ✅ | P1 | Admin (Phase 7) |
| `event_reinstated` | Backend | ⬜ | P1 | Cancelled → active |
| `settings_changed` | Frontend | ⬜ | P3 | User preferences |

---

## Implementation Status Summary

### Completed (Phases 1-8.0)
- ✅ Backend activity logging infrastructure (Phase 1)
- ✅ NFS sync logging (Phase 1)
- ✅ Frontend logger service (Phase 2)
- ✅ Firestore rules updated (Phase 2)
- ✅ Admin Dashboard with dual filtering (Phase 2)
- ✅ JBlanked sync logging (Phase 3)
- ✅ Deduplication fix (Phase 3.5)
- ✅ Blog CMS logging (Phase 4)
- ✅ Custom events logging (Phase 5)
- ✅ User signup logging (Phase 6)
- ✅ GPT upload logging (Phase 7)
- ✅ Admin action logging (Phase 8.0)
- ✅ Date range filtering (Phase 8.1)
- ✅ Export to CSV/JSON (Phase 8.1)
- ✅ Activity trend charts (Phase 8.1)
- ✅ JBlanked status card (Phase 8.1)

### In Progress (Phase 8.1)
- 🟡 Email alerts for critical activities
- 🟡 Activity retention policy

### Not Started (Phase 8.1)
- 📋 Dashboard enhancements beyond Phase 8.1

### Key Integration Points by Phase
| Phase | Frontend File(s) | Status |
|-------|------------------|--------|
| 1 | AdminDashboardPage.jsx | ✅ |
| 2 | AdminDashboardPage.jsx | ✅ |
| 3 | - (backend) | ✅ |
| 3.5 | activityLogger.js | ✅ |
| 4 | AdminBlogEditorPage.jsx, AdminBlogPage.jsx, BlogUploadDrawer.jsx | ✅ |
| 5 | useCustomEvents.js hook | ✅ |
| 6 | AuthModal2.jsx, EmailLinkHandler.jsx | ✅ |
| 7 | FFTTUploader.jsx | ✅ |
| 8.0 | AdminEventsPage.jsx, AdminDescriptionsPage.jsx, AdminBlogAuthorsPage.jsx, ExportEvents.jsx | ✅ |
| 8 | AdminDashboardPage.jsx | - | ⬜ |

---

## Security & Rules
- Hash or truncate email addresses if needed
- Allow users to opt-out (future)

### Integration Points
- `AuthContext.jsx` - Auth state changes
- `AuthModal2.jsx` - Registration success callback

### Files to Modify
- `src/contexts/AuthContext.jsx` - Add logUserSignup call
- `src/components/AuthModal2.jsx` - Add logging on successful registration

---

## Security & Rules

### Current Firestore Rules (v1.8.0)
```javascript
match /systemActivityLog/{activityId} {
  allow read: if isAdmin() || isSuperadmin();
  allow write: if isSuperadmin();
}
```

### Proposed Rules (v1.9.0) for Frontend Logging
```javascript
match /systemActivityLog/{activityId} {
  // Read: Admin or Superadmin only
  allow read: if isAdmin() || isSuperadmin();
  
  // Write: Authenticated users can create (for frontend logging)
  // Superadmin can update/delete
  allow create: if request.auth != null 
    && request.resource.data.keys().hasAll(['type', 'title', 'createdAt'])
    && request.resource.data.type is string
    && request.resource.data.title is string;
  allow update, delete: if isSuperadmin();
}
```

---

## Testing Checklist

### Phase 1 (Foundation)
- [x] NFS sync logs `sync_completed` on success
- [x] NFS sync logs `sync_failed` on error
- [x] Event reschedules are logged with date diff
- [x] Cancelled events are logged
- [x] Admin dashboard displays activities in real-time
- [x] Activity filter chips work correctly
- [x] Sync status card shows healthy/error state

### Phase 2 (Frontend Logger)
- [ ] Frontend logger writes to Firestore
- [ ] Activities appear in dashboard immediately
- [ ] User context is captured in metadata
- [ ] Security rules prevent unauthorized writes

### Phase 3-7 (Feature Logging)
- [ ] Each activity type appears correctly in dashboard
- [ ] Metadata is complete and useful
- [ ] No duplicate logging
- [ ] Error handling doesn't break main functionality

---

## Metrics & Success Criteria

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Activity types tracked | 15+ | 9 | 🟡 60% |
| Phases completed | 8 | 3 | 🟡 38% |
| Frontend logging implemented | Yes | Yes | ✅ |
| JBlanked logging implemented | Yes | Yes | ✅ |
| Dashboard load time | < 2s | ~1.5s | ✅ |
| Real-time update latency | < 500ms | ~200ms | ✅ |
| Source filtering | Yes | Yes | ✅ |
| User context capture | Yes | Yes | ✅ |
| Dual filter UI | Yes | Yes | ✅ |
| Log retention | 90 days | ∞ | 📝 |
| Coverage (features with logging) | 100% | 60% | 🟡 |

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Firebase Firestore | v10.x | Activity storage |
| firebase-admin | v12.x | Backend writes |
| firebase/firestore | v10.x | Frontend writes + onSnapshot |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.3.0 | 2026-02-05 | Phase 4 complete: Blog CMS logging (create/update/publish/delete) in AdminBlogEditorPage, AdminBlogPage, BlogUploadDrawer |
| 1.2.0 | 2026-02-05 | Phase 3.5: Deduplication fix using deterministic document IDs. Phase 3 complete: JBlanked logging, dual activity filters, source badges |
| 1.1.0 | 2026-02-05 | Phase 2 complete: Frontend logger, Firestore rules v1.9.0, dual filtering in dashboard |
| 1.0.0 | 2026-02-05 | Initial roadmap, Phase 1 complete |

---

## References

- [Admin Dashboard Implementation](./ADMIN_DASHBOARD_IMPLEMENTATION.md) - TBD
- [Firestore Security Rules](../../firestore.rules)
- [Backend Activity Service](../../functions/src/services/activityLoggingService.ts)
- [Frontend Activity Service](../../src/services/activityLogger.js)
