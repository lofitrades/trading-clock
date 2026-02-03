# Hardcoded Strings Quick Reference - Summary Table

## ALL REMAINING HARDCODED STRINGS BY COMPONENT

### Admin Components (HIGH PRIORITY)

| Component | Line(s) | String | Type | Suggested Namespace |
|-----------|---------|--------|------|---------------------|
| **ExportEvents.jsx** | 79 | Access Denied | Typography | `admin:export.accessDenied` |
| | 82 | This page requires superadmin role... | Alert | `admin:export.noPermission` |
| | 170 | No events found in canonical collection. | Error | `admin:export.noEventsFound` |
| | 240 | Back | Button | `actions:back` |
| | 245 | Export Canonical Events | H4 Title | `admin:export.title` |
| | 250 | Export all unified economic events... | Typography | `admin:export.description` |
| | 254 | Canonical Collection info... | Alert | `admin:export.infoBox` |
| | 263 | Exporting Events... / Download Canonical Events | Button | `admin:export.buttonLabel` |
| | 277 | Export Successful | H6 | `admin:export.successTitle` |
| | 282 | 📥 Downloaded: {filename} | Typography | `admin:export.downloadedFile` |
| | 286-337 | Export specification list items (Path, Fields, Format, etc.) | List items | `admin:export.spec.*` |
| **UploadDescriptions.jsx** | 185 | Loading... | Typography | `states:loading` |
| | 204 | You must be logged in to Firebase... | Alert | `admin:upload.requiresAuth` |
| | 207 | Please log in to your Firebase account... | Typography | `admin:upload.loginFirst` |
| | 210 | Current auth state: ... | Typography | `admin:upload.authState` |
| | 222 | Logged in as: {email} | Alert | `admin:upload.loggedInAs` |
| | 226 | Protected Page | H5 | `admin:upload.protectedTitle` |
| | 230 | Please enter the password to access... | Typography | `admin:upload.passwordPrompt` |
| | 256 | Enter password | Placeholder | `form:enterPassword` |
| | 264 | Incorrect password. Please try again. | Alert | `validation:incorrectPassword` |
| | 269 | Submit | Button | `actions:submit` |
| | 299 | Upload Economic Event Descriptions | H4 | `admin:upload.title` |
| | 303 | Select the economicEventDescriptions.json file... | Typography | `admin:upload.instructions` |
| | 317 | Select JSON File | Button | `actions:selectFile` |
| | 330 | Selected: {filename} | Alert | `notifications:fileSelected` |
| | 337 | Upload to Firestore | Button | `admin:upload.button` |
| | 353 | {percentage}% Complete | Typography | `notifications:percentComplete` |
| | 368 | {success message} | Alert | `notifications:success` |
| | 376 | Uploaded Events ({count}) | H6 | `admin:upload.uploadedEvents` |
| | 421 | Instructions: | Typography | `actions:instructions` |
| **FFTTUploader.jsx** | 67 | Missing event.name | Validation | `validation:missingEventName` |
| | 70 | Missing event.datetimeUtc | Validation | `validation:missingDatetime` |
| | 224 | Drag & drop JSON file here or click to browse | Box text | `admin:fftt.dropzoneHint` |
| | 233 | Browse | Button | `actions:browse` |
| | 268 | Ready: {filename} | Chip | `notifications:fileReady` |
| | 468 | Search by name | Label | `admin:fftt.searchLabel` |
| | 475 | Filter events... | Placeholder | `admin:fftt.searchPlaceholder` |
| | 481 | Date from | Label | `form:dateFrom` |
| | 492 | Date to | Label | `form:dateTo` |
| | 500 | Reset | Button | `actions:reset` |
| | 511 | Showing {x} of {y} events | Typography | `admin:fftt.showingEvents` |
| | 516 | {count} selected | Chip | `notifications:selected` |
| | 556 | # | TableCell | `admin:fftt.indexHeader` |
| | 573 | Status | TableCell | `admin:fftt.statusHeader` |
| | 686 | New event (no existing match found) | Tooltip | `admin:fftt.newEventTooltip` |
| | 691 | New | Chip | `admin:fftt.statusNew` |
| | 698 | Click to compare sources... | Tooltip | `admin:fftt.matchedTooltip` |
| | 705 | Matched | Chip | `admin:fftt.statusMatched` |
| | 710 | Checking... | Chip | `admin:fftt.statusChecking` |
| | 770 | Loading matched event details... | Typography | `notifications:loadingDetails` |
| | 777 | Matched Event: {name} | Typography | `admin:fftt.matchedEventTitle` |
| | 787 | Field Differences (Incoming vs Matched): | Typography | `admin:fftt.fieldDifferencesTitle` |
| | 812 | New Value: | Typography | `admin:fftt.newValue` |
| | 819 | Existing Value: | Typography | `admin:fftt.existingValue` |
| | 836 | ✓ No field differences - events match perfectly | Typography | `admin:fftt.perfectMatch` |
| | 840 | Failed to load matched event details | Typography | `admin:fftt.detailsLoadFailed` |
| | 849 | No events match filters. | Typography | `notifications:noResults` |
| | 1029 | Loading... | Typography | `states:loading` |
| | 1035 | FF-T2T Uploader | H6 | `admin:fftt.accessDeniedTitle` |
| | 1036 | Superadmin access required. | Alert | `admin:fftt.accessDenied` |
| | 1047 | FF-T2T Uploader | H4 | `admin:fftt.title` |
| | 1049 | Upload GPT-generated economic events... | Typography | `admin:fftt.description` |
| | 1058 | Validate JSON | Button | `admin:fftt.validateButton` |
| | 1065 | Upload ({count}) | Button | `admin:fftt.uploadButton` |
| | 1072 | Clear All | Button | `actions:clearAll` |
| | 1088 | Validation Issues ({count}) | Typography | `admin:fftt.validationIssuesTitle` |
| | 1108 | +{count} more issues | Typography | `admin:fftt.moreIssues` |
| | 1122 | Validated Events Preview | Typography | `admin:fftt.previewTitle` |
| | 1124 | {validCount} valid... {selectedCount} selected... | Typography | `admin:fftt.previewStats` |
| | 1012 | Select a JSON file first. | Error | `admin:fftt.selectFileFirst` |
| | 1020 | Select at least one event to upload. | Error | `admin:fftt.selectEventsFirst` |
| | 1041 | ✓ Upload complete. Created... | Success | `admin:fftt.uploadSuccess` |

### Modal Components (MEDIUM PRIORITY)

| Component | Line(s) | String | Type | Suggested Namespace |
|-----------|---------|--------|------|---------------------|
| **UnsavedChangesModal.jsx** | 40 | Unsaved Changes | Title | `dialogs:unsavedChangesTitle` |
| | 41 | You have unsaved changes... | Message | `dialogs:unsavedChangesMessage` |
| | 41 | Discard Changes | Button | `dialogs:discardChanges` |
| | 42 | Continue Editing | Button | `dialogs:continueEditing` |
| **RoadmapModal.jsx** | 48 | Roadmap | Title | `dialogs:roadmapTitle` |
| | 62 | 🚀 We're working on exciting updates... | Typography | `dialogs:roadmapMessage1` |
| | 65 | Check back soon for details. | Typography | `dialogs:roadmapMessage2` |
| | 72 | Got it | Button | `actions:gotIt` |
| **TimezoneModal.jsx** | 63 | [Modal title] | Title | `dialogs:selectTimezone` |
| | 69 | close | aria-label | `a11y:closeDialog` |

### Utility Components (LOW-MEDIUM PRIORITY)

| Component | Line(s) | String | Type | Suggested Namespace |
|-----------|---------|--------|------|---------------------|
| **TimeSettings.jsx** | 10 | Settings for displaying time countdowns | Tooltip | `tooltips:timeSettings` |
| | 25 | Display the time remaining... | Tooltip | `tooltips:timeToEnd` |
| | 40 | Display the time until next session... | Tooltip | `tooltips:timeToStart` |
| **TimeStatus.jsx** | 10 | Time to end: {time} | Tooltip | `tooltips:timeToEnd` |
| | 20 | Starts in: {time} | Tooltip | `tooltips:timeToStart` |
| **TermsPage.jsx** | 297 | Time 2 Trade - Return to home | aria-label | `a11y:returnHome` |
| **UserAvatar.jsx** | 89 | {displayName} menu | aria-label | `a11y:userMenu` |

---

## Namespace Hierarchy Recommendation

```
i18n/
├── admin.json          (NEW - Admin components: export, upload, fftt)
├── dialogs.json        (EXISTING - Modal strings)
├── actions.json        (EXISTING - Button labels: back, submit, reset, etc.)
├── form.json           (EXISTING - Form inputs: labels, placeholders)
├── validation.json     (EXISTING - Validation messages)
├── notifications.json  (EXISTING - User feedback: success, error, loading)
├── states.json         (EXISTING - UI states: loading, error, success)
├── tooltips.json       (EXISTING - Tooltip text)
└── a11y.json           (NEW - Accessibility: aria-labels)
```

---

## Statistics

| Metric | Count |
|--------|-------|
| **Total Hardcoded Strings** | **85+** |
| Admin Components | 45+ |
| Modal Components | 10+ |
| Utility Components | 30+ |
| **Unique Namespaces Required** | **8-9** |
| Namespaces Existing | 6 |
| Namespaces to Create | 2-3 |

---

## Next Steps

1. ✅ **Audit Complete** - All hardcoded strings identified
2. 📋 **Create Namespace** - Add `admin.json` and `a11y.json`
3. 🔧 **Update Components** - Migrate 3 admin components first
4. 🌐 **Add Translations** - ES/FR translations for new namespaces
5. ✓ **Verify Coverage** - Run final i18n audit

---

**Document Location:** `/HARDCODED_STRINGS_AUDIT.md`  
**Quick Reference:** This file (`HARDCODED_STRINGS_QUICK_REF.md`)  
**Last Updated:** January 24, 2026
