# Custom Events Notification Audit - 2026-02-03

## Purpose
Comprehensive audit of the custom event notification system for all 3 notification types: In-app (NotificationCenter), Browser, and Push (FCM).

## Key Requirements
1. **All 3 notification types must work** for custom events
2. **When custom event date/time is edited**, reminder should update accordingly
3. **Timezone handling**: Reminder triggers at the timezone-selected time regardless of device local time

## Architecture Overview

### Data Flow
```
Custom Event Creation/Edit
    │
    ▼
buildCustomEventPayload() → parseLocalDateTime() → epochMs (UTC)
    │
    ▼
normalizeEventForReminder() → eventEpochMs + reminders array
    │
    ▼
upsertReminderForUser() → Firestore: users/{uid}/reminders/{eventKey}
    │
    ├─────────────────────────────────────┐
    │                                     │
    ▼                                     ▼
Frontend (useCustomEventNotifications)   Cloud Function (fcmReminderScheduler)
    │                                     │
    ├─► In-app: NotificationCenter       └─► Push: FCM
    │
    └─► Browser: Web Notifications API
```

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/useCustomEventNotifications.js` | Frontend notification scheduling |
| `src/services/customEventsService.js` | Custom event CRUD + reminder sync |
| `src/services/remindersService.js` | Firestore reminder persistence |
| `src/utils/remindersRegistry.js` | Unified reminder normalization + recurrence expansion |
| `src/utils/dateUtils.js` | Timezone-aware date utilities |
| `functions/src/services/fcmReminderScheduler.ts` | Server-side FCM push |

## Timezone Handling (CRITICAL)

### How It Works
1. User creates event with `localDate`, `localTime`, and `timezone`
2. `parseLocalDateTime()` converts to UTC epoch via `getUtcDateForTimezone()`
3. The UTC epoch (`epochMs`) is stored in both:
   - Custom event document
   - Reminder document as `eventEpochMs`
4. Notification triggers use UTC timestamps for comparison:
   - `Date.now()` returns UTC timestamp
   - `reminderAt = eventEpochMs - minutesBefore * 60 * 1000` (also UTC)
   - `isDue = nowEpochMs >= reminderAt && nowEpochMs < eventEpochMs + NOW_WINDOW_MS`

### Example
- User creates event: 10:00 AM New York (America/New_York)
- EST is UTC-5, so event is stored as: 15:00 UTC (epoch: 1738767600000)
- Reminder 5 min before: 14:55 UTC (epoch: 1738767300000)
- At 14:55 UTC, regardless of device timezone, `isDue` becomes `true`

## Notification Channels

### In-App (NotificationCenter)
- **File**: `useCustomEventNotifications.js`
- **Mechanism**: Checks every 15 seconds via `setInterval`
- **Trigger**: When `isDue === true`, calls `addNotificationForUser()` for Firestore persistence
- **UI Update**: Optimistic update via `setNotifications()` before async Firestore write
- **Display**: `NotificationCenter` component subscribes to notifications

### Browser Notifications
- **File**: `useCustomEventNotifications.js`
- **Mechanism**: Same check loop as in-app
- **Trigger**: When `isDue === true` and `channel === 'browser'`, calls `notifyBrowser()`
- **Permission**: Requires `Notification.permission === 'granted'`

### Push (FCM)
- **File**: `functions/src/services/fcmReminderScheduler.ts`
- **Mechanism**: Cloud Function runs every 5 minutes
- **Trigger**: Queries all reminders with push enabled, checks if due
- **Fix Applied (2026-02-03)**: Per-offset channel check added to only send push for offsets with `channels.push === true`

## Debugging (v2.3.0)

### Debug Logs Added
1. **Events input**: Logs count and first event sample
2. **Normalized reminders**: Logs `eventKey`, `eventEpochMs`, `reminders`, `enabled`
3. **Firestore subscription**: Logs reminders received from Firestore
4. **Occurrences**: Logs expanded occurrences for each reminder
5. **isDue check**: Logs all timing values for the due calculation

### How to Debug
1. Open browser DevTools → Console
2. Create a custom event with reminder set to trigger soon
3. Watch for `[DEBUG]` logs every 15 seconds
4. Check:
   - Is `events input` showing your custom events?
   - Does the event have `reminders` array?
   - Is `eventEpochMs` correct (not null)?
   - Are `occurrences` being generated?
   - Is `isDue` becoming true at the right time?

## Issues Fixed (2026-02-03)

### Fix 1: In-App Optimistic Update
- **Problem**: Notifications only appeared after Firestore subscription callback
- **Solution**: Added immediate `setNotifications()` call before async Firestore write
- **Location**: `useCustomEventNotifications.js` line ~433

### Fix 2: Push Per-Offset Channel Check
- **Problem**: Push was sent for ALL reminder offsets if ANY had push enabled
- **Solution**: Added `if (!offset?.channels?.push) continue;` check
- **Location**: `fcmReminderScheduler.ts` line ~378

## Verification Checklist

- [ ] Custom event created with reminder appears in `effectiveReminders`
- [ ] `eventEpochMs` is correctly calculated from `localDate + localTime + timezone`
- [ ] Firestore reminder document has correct `eventEpochMs`
- [ ] `expandReminderOccurrences()` returns valid occurrence
- [ ] `isDue` becomes `true` at correct time
- [ ] In-app notification appears in NotificationCenter
- [ ] Browser notification appears (if permission granted)
- [ ] Push notification received (if FCM enabled)
- [ ] Editing event date/time updates reminder `eventEpochMs`

## Related Documents
- [NOTIFICATION_SAVE_FIX_2026-01-23.md](./NOTIFICATION_SAVE_FIX_2026-01-23.md)
- [CUSTOM_NOTIFICATION_FIX_SUMMARY.md](./CUSTOM_NOTIFICATION_FIX_SUMMARY.md)
