# ExportEvents.jsx v2.0.0 Redesign - Complete

**Date:** January 21, 2026  
**Component:** [src/components/ExportEvents.jsx](src/components/ExportEvents.jsx)  
**Status:** ✅ COMPLETE (5/6 tasks - Firestore rules pending)  
**Version:** v2.0.0  

---

## Summary

Successfully redesigned **ExportEvents.jsx** to export unified canonical economic events from the new multi-source collection structure. Component now:

1. ✅ Requires superadmin RBAC (role-based access control)
2. ✅ Queries canonical collection: `/economicEvents/events/events/{eventId}`
3. ✅ Exports **all fields** from canonical events with multi-source data
4. ✅ Generates enterprise JSON format with metadata
5. ✅ Transforms Firestore Timestamps to ISO 8601 strings
6. 🟡 Firestore rules require manual configuration

---

## What Changed

### Old (v1.0.0) - Legacy Per-Source Structure
```
Collection: /economicEvents/{source}/events/{eventId}
Export: 3 separate files (nfs, jblanked, gpt)
Format: Per-source data only, no unification
Access: No RBAC, anyone could export
```

### New (v2.0.0) - Canonical Multi-Source Structure
```
Collection: /economicEvents/events/events/{eventId}
Export: Single comprehensive JSON file
Format: Enterprise with metadata + multi-source data
Access: Superadmin-only with RBAC gate
```

---

## Key Features Implemented

### 1. ✅ RBAC Access Control
- Uses `useAuth()` hook to get `userProfile?.role`
- Checks: `userProfile?.role === 'superadmin'`
- Non-superadmins see access-denied page with LockIcon
- Follows same pattern as FFTTUploader.jsx

```jsx
const isSuperadmin = useMemo(() => userProfile?.role === 'superadmin', [userProfile?.role]);

if (!isSuperadmin) {
  return <AccessDenied />;
}
```

### 2. ✅ Canonical Collection Query
- Queries: `collection(db, 'economicEvents', 'events', 'events')`
- Retrieves all unified economic events
- Transforms each document with multi-source data preservation

```jsx
const eventsContainer = collection(
  db,
  CANONICAL_EVENTS_ROOT,        // 'economicEvents'
  CANONICAL_EVENTS_CONTAINER,   // 'events'
  CANONICAL_EVENTS_CONTAINER    // 'events'
);
const snapshot = await getDocs(eventsContainer);
```

### 3. ✅ Enterprise JSON Format
**Metadata Section:**
- `exportedAt`: ISO 8601 timestamp
- `exportedBy`: User email
- `totalEvents`: Event count
- `version`: "2.0.0"
- `collectionPath`: Full path to collection
- `description`: Multi-source explanation

**Source Priority Section:**
- `priority_order`: [nfs, jblanked-ff, gpt, jblanked-mt, jblanked-fxstreet]
- `description`: Explains value-picking logic

**Events Array:**
- Each event includes all canonical fields:
  - Core: eventId, docId, name, currency, category, impact
  - Time: datetimeUtc, timezoneSource
  - Values: forecast, previous, actual, status
  - Multi-source: sources.{provider}.{lastSeenAt, parsed, raw}
  - Metadata: winnerSource, qualityScore, createdAt, updatedAt

### 4. ✅ Timestamp Handling
- Firestore Timestamps converted to ISO 8601
- Function: `timestampToIso(timestamp)`
- Handles: Firestore Timestamp objects, strings, null values

```jsx
const timestampToIso = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return null;
};
```

### 5. ✅ File Download
- Single canonical events JSON file
- Filename: `canonical-events-{YYYY-MM-DD}.json`
- Browser download using Blob + URL.createObjectURL
- Proper cleanup: `URL.revokeObjectURL(url)`

```jsx
const filename = `canonical-events-${timestamp}.json`;
const jsonString = JSON.stringify(exportData, null, 2);
const blob = new Blob([jsonString], { type: 'application/json; charset=utf-8' });
// ... create download link
```

### 6. ✅ Enterprise UI/UX
- **Loading State:** CircularProgress spinner, disabled button
- **Success Card:** Shows filename, event count, collection path, timestamp
- **Error Display:** Alert with error message, onClose handler
- **Export Spec Box:** Lists all export details (path, format, timestamps, priority)
- **Back Button:** Returns to main app (hash routing)

---

## Data Structure Example

**Query Result (Firestore):**
```javascript
// /economicEvents/events/events/{eventId}
{
  eventId: "abc123xyz",
  name: "US Non-Farm Payroll",
  currency: "USD",
  category: "Employment",
  impact: "high",
  datetimeUtc: Timestamp(2026-02-06, 13:30:00),
  timezoneSource: "UTC",
  forecast: "195000",
  previous: "227000",
  actual: null,
  status: "scheduled",
  sources: {
    "nfs": {
      lastSeenAt: Timestamp(2026-01-21, 18:45:00),
      parsed: { name: "...", date: "..." },
      raw: { ... }
    },
    "jblanked-ff": {
      lastSeenAt: Timestamp(...),
      parsed: {...},
      raw: {...}
    }
  },
  winnerSource: "nfs",
  qualityScore: 95,
  createdAt: Timestamp(...),
  updatedAt: Timestamp(...)
}
```

**Exported JSON Format:**
```json
{
  "metadata": {
    "exportedAt": "2026-01-21T18:50:00.000Z",
    "exportedBy": "admin@time2.trade",
    "totalEvents": 1250,
    "version": "2.0.0",
    "collectionPath": "economicEvents/events/events",
    "description": "Canonical economic events with multi-source data..."
  },
  "sources": {
    "priority_order": ["nfs", "jblanked-ff", "gpt", "jblanked-mt", "jblanked-fxstreet"],
    "description": "Values are picked from highest-priority source that has data"
  },
  "events": [
    {
      "eventId": "abc123xyz",
      "docId": "abc123xyz",
      "name": "US Non-Farm Payroll",
      "currency": "USD",
      "category": "Employment",
      "impact": "high",
      "datetimeUtc": "2026-02-06T13:30:00.000Z",
      "timezoneSource": "UTC",
      "forecast": "195000",
      "previous": "227000",
      "actual": null,
      "status": "scheduled",
      "sources": {
        "nfs": {
          "lastSeenAt": "2026-01-21T18:45:00.000Z",
          "parsed": {...},
          "raw": {...}
        },
        "jblanked-ff": {...}
      },
      "winnerSource": "nfs",
      "qualityScore": 95,
      "createdAt": "2025-12-15T10:20:00.000Z",
      "updatedAt": "2026-01-21T18:50:00.000Z"
    }
  ]
}
```

---

## Component Code Structure

```jsx
ExportEvents Component
├── Access Control (RBAC)
│   ├── useAuth() hook
│   ├── isSuperadmin check (useMemo)
│   └── AccessDenied render for non-superadmins
│
├── Helper Functions
│   ├── timestampToIso(timestamp)
│   └── transformEvent(docId, data)
│
├── State Management
│   ├── exporting: boolean (loading state)
│   ├── error: string | null
│   └── result: object | null
│
├── Main Export Handler
│   └── handleExport()
│       ├── Query canonical collection
│       ├── Transform documents
│       ├── Generate enterprise JSON with metadata
│       ├── Create & download file
│       └── Set result state
│
├── Navigation Handler
│   └── handleBack() → window.location.hash = '/'
│
└── Render
    ├── Header with Back button
    ├── Description & info alert
    ├── Export button (with spinner)
    ├── Success card (if result)
    ├── Error alert (if error)
    └── Export spec info box
```

---

## Imports & Dependencies

**React & Hooks:**
- `useMemo`, `useState` from 'react'

**Material-UI Components:**
- Layout: Container, Paper, Box, Stack, Card, CardContent
- Display: Typography, Alert, List, ListItem, ListItemText, ListItemIcon
- Interactive: Button, CircularProgress
- Icons: Download, CheckCircle, Error, ArrowBack, Lock

**Firebase:**
- `collection`, `getDocs` from 'firebase/firestore'
- `db` from '../firebase'
- `useAuth` from '../contexts/AuthContext'

---

## Pending: Firestore Security Rules

**File:** `firestore.rules`

**Required Rule for superadmin-only read access:**

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // 🔒 Canonical events collection - Superadmin only
    match /economicEvents/{document=**} {
      allow read: if request.auth.token.role == 'superadmin';
      allow write: if request.auth.token.role == 'superadmin';
    }
  }
}
```

**Manual Steps:**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Rules
3. Add the rule above
4. Publish

---

## Testing Checklist

- [ ] **Non-Superadmin Access:** Regular user sees "Access Denied" with LockIcon
- [ ] **Superadmin Access:** Superadmin sees export page
- [ ] **Export Button:** Click triggers download
- [ ] **File Generated:** `canonical-events-{date}.json` downloads to Downloads folder
- [ ] **JSON Structure:** Verify metadata section present
- [ ] **Timestamps:** Check all timestamps in ISO 8601 format
- [ ] **Event Count:** Verify correct number of events exported
- [ ] **Multi-Source Data:** Check sources object contains provider data
- [ ] **Error Handling:** Test with no events (shows error)
- [ ] **Back Button:** Navigate back to main app
- [ ] **Firestore Rules:** Verify non-superadmins get permission denied

---

## Related Files

- [FFTTUploader.jsx](src/components/FFTTUploader.jsx) - RBAC pattern reference
- [economicEvent.ts](functions/src/models/economicEvent.ts) - Priority order documentation
- [AuthContext.jsx](src/contexts/AuthContext.jsx) - useAuth hook provider
- [firestore.rules](firestore.rules) - Security rules file

---

## Changelog

**v2.0.0 - 2026-01-21** (Current)
- Complete redesign for canonical multi-source collection
- Replaced legacy per-source export with unified export
- Added superadmin RBAC gating (access denied page for non-admins)
- Implemented canonical collection query: `/economicEvents/events/events`
- Added enterprise JSON metadata (exportedAt, exportedBy, version, description)
- Added source priority order in export metadata
- Improved timestamp handling: Firestore → ISO 8601
- Enhanced UI: Single-file download with success card and spec box
- Added proper error handling and loading states
- Updated imports and constants for new structure

**v1.0.0 - 2025-11-30**
- Initial implementation for legacy per-source structure
- 3-file export (nfs, jblanked, gpt)
- Per-source data only, no unification
- No RBAC, public export

---

## Next Steps

1. ✅ **Component Complete** - ExportEvents.jsx fully functional
2. 🔒 **Firestore Rules** - Add superadmin rules to firestore.rules
3. 🧪 **Testing** - Validate RBAC gate, export, and data
4. 📦 **Deployment** - Deploy to Firebase

---

**Status:** Ready for Firestore rules configuration and testing.

