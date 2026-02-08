/**
 * RESCHEDULED EVENT PERSISTENCE - BEP FIX & AUDIT GUIDE
 * Date: 2026-02-06
 * 
 * PROBLEM: When an event was rescheduled, user favorites, notes, and reminders were not persisted.
 * 
 * ROOT CAUSE: Composite key calculation used datetimeUtc for all events. When an event was rescheduled
 * (datetime changed), the composite key changed, breaking lookups for favorites/notes/reminders that
 * were saved under the old key.
 * 
 * SOLUTION: Use originalDatetimeUtc (immutable original time) instead of datetimeUtc for composite key.
 * 
 * FILES MODIFIED:
 * ✅ src/services/favoritesService.js (v1.2.8) - buildEventIdentity now uses originalDatetimeUtc
 * ✅ src/services/eventNotesService.js (v1.1.4) - Updated changelog to reflect fix
 * ✅ src/utils/remindersRegistry.js (v1.2.1) - Updated changelog to reflect fix
 * ✅ src/services/auditLoggingService.js (v1.0.0) - NEW: Audit logging for rescheduled events
 * 
 * HOW IT WORKS NOW:
 * 
 * 1. Event Created: "Non-Farm Payroll USD" on 2026-02-07 13:30:00 UTC
 *    - id: "event123"
 *    - datetimeUtc: 2026-02-07T13:30:00Z
 *    - originalDatetimeUtc: 2026-02-07T13:30:00Z (same as datetimeUtc initially)
 *    - Composite Key: "non-farm payroll-usd-1739026200000"
 * 
 * 2. User adds favorite
 *    - Stored in: userFavorites/{userId}/favorites/event123
 *    - Also indexed by composite key: "non-farm payroll-usd-1739026200000"
 * 
 * 3. Event is Rescheduled: "Non-Farm Payroll USD" moved to 2026-02-07 14:00:00 UTC
 *    - id: "event123" (SAME ID - critical!)
 *    - datetimeUtc: 2026-02-07T14:00:00Z (CHANGED - new time)
 *    - rescheduledFrom: 2026-02-07T13:30:00Z (tracks old time)
 *    - originalDatetimeUtc: 2026-02-07T13:30:00Z (UNCHANGED - stays original)
 *    - Composite Key: "non-farm payroll-usd-1739026200000" (SAME - stable across reschedules!)
 * 
 * 4. When loading the rescheduled event:
 *    - buildEventIdentity uses originalDatetimeUtc → Same composite key
 *    - Lookup finds favorite under old key ✅
 *    - Lookup finds notes under old key ✅
 *    - Lookup finds reminders under old key ✅
 * 
 * ENABLING AUDIT LOGS:
 * 
 * To see detailed audit logs for rescheduled events:
 * 1. Open browser console
 * 2. Run: localStorage.setItem('t2t_debug_audit', '1')
 * 3. Reload page
 * 4. Perform actions on rescheduled events - audit logs will appear in console
 * 
 * Expected audit output:
 * [audit][EventData] ⭐ Favorite action on rescheduled event {
 *   action: 'added',
 *   eventId: 'event123',
 *   eventName: 'Non-Farm Payroll',
 *   originalTime: '2026-02-07T13:30:00.000Z',
 *   currentTime: '2026-02-07T14:00:00.000Z',
 *   ...
 * }
 * 
 * TEST CASES:
 * 
 * ✅ TEST 1: Add favorite to event → Event is rescheduled → Favorite still appears
 *    1. Go to /calendar
 *    2. Add an event to favorites
 *    3. Upload a rescheduled version of that same event (via /upload-desc)
 *    4. Reload /calendar
 *    5. Expected: Heart icon is still filled on the rescheduled event
 *    6. Expected in audit logs: "⭐ Favorite action on rescheduled event - ✅ FOUND"
 * 
 * ✅ TEST 2: Add notes to event → Event is rescheduled → Notes still appear
 *    1. Go to /clock
 *    2. Click on an event marker
 *    3. Click "Add Note" button in EventModal
 *    4. Add a note and save
 *    5. Close modal
 *    6. Upload a rescheduled version of that same event
 *    7. Click on the event marker again
 *    8. Expected: Note button shows green dot (indicates notes exist)
 *    9. Expected: Note content is still there
 *    10. Expected in audit logs: "📝 Note action on rescheduled event - ✅ FOUND"
 * 
 * ✅ TEST 3: Add reminder to event → Event is rescheduled → Reminder still works
 *    1. Go to /clock
 *    2. Click on an event marker
 *    3. Click "Edit reminders" in EventModal
 *    4. Add a reminder (e.g., 15 minutes before)
 *    5. Save reminder
 *    6. Close modal
 *    7. Upload a rescheduled version of that same event
 *    8. Click on the event marker again
 *    9. Expected: Reminder is still there with same minutesBefore value
 *    10. Expected: Can edit/delete reminder
 *    11. Expected in audit logs: "🔔 Reminder action on rescheduled event - ✅ FOUND"
 * 
 * TRACE & DEBUG GUIDE:
 * 
 * If user data is NOT persisting after reschedule:
 * 
 * 1. Enable audit logs: localStorage.setItem('t2t_debug_audit', '1')
 * 2. Check the composite key:
 *    - OLD (broken): Uses currentDateTime when rescheduled → key changes
 *    - NEW (fixed): Uses originalDatetimeUtc → key stays same
 * 3. Look for these logs in console:
 *    "🔑 Composite key calculation for rescheduled event" - Shows old vs new key
 *    "📊 User [type] load - ✅ FOUND" - Data was found
 *    "📊 User [type] load - ❌ NOT FOUND" - Data was NOT found (problem!)
 * 4. If NOT FOUND, check:
 *    - Is originalDatetimeUtc populated in the rescheduled event?
 *    - Are old favorites/notes/reminders under different key?
 *    - Did backend properly set originalDatetimeUtc when rescheduling?
 * 
 * BACKEND VERIFICATION:
 * 
 * Check that functions/src/models/economicEvent.ts mergeProviderEvent() correctly sets originalDatetimeUtc:
 * 
 * Line 299-300:
 * if (!merged.originalDatetimeUtc) {
 *   merged.originalDatetimeUtc = canonical.datetimeUtc;
 * }
 * 
 * This ensures originalDatetimeUtc is set once and NEVER changes.
 * 
 * ACTIVITY AUDIT TRAIL:
 * 
 * All user actions on rescheduled events are now logged with full context:
 * - User ID
 * - Event ID (stays same across reschedules)
 * - Event name and currency
 * - Original time (when event was first created)
 * - Rescheduled from (old time)
 * - Current time (new time)
 * - Action type (added/updated/removed)
 * - Timestamp of action
 * 
 * This provides complete traceability for debugging and audit purposes.
 */
