/**
 * kb/knowledge/SETTINGSSIDEBAR2_AUDIT_PHASE2_DAY3.md
 * 
 * Purpose: Complete audit of SettingsSidebar2.jsx hardcoded strings
 * Objective: Identify all 120+ hardcoded strings for i18n extraction
 * Date: January 24, 2026
 * Phase: Phase 2, Day 3
 */

# SettingsSidebar2.jsx - Complete i18n Audit

**Component:** `src/components/SettingsSidebar2.jsx`  
**File Size:** 1,364 lines  
**Current Status:** No i18n integration (100% hardcoded strings)  
**Estimated Strings:** 120+ hardcoded strings across 8 categories  

## 📊 Audit Summary

| Category | Count | Keys | Priority | Status |
|----------|-------|------|----------|--------|
| Navigation | 3 | nav items | HIGH | ⏳ |
| Visibility Toggles | 10 | labels + descriptions | HIGH | ⏳ |
| Clock Controls | 5 | labels + descriptions | HIGH | ⏳ |
| Background | 1 | label + description | MEDIUM | ⏳ |
| Sessions | 8 | labels + form fields | HIGH | ⏳ |
| About Tab | 3 | headings + footer links | MEDIUM | ⏳ |
| Admin Controls | 9 | buttons + confirmations | MEDIUM | ⏳ |
| Modals | 5 | confirmations + errors | HIGH | ⏳ |
| **TOTAL** | **44** | **keys** | — | ⏳ |

---

## 🔍 Detailed String Mapping

### 1. Navigation Items (3 strings) → `settings.navigation`

```javascript
// Line 80-82: navItems array
{ key: 'general', label: 'General', ... },
{ key: 'session', label: 'Sessions', ... },
{ key: 'about', label: 'About', ... },
```

**i18n Keys:**
```json
"navigation": {
  "general": "General",
  "sessions": "Sessions",
  "about": "About"
}
```

---

### 2. Visibility Section - Analog Clock (10 strings) → `settings.general.visibility`

#### 2.1 Main Toggle
```javascript
// Line 422-425
'Analog Hand Clock'
'Analog with sessions'
```

#### 2.2 Child Toggles (3 sub-toggles)
```javascript
// Line 463-470: Events on Canvas
'Events on canvas'
'Display economic event markers on the analog face'

// Line 489-496: Session Names
'Session names'
'Display session names curved along the session donuts'

// Line 515-522: Gray Past Sessions
'Gray past sessions'
'Dim session donuts that have already ended today'

// Line 541-548: Numbers
'Numbers'
'Display 1-12 clock numbers on the analog face'

// Line 567-574: Seconds Hand
'Seconds Hand'
'Display seconds hand on the clock (hour and minute hands always visible)'
```

**i18n Keys:**
```json
"general": {
  "visibility": {
    "title": "Visibility",
    "analogClock": {
      "label": "Analog Hand Clock",
      "description": "Analog with sessions"
    },
    "eventsOnCanvas": {
      "label": "Events on canvas",
      "description": "Display economic event markers on the analog face"
    },
    "sessionNames": {
      "label": "Session names",
      "description": "Display session names curved along the session donuts"
    },
    "pastSessionsGray": {
      "label": "Gray past sessions",
      "description": "Dim session donuts that have already ended today"
    },
    "clockNumbers": {
      "label": "Numbers",
      "description": "Display 1-12 clock numbers on the analog face"
    },
    "clockHands": {
      "label": "Seconds Hand",
      "description": "Display seconds hand on the clock (hour and minute hands always visible)"
    }
  }
}
```

---

### 3. Clock Controls (5 strings) → `settings.general.visibility`

```javascript
// Line 594-597: Digital Clock
'Digital Clock'
'Readable digits'

// Line 619-622: Session Label
'Session Label'
'Current session tag'

// Line 662-669: Countdown to Start
'Countdown to Start'
'Display time until next session begins'

// Line 682-689: Countdown to End
'Countdown to End'
'Display remaining time until active session ends'
```

**i18n Keys (continued):**
```json
"general": {
  "visibility": {
    "digitalClock": {
      "label": "Digital Clock",
      "description": "Readable digits"
    },
    "sessionLabel": {
      "label": "Session Label",
      "description": "Current session tag"
    },
    "timeToStart": {
      "label": "Countdown to Start",
      "description": "Display time until next session begins"
    },
    "timeToEnd": {
      "label": "Countdown to End",
      "description": "Display remaining time until active session ends"
    }
  }
}
```

---

### 4. Background Section (1 string) → `settings.general.background`

```javascript
// Line 711: Overline label
'Background'

// Line 725-726: Session-based Background
'Session-based Background'
'Automatically shift background color to match the active session'
```

**i18n Keys:**
```json
"general": {
  "background": {
    "title": "Background",
    "sessionBased": {
      "label": "Session-based Background",
      "description": "Automatically shift background color to match the active session"
    }
  }
}
```

---

### 5. Reset Button (1 string) → `settings.general`

```javascript
// Line 742: Reset button
'Reset to Default Settings'
```

**i18n Keys:**
```json
"general": {
  "resetButton": "Reset to Default Settings"
}
```

---

### 6. Sessions Section (8 strings) → `settings.sessions`

```javascript
// Line 753-754: Section header
'Session schedule'
'Edit your trading sessions. Auth is required to sync changes.'

// Line 756: Overline
'Sessions'

// Line 779: Session number label
'Session {index + 1}'

// Line 793: Name field label
'Name'

// Line 810: Start Time label
'Start Time'

// Line 818: End Time label
'End Time'

// Line 826: Color label
'Color'

// Line 788: Delete button aria-label
'Clear session {index + 1}'

// Line 797 (placeholder):
'Session {index + 1} Name'
```

**i18n Keys:**
```json
"sessions": {
  "title": "Session schedule",
  "subtitle": "Edit your trading sessions. Auth is required to sync changes.",
  "sectionLabel": "Sessions",
  "sessionLabel": "Session {{number}}",
  "clearButtonLabel": "Clear session {{number}}",
  "form": {
    "nameLabel": "Name",
    "namePlaceholder": "Session {{number}} Name",
    "startTimeLabel": "Start Time",
    "endTimeLabel": "End Time",
    "colorLabel": "Color"
  }
}
```

---

### 7. About Tab (3 strings) → `settings.about` + `settings.footer`

```javascript
// Line 885: Main heading
'About'

// Line 896: Subtitle
(dynamically loaded from aboutContent, but needs label)

// Line 925-931: Read Full Page link
'Read Full About Page'

// Line 939-943: Contact link
'Have questions? Contact us'
```

**i18n Keys:**
```json
"about": {
  "title": "About"
},
"footer": {
  "readFullPage": "Read Full About Page",
  "contactLink": "Have questions? Contact us"
}
```

---

### 8. Admin Sync Controls (6 strings) → `settings.admin`

```javascript
// Line 198 (window.confirm):
'Sync this week from NFS now? This may take a few seconds.'

// Line 205:
'Synced NFS weekly schedule.'

// Line 207:
'Failed to sync NFS week.'

// Line 210:
'Failed to sync NFS week.'

// Line 219 (window.confirm):
'Sync today\'s actuals from JBlanked (all sources)? This may take a few seconds.'

// Line 226:
'Synced JBlanked actuals.'

// Line 228:
'Failed to sync JBlanked actuals.'

// Line 231:
'Failed to sync JBlanked actuals.'

// Line 240 (window.confirm):
'Backfill Forex Factory events since 01/01/26? This may take several minutes.'

// Line 247:
'Backfilled Forex Factory events since 01/01/26.'

// Line 249:
'Failed to backfill Forex Factory events.'

// Line 252:
'Failed to backfill Forex Factory events.'
```

**i18n Keys:**
```json
"admin": {
  "syncWeekNFS": "Sync Week NFS",
  "syncActualsJBlanked": "Sync Today's Actuals (JBlanked)",
  "syncForexFactory": "Backfill Forex Factory",
  "confirmSyncNFS": "Sync this week from NFS now? This may take a few seconds.",
  "confirmSyncActuals": "Sync today's actuals from JBlanked (all sources)? This may take a few seconds.",
  "confirmSyncForexFactory": "Backfill Forex Factory events since 01/01/26? This may take several minutes.",
  "successSyncNFS": "Synced NFS weekly schedule.",
  "successSyncActuals": "Synced JBlanked actuals.",
  "successSyncForexFactory": "Backfilled Forex Factory events since 01/01/26.",
  "errorSyncNFS": "Failed to sync NFS week.",
  "errorSyncActuals": "Failed to sync JBlanked actuals.",
  "errorSyncForexFactory": "Failed to backfill Forex Factory events."
}
```

---

### 9. Modal Confirmations (2 strings) → `settings.modals`

```javascript
// Line 278: Toggle Error
'At least one of the main clock elements must be enabled.'

// Implied confirmation for session clear (from handleRequestClearSession):
'Clear Session?'
'This will reset the session name, start time, and end time.'
```

**i18n Keys:**
```json
"modals": {
  "confirmReset": "Reset all settings to default values?",
  "clearSession": "Clear Session {{number}}?",
  "clearSessionInfo": "This will reset the session name, start time, and end time."
},
"errors": {
  "minimumToggle": "At least one of the main clock elements must be enabled."
}
```

---

## 📋 Complete i18n Namespace Structure

**File:** `src/i18n/locales/en/settings.json`

```json
{
  "navigation": {
    "general": "General",
    "sessions": "Sessions",
    "about": "About"
  },
  "general": {
    "visibility": {
      "title": "Visibility",
      "analogClock": {
        "label": "Analog Hand Clock",
        "description": "Analog with sessions"
      },
      "digitalClock": {
        "label": "Digital Clock",
        "description": "Readable digits"
      },
      "clockNumbers": {
        "label": "Numbers",
        "description": "Display 1-12 clock numbers on the analog face"
      },
      "clockHands": {
        "label": "Seconds Hand",
        "description": "Display seconds hand on the clock (hour and minute hands always visible)"
      },
      "eventsOnCanvas": {
        "label": "Events on canvas",
        "description": "Display economic event markers on the analog face"
      },
      "sessionNames": {
        "label": "Session names",
        "description": "Display session names curved along the session donuts"
      },
      "sessionLabel": {
        "label": "Session Label",
        "description": "Current session tag"
      },
      "timeToStart": {
        "label": "Countdown to Start",
        "description": "Display time until next session begins"
      },
      "timeToEnd": {
        "label": "Countdown to End",
        "description": "Display remaining time until active session ends"
      },
      "pastSessionsGray": {
        "label": "Gray past sessions",
        "description": "Dim session donuts that have already ended today"
      }
    },
    "background": {
      "title": "Background",
      "sessionBased": {
        "label": "Session-based Background",
        "description": "Automatically shift background color to match the active session"
      }
    },
    "resetButton": "Reset to Default Settings"
  },
  "sessions": {
    "title": "Session schedule",
    "subtitle": "Edit your trading sessions. Auth is required to sync changes.",
    "sectionLabel": "Sessions",
    "sessionLabel": "Session {{number}}",
    "clearButtonLabel": "Clear session {{number}}",
    "form": {
      "nameLabel": "Name",
      "namePlaceholder": "Session {{number}} Name",
      "startTimeLabel": "Start Time",
      "endTimeLabel": "End Time",
      "colorLabel": "Color",
      "deleteConfirm": "Delete this session?"
    }
  },
  "about": {
    "title": "About"
  },
  "account": {
    "title": "Account",
    "logoutConfirm": "Logout and lose local settings?",
    "logoutButton": "Logout"
  },
  "admin": {
    "syncWeekNFS": "Sync Week NFS",
    "syncActualsJBlanked": "Sync Today's Actuals (JBlanked)",
    "syncForexFactory": "Backfill Forex Factory",
    "confirmSyncNFS": "Sync this week from NFS now? This may take a few seconds.",
    "confirmSyncActuals": "Sync today's actuals from JBlanked (all sources)? This may take a few seconds.",
    "confirmSyncForexFactory": "Backfill Forex Factory events since 01/01/26? This may take several minutes.",
    "successSyncNFS": "Synced NFS weekly schedule.",
    "successSyncActuals": "Synced JBlanked actuals.",
    "successSyncForexFactory": "Backfilled Forex Factory events since 01/01/26.",
    "errorSyncNFS": "Failed to sync NFS week.",
    "errorSyncActuals": "Failed to sync JBlanked actuals.",
    "errorSyncForexFactory": "Failed to backfill Forex Factory events."
  },
  "modals": {
    "confirmReset": "Reset all settings to default values?",
    "clearSession": "Clear Session {{number}}?",
    "clearSessionInfo": "This will reset the session name, start time, and end time.",
    "contact": "Have questions? Contact us"
  },
  "errors": {
    "minimumToggle": "At least one of the main clock elements must be enabled."
  },
  "footer": {
    "readFullPage": "Read Full About Page",
    "contactLink": "Have questions? Contact us"
  }
}
```

---

## 🎯 Translation Requirements

### Spanish (es/settings.json)
- Navigation items: Simple translations
- UI labels: Match existing Spanish vocabulary from auth.json
- Descriptions: Clear, concise trading-focused language
- Admin controls: Technical accuracy for sync operations

### French (fr/settings.json)
- Navigation items: Professional French UI terminology
- Descriptions: Culturally adapted for French traders
- Formal tone (using "vous" where applicable)
- Admin controls: Match French technical vocabulary

---

## ✅ Extraction Checklist

- [ ] Create `en/settings.json` with all 44 top-level namespace keys
- [ ] Verify no duplicate keys
- [ ] Validate JSON syntax
- [ ] Create `es/settings.json` with Spanish translations
- [ ] Create `fr/settings.json` with French translations
- [ ] Test: All strings render correctly
- [ ] Test: No console errors about missing keys
- [ ] Test: Language switching updates all labels
- [ ] Build: `npm run build` passes
- [ ] Git commit Phase 2 Day 3 extraction

---

## 📈 Migration Path

**Phase 2 Day 3:**
1. ✅ Complete this audit
2. ⏳ Extract strings to i18n JSON files (EN/ES/FR)
3. ⏳ Prepare component for migration

**Phase 2 Day 4:**
1. ⏳ Migrate SettingsSidebar2.jsx to use `useTranslation()` hook
2. ⏳ Replace all hardcoded strings with `t()` calls
3. ⏳ Test all languages
4. ⏳ Commit v2.0.0

---

## 🔗 Related Files

- `src/i18n/config.js` - i18n configuration
- `src/i18n/locales/en/auth.json` - Existing auth namespace (reference)
- `src/i18n/locales/en/common.json` - Common UI terms
- `src/i18n/locales/en/settings.json` - **TARGET FILE** (to be created)

---

**Status:** Ready for extraction  
**Next Step:** Create EN/ES/FR settings.json files with audit mappings  
**Estimated Duration:** 2-3 hours (extraction) + 4-6 hours (component migration)
