# Hardcoded Strings Audit - i18n Migration Targets

**Status:** Comprehensive audit of remaining hardcoded UI strings across React components  
**Date:** January 24, 2026  
**Target:** 100% i18n coverage (admin, modals, utilities, tooltips, accessibility)

---

## Summary

| Category | Count | Priority | Notes |
|----------|-------|----------|-------|
| Admin Components | 45+ | HIGH | ExportEvents, FFTTUploader, UploadDescriptions |
| Modal Components | 25+ | HIGH | UnsavedChangesModal, RoadmapModal, ConfirmModal |
| Utility Components | 15+ | MEDIUM | TimezoneModal, TimeSettings, TimeStatus |
| **TOTAL** | **85+** | - | - |

---

## Detailed Audit by Component

### 1. **ExportEvents.jsx** (Superadmin Component)
**File:** [src/components/ExportEvents.jsx](src/components/ExportEvents.jsx)  
**Priority:** HIGH - Admin-only export interface  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 79 | `Access Denied` | Typography | `admin:export.accessDenied` |
| 82 | `This page requires <strong>superadmin</strong> role. You do not have permission to export events.` | Alert | `admin:export.noPermission` |
| 170 | `No events found in canonical collection.` | Error | `admin:export.noEventsFound` |
| 240 | `Back` | Button | `actions:back` |
| 245 | `Export Canonical Events` | Typography h4 | `admin:export.title` |
| 250 | `Export all unified economic events from the canonical multi-source collection. Each event includes data from all available sources (NFS, JBlanked-FF, GPT, JBlanked-MT, JBlanked-FXStreet) with values picked from the highest-priority source.` | Typography | `admin:export.description` |
| 254 | `📊 Canonical Collection: economicEvents/events/events<br />📋 Format: Enterprise JSON with metadata and multi-source tracking` | Alert | `admin:export.infoBox` |
| 263 | `{exporting ? 'Exporting Events...' : 'Download Canonical Events'}` | Button | `admin:export.buttonLabel` |
| 277 | `Export Successful` | Typography h6 | `admin:export.successTitle` |
| 282 | `📥 Downloaded: {result.filename}` | Typography | `admin:export.downloadedFile` |
| 286 | `Total Events` | ListItemText | `admin:export.totalEvents` |
| 287 | `${result.eventCount.toLocaleString()} events exported` | ListItemText | `admin:export.eventCount` |
| 291 | `Collection Path` | ListItemText | `admin:export.collectionPath` |
| 296 | `Export Time` | ListItemText | `admin:export.exportTime` |
| 302 | `File downloaded to Downloads folder. Move to <code>data/</code> folder if needed.` | Alert | `admin:export.fileMoveNote` |
| 307 | `Export Another` | Button | `admin:export.exportAnother` |
| 314 | `Export Failed` | Alert | `admin:export.failureTitle` |
| 323 | `Export Specification` | Typography | `admin:export.specTitle` |
| 326-337 | Multiple list items: "Path:", "Fields:", "Format:", "Timestamps:", "Priority Order:" | List items | `admin:export.spec.*` |

---

### 2. **UploadDescriptions.jsx** (Admin Component)
**File:** [src/components/UploadDescriptions.jsx](src/components/UploadDescriptions.jsx)  
**Priority:** HIGH - Admin descriptions uploader  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 185 | `Loading...` | Typography | `states:loading` |
| 204 | `You must be logged in to Firebase Authentication to upload event descriptions.` | Alert | `admin:upload.requiresAuth` |
| 207 | `Please log in to your Firebase account first, then return to this page.` | Typography | `admin:upload.loginFirst` |
| 210 | `Current auth state: {firebaseUser ? 'Logged in' : 'Not logged in'}` | Typography | `admin:upload.authState` |
| 222 | `Logged in as: {firebaseUser.email}` | Alert | `admin:upload.loggedInAs` |
| 226 | `Protected Page` | Typography h5 | `admin:upload.protectedTitle` |
| 230 | `Please enter the password to access the upload page.` | Typography | `admin:upload.passwordPrompt` |
| 256 | `Enter password` | TextField placeholder | `form:enterPassword` |
| 264 | `{passwordError}` (hardcoded in message) | Alert | `validation:incorrectPassword` |
| 269 | `Submit` | Button | `actions:submit` |
| 299 | `Upload Economic Event Descriptions` | Typography h4 | `admin:upload.title` |
| 303 | `Select the <code>economicEventDescriptions.json</code> file to upload event descriptions to Firestore.` | Typography | `admin:upload.instructions` |
| 317 | `Select JSON File` | Button | `actions:selectFile` |
| 330 | `Selected: {selectedFile.name}` | Alert | `notifications:fileSelected` |
| 337 | `Upload to Firestore` | Button | `admin:upload.button` |
| 353 | `{Math.round(progress)}% Complete` | Typography | `notifications:percentComplete` |
| 361 | `{error}` (error message display) | Alert | `notifications:error` |
| 368 | `{result.message}` (success message) | Alert | `notifications:success` |
| 376 | `Uploaded Events ({uploadedEvents.length})` | Typography h6 | `admin:upload.uploadedEvents` |
| 421 | `Instructions:` | Typography | `actions:instructions` |
| 424 | Instructions list (hardcoded in ol) | Typography/ol | `admin:upload.instructionsList` |

---

### 3. **FFTTUploader.jsx** (Superadmin Component)
**File:** [src/components/FFTTUploader.jsx](src/components/FFTTUploader.jsx)  
**Priority:** HIGH - GPT events uploader with extensive UI  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 67 | `Missing event.name` | Validation error | `validation:missingEventName` |
| 70 | `Missing event.datetimeUtc` | Validation error | `validation:missingDatetime` |
| 152 | `Event matching error: {err}` | console.warn | `admin:fftt.matchingError` |
| 166 | `Error fetching matched event details: {err}` | console.warn | `admin:fftt.detailsFetchError` |
| 224 | `Drag & drop JSON file here or click to browse` | Box text | `admin:fftt.dropzoneHint` |
| 233 | `Browse` | Button | `actions:browse` |
| 268 | `Ready: ${selectedFile.name}` | Chip label | `notifications:fileReady` |
| 468 | `Search by name` | TextField label | `admin:fftt.searchLabel` |
| 475 | `Filter events...` | TextField placeholder | `admin:fftt.searchPlaceholder` |
| 481 | `Date from` | TextField label | `form:dateFrom` |
| 492 | `Date to` | TextField label | `form:dateTo` |
| 500 | `Reset` | Button | `actions:reset` |
| 511 | `Showing {Math.min(paginatedEvents.length, rowsPerPage)} of {filteredEvents.length} events` | Typography | `admin:fftt.showingEvents` |
| 516 | `${selectedIndices.length} selected` | Chip label | `notifications:selected` |
| 556 | `#` | TableCell header | `admin:fftt.indexHeader` |
| 573 | `Status` | TableCell header | `admin:fftt.statusHeader` |
| 686 | `New event (no existing match found)` | Tooltip | `admin:fftt.newEventTooltip` |
| 691 | `New` | Chip label | `admin:fftt.statusNew` |
| 698 | `Click to compare sources • ${matchResult.matchedEventName || 'Unknown'} (${matchResult.similarity?.toFixed(2) || 'N/A'}% similar)` | Tooltip | `admin:fftt.matchedTooltip` |
| 705 | `Matched` | Chip label | `admin:fftt.statusMatched` |
| 710 | `Checking...` | Chip label | `admin:fftt.statusChecking` |
| 770 | `Loading matched event details...` | Typography | `notifications:loadingDetails` |
| 777 | `Matched Event: {detailsData.matched?.name || 'Unknown'}` | Typography | `admin:fftt.matchedEventTitle` |
| 787 | `Field Differences (Incoming vs Matched):` | Typography | `admin:fftt.fieldDifferencesTitle` |
| 812 | `New Value:` | Typography | `admin:fftt.newValue` |
| 819 | `Existing Value:` | Typography | `admin:fftt.existingValue` |
| 836 | `✓ No field differences - events match perfectly` | Typography | `admin:fftt.perfectMatch` |
| 840 | `Failed to load matched event details` | Typography | `admin:fftt.detailsLoadFailed` |
| 849 | `No events match filters.` | Typography | `notifications:noResults` |
| 1029 | `Loading...` | Typography | `states:loading` |
| 1035 | `FF-T2T Uploader` | Typography h6 | `admin:fftt.accessDeniedTitle` |
| 1036 | `Superadmin access required.` | Alert | `admin:fftt.accessDenied` |
| 1047 | `FF-T2T Uploader` | Typography h4 | `admin:fftt.title` |
| 1049 | `Upload GPT-generated economic events to seed the canonical collection.` | Typography | `admin:fftt.description` |
| 1058 | `Validate JSON` | Button | `admin:fftt.validateButton` |
| 1065 | `Upload ({selectedEventIndices.length})` | Button | `admin:fftt.uploadButton` |
| 1072 | `Clear All` | Button | `actions:clearAll` |
| 1088 | `Validation Issues ({validationErrors.length})` | Typography | `admin:fftt.validationIssuesTitle` |
| 1095 | `#{issue.index + 1} {issue.name}` | Typography | `admin:fftt.issueItem` |
| 1108 | `+{validationErrors.length - 8} more issues` | Typography | `admin:fftt.moreIssues` |
| 1122 | `Validated Events Preview` | Typography | `admin:fftt.previewTitle` |
| 1124 | `{validatedEvents.length} valid event(s) • {selectedEventIndices.length} selected for upload` | Typography | `admin:fftt.previewStats` |
| 1027 | `Select a JSON file first.` | Error | `admin:fftt.selectFileFirst` |
| 1012 | `Select at least one event to upload.` | Error | `admin:fftt.selectEventsFirst` |
| 1020 | `JSON must be an array or { "events": [] }.` | Error | `validation:invalidJsonStructure` |
| 1038 | `${issues.length} event(s) have validation errors. Fix before uploading.` | Error | `validation:validationErrorsExist` |
| 1041 | `✓ Upload complete. Created ${created}, merged ${merged}, skipped ${skipped}, errors ${errors}.` | Success message | `admin:fftt.uploadSuccess` |

---

### 4. **UnsavedChangesModal.jsx**
**File:** [src/components/UnsavedChangesModal.jsx](src/components/UnsavedChangesModal.jsx)  
**Priority:** MEDIUM - Already uses some i18n-friendly defaults  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 40 | `Unsaved Changes` | Dialog title (default) | `dialogs:unsavedChangesTitle` |
| 41 | `You have unsaved changes. If you close now, your changes will be lost.` | Dialog message (default) | `dialogs:unsavedChangesMessage` |
| 41 | `Discard Changes` | Button (default) | `dialogs:discardChanges` |
| 42 | `Continue Editing` | Button (default) | `dialogs:continueEditing` |

---

### 5. **RoadmapModal.jsx**
**File:** [src/components/RoadmapModal.jsx](src/components/RoadmapModal.jsx)  
**Priority:** MEDIUM - Simple modal with minimal strings  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 48 | `Roadmap` | Dialog title | `dialogs:roadmapTitle` |
| 62 | `🚀 We're working on exciting updates for Time 2 Trade!` | Typography | `dialogs:roadmapMessage1` |
| 65 | `Check back soon for details.` | Typography | `dialogs:roadmapMessage2` |
| 72 | `Got it` | Button | `actions:gotIt` |

---

### 6. **TimezoneModal.jsx**
**File:** [src/components/TimezoneModal.jsx](src/components/TimezoneModal.jsx)  
**Priority:** MEDIUM - Timezone selection dialog  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 63 | Typography variant h6 (hardcoded title) | Dialog title | `dialogs:selectTimezone` |
| 69 | `close` | aria-label (IconButton) | `actions:closeDialog` |

---

### 7. **TimeSettings.jsx**
**File:** [src/components/TimeSettings.jsx](src/components/TimeSettings.jsx)  
**Priority:** LOW - Tooltips only  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 10 | `Settings for displaying time countdowns` | Tooltip | `tooltips:timeSettings` |
| 25 | `Display the time remaining until the current session ends` | Tooltip | `tooltips:timeToEnd` |
| 40 | `Display the time until the next session starts` | Tooltip | `tooltips:timeToStart` |

---

### 8. **TimeStatus.jsx**
**File:** [src/components/TimeStatus.jsx](src/components/TimeStatus.jsx)  
**Priority:** LOW - Dynamic tooltips  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 10 | `Time to end: ${formatTime(timeToEnd)}` | Tooltip | `tooltips:timeToEnd` |
| 20 | `Starts in: ${formatTime(timeToStart)}` | Tooltip | `tooltips:timeToStart` |

---

### 9. **TermsPage.jsx**
**File:** [src/components/TermsPage.jsx](src/components/TermsPage.jsx)  
**Priority:** LOW - Legal content (static page)  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 297 | `Time 2 Trade - Return to home` | aria-label | `a11y:returnHome` |
| 323-407 | Multiple heading & list items (legal text) | Legal content | `legal:terms.*` |

---

### 10. **RemindersEditor2.jsx**
**File:** [src/components/RemindersEditor2.jsx](src/components/RemindersEditor2.jsx)  
**Priority:** MEDIUM - Reminders UI (see usage of t() - mostly migrated)  

**Status:** PARTIALLY MIGRATED - Uses `useTranslation()` but some strings remain:

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 173 | `t('reminders:permissions.browserError')` | Already i18n | ✓ |
| 191 | `t('reminders:permissions.pushError')` | Already i18n | ✓ |
| 208 | `Failed to save reminder:` | console.error | `admin:reminders.saveFailed` |
| 246 | `(warning.main)` color | Visual only | - |
| 248 | Typography display | Uses t() | ✓ |
| 253 | `label={formatChannels(reminder)}` | Dynamic label | ✓ |

---

### 11. **UserAvatar.jsx**
**File:** [src/components/UserAvatar.jsx](src/components/UserAvatar.jsx)  
**Priority:** LOW - aria-labels  

| Line | String | Type | Suggested Namespace |
|------|--------|------|---------------------|
| 89 | `${userDisplayName} menu` | aria-label | `a11y:userMenu` |

---

## Migration Strategy

### Phase 1: Namespace Setup (ADMIN)
Create i18n namespace file: `src/i18n/admin.json`
```json
{
  "export": {
    "accessDenied": "Access Denied",
    "noPermission": "This page requires superadmin role...",
    "noEventsFound": "No events found...",
    "title": "Export Canonical Events",
    "description": "Export all unified economic events...",
    "infoBox": "Canonical Collection...",
    "buttonLabel": "Download Canonical Events",
    "successTitle": "Export Successful",
    "downloadedFile": "Downloaded: {{filename}}",
    "totalEvents": "Total Events",
    "eventCount": "{{count}} events exported",
    "collectionPath": "Collection Path",
    "exportTime": "Export Time",
    "fileMoveNote": "File downloaded to Downloads folder...",
    "exportAnother": "Export Another",
    "failureTitle": "Export Failed",
    "specTitle": "Export Specification",
    "spec": {
      "path": "Path: {{path}}",
      "fields": "Fields: {{fields}}",
      "format": "Format: {{format}}",
      "timestamps": "Timestamps: {{timestamps}}",
      "priority": "Priority Order: {{priority}}"
    }
  },
  "upload": {
    "requiresAuth": "You must be logged in to Firebase Authentication...",
    "loginFirst": "Please log in to your Firebase account first...",
    "authState": "Current auth state: {{state}}",
    "loggedInAs": "Logged in as: {{email}}",
    "protectedTitle": "Protected Page",
    "passwordPrompt": "Please enter the password to access the upload page.",
    "title": "Upload Economic Event Descriptions",
    "instructions": "Select the economicEventDescriptions.json file...",
    "button": "Upload to Firestore",
    "uploadedEvents": "Uploaded Events ({{count}})"
  },
  "fftt": {
    "accessDenied": "Superadmin access required.",
    "accessDeniedTitle": "FF-T2T Uploader",
    "title": "FF-T2T Uploader",
    "description": "Upload GPT-generated economic events to seed the canonical collection.",
    "dropzoneHint": "Drag & drop JSON file here or click to browse",
    "searchLabel": "Search by name",
    "searchPlaceholder": "Filter events...",
    "validateButton": "Validate JSON",
    "uploadButton": "Upload ({{count}})",
    "statusNew": "New",
    "newEventTooltip": "New event (no existing match found)",
    "statusMatched": "Matched",
    "matchedTooltip": "Click to compare sources • {{name}} ({{similarity}}% similar)",
    "statusChecking": "Checking...",
    "fieldDifferencesTitle": "Field Differences (Incoming vs Matched):",
    "newValue": "New Value:",
    "existingValue": "Existing Value:",
    "perfectMatch": "✓ No field differences - events match perfectly",
    "detailsLoadFailed": "Failed to load matched event details",
    "validationIssuesTitle": "Validation Issues ({{count}})",
    "issueItem": "#{{index}} {{name}}",
    "moreIssues": "+{{count}} more issues",
    "previewTitle": "Validated Events Preview",
    "previewStats": "{{validCount}} valid event(s) • {{selectedCount}} selected for upload",
    "matchingError": "Event matching error: {{error}}",
    "detailsFetchError": "Error fetching matched event details: {{error}}",
    "selectFileFirst": "Select a JSON file first.",
    "selectEventsFirst": "Select at least one event to upload.",
    "uploadSuccess": "✓ Upload complete. Created {{created}}, merged {{merged}}, skipped {{skipped}}, errors {{errors}}."
  },
  "reminders": {
    "saveFailed": "Failed to save reminder: {{error}}"
  }
}
```

### Phase 2: Update Components
Update each component to use `useTranslation()` and wrap hardcoded strings with `t()` calls.

### Phase 3: Add Translations
Create Spanish (ES) and French (FR) translations in corresponding namespace files.

### Phase 4: Verification
- Run i18n audit to confirm all strings migrated
- Test all components with different languages
- Verify dynamic strings (counts, names, etc.) interpolate correctly

---

## Implementation Checklist

- [ ] Create `src/i18n/admin.json` with admin namespace
- [ ] Update `ExportEvents.jsx` to use i18n
- [ ] Update `UploadDescriptions.jsx` to use i18n
- [ ] Update `FFTTUploader.jsx` to use i18n
- [ ] Update `UnsavedChangesModal.jsx` to use i18n
- [ ] Update `RoadmapModal.jsx` to use i18n
- [ ] Update `TimezoneModal.jsx` to use i18n
- [ ] Update `TimeSettings.jsx` to use i18n
- [ ] Update `TimeStatus.jsx` to use i18n
- [ ] Update `TermsPage.jsx` to use i18n (legal content)
- [ ] Update `UserAvatar.jsx` aria-labels
- [ ] Create ES translations for all namespaces
- [ ] Create FR translations for all namespaces
- [ ] Run final audit to verify 100% coverage

---

## Notes

1. **Dynamic Strings:** Use interpolation for dynamic values (counts, names, file names)
   - Example: `t('admin:fftt.uploadButton', { count: selectedEventIndices.length })`

2. **Aria-labels & Accessibility:** Include accessibility strings in i18n
   - Ensure tooltips, aria-labels, and help text are translatable

3. **Console Messages:** Migrate console.error/warn messages to i18n for consistency

4. **Legal Content:** TermsPage can use a separate `legal` namespace for large content blocks

5. **Interpolation Variables:** Use consistent naming across namespaces:
   - `{{count}}`, `{{email}}`, `{{filename}}`, `{{index}}`, `{{name}}`

---

**Last Updated:** January 24, 2026  
**Target Completion:** Phase 3 of i18n migration
