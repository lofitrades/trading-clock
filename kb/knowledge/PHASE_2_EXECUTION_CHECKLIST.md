/**
 * kb/knowledge/PHASE_2_EXECUTION_CHECKLIST.md
 * 
 * Purpose: Daily task checklist for Phase 2 (String Extraction & Component Migration)
 * Audience: Development team executing Phase 2
 * Timeline: January 27 - February 7, 2026
 */

# Phase 2 Execution Checklist

**Status:** READY FOR EXECUTION  
**Start Date:** January 27, 2026 (Monday)  
**End Date:** February 7, 2026 (Friday)  
**Duration:** 8-10 business days  
**Daily Pattern:** 2-3 components per week for sustained progress

---

## 📋 Master Progress Tracking

```
WEEK 1 (Jan 27 - Jan 31)
├─ LandingPage ............... [ ] Day 1-2
├─ AuthModal2 ................ [ ] Day 3-4
└─ QA & Review ............... [ ] Day 5

WEEK 2 (Feb 3 - Feb 7)
├─ SettingsSidebar2 .......... [ ] Day 1-2
├─ EventModal ................ [ ] Day 2-3
├─ CalendarEmbed ............. [ ] Day 3-4
├─ CustomEventDialog ......... [ ] Day 4-5
└─ Final QA .................. [ ] Day 5

Total: 6 tier-1/2 components extracted + 2 tier-3 (optional if time)
Target: 350+ strings migrated to phase 2
```

---

## 🏆 Component 1: LandingPage (~100 strings)

### Status: NOT STARTED

#### Day 1: Audit & Documentation
**Time: 2 hours**  
**Owner: [Name]**

- [ ] Open [pages/index.page.jsx](pages/index.page.jsx) in VS Code
- [ ] Search for all quoted strings (`"` and `'`)
- [ ] Create master spreadsheet row for each string:
  - Component: LandingPage
  - File: pages/index.page.jsx
  - Line number: [line]
  - String: [exact text]
  - Type: UI/SEO/CTA/Legal
  - Namespace: pages.landing
  - Key: [proposed key]
  - Priority: High
  - Status: To Extract

- [ ] Group strings by section:
  - [ ] Hero section (headline, subheadline, tagline) - 8 strings
  - [ ] Benefits section (4 statements + descriptions) - 12 strings
  - [ ] Features section (6 blocks × 3-4 strings) - 20 strings
  - [ ] Use cases section (4 scenarios × 3-4 strings) - 16 strings
  - [ ] FAQ section (6 Q&A pairs) - 12 strings
  - [ ] CTA buttons - 6 strings
  - [ ] Nav/footer - 8 strings

- [ ] Create Google Sheets link (share with translators)
- [ ] Document all 80-100 strings in spreadsheet
- [ ] Double-check no strings missed (grep: `grep -r "'[A-Z]" pages/index.page.jsx`)
- [ ] Mark status: AUDIT COMPLETE

#### Day 2: JSON Creation & Component Update
**Time: 2 hours**  
**Owner: [Name]**

- [ ] Update `src/i18n/locales/en/pages.json`:
  ```json
  {
    "landing": {
      "hero": {
        "headline": "Unlock all features",
        "subheading": "Trading Clock + Economic Calendar (NY Time)"
      },
      "benefits": {
        "one": "Trade the right window",
        "two": "Avoid event whiplash"
      },
      "features": { ... },
      "useCases": { ... },
      "faq": { ... },
      "cta": { ... }
    }
  }
  ```

- [ ] Update [pages/index.page.jsx](pages/index.page.jsx):
  ```javascript
  import { useTranslation } from 'react-i18next';
  
  export default function LandingPage() {
    const { t } = useTranslation('pages');
    // Replace all hardcoded strings with t() calls
  }
  ```

- [ ] Compile & test:
  ```bash
  npm run build  # Should compile without errors
  npm run dev    # Should start without errors
  ```

- [ ] Send Spanish/French string list to translator
- [ ] Mark status: COMPONENT UPDATED

#### Translator Coordination
- [ ] Send 100 English strings to translator (day end)
- [ ] Deadline for Spanish translation: Wednesday 5pm
- [ ] Deadline for French translation: Wednesday 5pm
- [ ] Review translations for accuracy, finance terminology

#### Integration (When Translations Ready)
**Time: 1 hour**  
**Owner: [Name]**

- [ ] Receive Spanish translations from translator
- [ ] Create/update `src/i18n/locales/es/pages.json` with Spanish content
- [ ] Receive French translations from translator
- [ ] Create/update `src/i18n/locales/fr/pages.json` with French content
- [ ] Verify all keys match English structure (no missing keys)
- [ ] Test in browser:
  ```javascript
  i18next.changeLanguage('es');  // Should show Spanish
  i18next.changeLanguage('fr');  // Should show French
  ```
- [ ] Mark status: COMPLETE ✅

---

## 🎯 Component 2: AuthModal2 (~40 strings)

### Status: NOT STARTED

#### Day 3: Audit & Documentation
**Time: 1.5 hours**  
**Owner: [Name]**

- [ ] Open [src/components/AuthModal2.jsx](src/components/AuthModal2.jsx)
- [ ] Extract all 40 strings:
  - Headline: "Sign in to your workspace"
  - Tagline: "Trade the right window"
  - Benefits: 4 statements
  - Form labels: Email, password, etc.
  - Error messages: Invalid email, etc.
  - OAuth copy: "Continue with Google"
  - Legal copy: Terms, privacy
  - Messages: "Signing you in...", "Check your inbox"
  - Buttons: "Send link", "Cancel"

- [ ] Document in master spreadsheet
- [ ] Namespace: `auth`
- [ ] Group by section (modal, form, messages, buttons, legal)

#### Day 4: JSON & Component Update
**Time: 1.5 hours**  
**Owner: [Name]**

- [ ] Update `src/i18n/locales/en/auth.json` (add/update existing)
- [ ] Update [src/components/AuthModal2.jsx](src/components/AuthModal2.jsx):
  ```javascript
  import { useTranslation } from 'react-i18next';
  
  const AuthModal2 = () => {
    const { t } = useTranslation('auth');
    // Replace all hardcoded strings with t() calls
  }
  ```
- [ ] Test component in all 3 languages
- [ ] Verify no hardcoded strings remain

#### Translator Coordination
- [ ] Send to translator (Thursday morning)
- [ ] Deadline: Friday EOD (concurrent with LandingPage translations)

---

## 🖼️ Component 3: SettingsSidebar2 (~50 strings)

### Status: NOT STARTED

#### Day 5: QA Phase 1
**Time: 2 hours**  
**Owner: [Name]**

**Before extracting SettingsSidebar2, quality check:**

- [ ] LandingPage compiles ✓
- [ ] AuthModal2 compiles ✓
- [ ] No console errors in either
- [ ] Language switching works for both
- [ ] All strings display in English
- [ ] Responsive design maintained
- [ ] Both components display Spanish (if translations ready)
- [ ] Both components display French (if translations ready)
- [ ] Grep audit confirms no hardcoded strings:
  ```bash
  grep -r "'[A-Z]" pages/index.page.jsx
  grep -r "'[A-Z]" src/components/AuthModal2.jsx
  ```

**If any issues found:**
- [ ] Document in issue tracker
- [ ] Fix before moving to next component
- [ ] Re-test after fix

**Phase 1 Status:**
- [x] LandingPage extracted + migrated
- [x] AuthModal2 extracted + migrated
- [x] Both awaiting professional translations
- [x] QA passed, ready for Phase 2 components

---

## 📅 Week 2 (Feb 3 - Feb 7)

### Component 3: SettingsSidebar2 (~50 strings)

#### Day 1-2: Extraction & Migration
**Time: 2 hours**  
**Owner: [Name]**

- [ ] Audit [src/components/SettingsSidebar2.jsx](src/components/SettingsSidebar2.jsx)
- [ ] Extract all 50 strings (toggle labels, descriptions, etc.)
- [ ] Update `src/i18n/locales/en/settings.json`
- [ ] Update component with `useTranslation('settings')`
- [ ] Test in all 3 languages
- [ ] Send to translator (Thursday morning)

### Component 4: EventModal (~70 strings)

#### Day 2-3: Extraction & Migration
**Time: 2.5 hours**  
**Owner: [Name]**

- [ ] Audit [src/components/EventModal.jsx](src/components/EventModal.jsx)
- [ ] Extract all 70 strings (sections, labels, status, tooltips)
- [ ] Update `src/i18n/locales/en/events.json`
- [ ] Update component with `useTranslation('events')`
- [ ] Test in all 3 languages
- [ ] Send to translator (Friday morning)

### Component 5: CalendarEmbed (~60 strings)

#### Day 3-4: Extraction & Migration
**Time: 2.5 hours**  
**Owner: [Name]**

- [ ] Audit [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx)
- [ ] Extract all 60 strings (columns, filters, buttons, messages)
- [ ] Update `src/i18n/locales/en/calendar.json`
- [ ] Update component with `useTranslation('calendar')`
- [ ] Test in all 3 languages

### Component 6: CustomEventDialog (~45 strings)

#### Day 4-5: Extraction & Migration
**Time: 2 hours**  
**Owner: [Name]**

- [ ] Audit [src/components/CustomEventDialog.jsx](src/components/CustomEventDialog.jsx)
- [ ] Extract all 45 strings (form labels, buttons, validation)
- [ ] Update `src/i18n/locales/en/events.json` (shared namespace)
- [ ] Update component with `useTranslation('events')`
- [ ] Test in all 3 languages

#### Day 5: Final QA & Cleanup
**Time: 3 hours**  
**Owner: [Name]**

- [ ] All 6 components compile without errors ✓
- [ ] No console warnings or errors ✓
- [ ] All components test in 3 languages ✓
- [ ] Responsive design maintained ✓
- [ ] Grep audit confirms no hardcoded strings:
  ```bash
  grep -r "'[A-Z]" src/components/SettingsSidebar2.jsx
  grep -r "'[A-Z]" src/components/EventModal.jsx
  grep -r "'[A-Z]" src/components/CalendarEmbed.jsx
  grep -r "'[A-Z]" src/components/CustomEventDialog.jsx
  ```

- [ ] Collect translations from translator:
  - [ ] LandingPage (ES/FR) - Ready by end of Week 1
  - [ ] AuthModal2 (ES/FR) - Ready by end of Week 1
  - [ ] SettingsSidebar2 (ES/FR) - Ready by Friday
  - [ ] EventModal (ES/FR) - Ready by Friday
  - [ ] CalendarEmbed (ES/FR) - Ready by Friday (pending)
  - [ ] CustomEventDialog (ES/FR) - Ready by Friday (pending)

- [ ] Integrate all received translations into JSON files
- [ ] Final language switch test (all 3 languages)
- [ ] Verify no missing keys (compare EN vs ES vs FR)
- [ ] Mark Phase 2 as COMPLETE ✅

---

## 📊 Weekly Progress Summary

### Week 1 (Jan 27-31): LandingPage + AuthModal2
```
Monday-Tuesday:   LandingPage extraction (100 strings)
Wednesday-Thursday: AuthModal2 extraction (40 strings)
Friday:           QA + Begin translator coordination

✅ Delivered: 140 strings extracted
📤 Sent to translation: 140 strings
🔄 Expected return: Friday EOD (concurrent)
```

### Week 2 (Feb 3-7): 4 More Components
```
Monday-Tuesday:   SettingsSidebar2 (50) + EventModal (70)
Wednesday-Thursday: CalendarEmbed (60) + CustomEventDialog (45)
Friday:           Final QA + Translation Integration

✅ Delivered: 225 strings extracted
📤 Sent to translation: 225 strings
🔄 Expected return: Friday EOD
```

### Phase 2 Total
```
✅ 365 strings extracted & migrated
✅ 6 high-priority components updated
✅ 3 languages ready (EN baseline + ES/FR translations)
✅ Zero build errors
✅ Zero console errors
✅ Full language switching tested
```

---

## 🧪 Daily Testing Template (Use for Each Component)

```javascript
// After updating each component, run this in browser console:

// 1. Test English (default)
document.title;  // Should show English text
i18next.language;  // Should be 'en'

// 2. Test Spanish
i18next.changeLanguage('es');
// Wait 2 seconds, check UI updates to Spanish
// If not updating, check: Is component using useTranslation hook?

// 3. Test French
i18next.changeLanguage('fr');
// Wait 2 seconds, check UI updates to French

// 4. Test English again
i18next.changeLanguage('en');
// Wait 2 seconds, check UI reverts to English

// 5. Check for errors
console.error.calls  // Should be empty
console.warn.calls  // Should be empty
```

---

## ⚠️ Common Issues & Fixes

| Issue | Symptom | Fix | Time |
|-------|---------|-----|------|
| **Missing key** | Shows `auth.buttons.unknown` | Check JSON file has key, check namespace spelling | 5 min |
| **Not re-rendering** | Language changes but UI stays same | Verify `useTranslation()` hook inside component | 10 min |
| **Build fails** | Compilation error | Check JSON syntax is valid, use JSON linter | 10 min |
| **Wrong namespace** | Key doesn't exist error | Verify component imports correct namespace | 5 min |
| **Leftover hardcoded** | Some text still English | Grep audit: `grep -r "'[A-Z]" src/components/FILE.jsx` | 10 min |

---

## 📋 Translator Communication Template

**Email to Translator (Monday Morning):**
```
Subject: Phase 2 Week 1 - 140 Strings for Translation (LandingPage + AuthModal2)

Hi [Translator],

Please translate the attached 140 English strings to Spanish and French by Wednesday EOD.

Files attached:
- phase2_week1_landing_auth.json (140 strings)
- namespace_guide.md (naming conventions)
- context.md (Time 2 Trade trading app context)

Key terminology (use consistently):
- Trading window = Ventana de negociación
- Event whiplash = Azote de eventos
- Session = Sesión
- Economic events = Eventos económicos

Delivery format:
- Spanish: phase2_week1_es.json
- French: phase2_week1_fr.json

Please confirm receipt and Wednesday delivery.

Thanks,
[Developer Name]
```

---

## ✅ Acceptance Criteria

**Phase 2 is COMPLETE when:**

- [x] All 365 strings extracted from 6 components
- [x] All strings organized into JSON files by namespace
- [x] Spanish translations received and integrated
- [x] French translations received and integrated
- [x] All 6 components updated with `useTranslation()` and `t()` calls
- [x] All components compile without build errors
- [x] No console errors or i18n warnings
- [x] Language switching tested in all components (3 languages each)
- [x] All 3 languages display correctly
- [x] Responsive design maintained
- [x] No hardcoded strings remain (grep audit passed)
- [x] File headers updated (version numbers incremented)
- [x] Master spreadsheet complete and documented

---

## 📞 Escalation Path

**Issue:** Can't find string in JSON  
**Action:** Check grep audit, search component file again, ask translator to verify

**Issue:** Translation quality poor  
**Action:** Request revision, specify terminology standards, provide corrected list

**Issue:** Build fails with i18n error  
**Action:** Check config.js, verify namespace names match, npm run build again

**Issue:** Component won't update on language change  
**Action:** Verify useTranslation hook called inside component, check namespace spelling

---

## 🎯 Success Metrics

By end of Phase 2 (Feb 7, 2026):

| Metric | Target | Status |
|--------|--------|--------|
| Strings extracted | 365+ | |
| Components migrated | 6 | |
| Build errors | 0 | |
| Console errors | 0 | |
| Languages tested | 3 | |
| Language switch speed | <200ms | |
| Translator satisfied | Yes | |
| Timeline adherence | ±1 day | |
| Docs updated | Yes | |
| Ready for Phase 3 | Yes | |

---

## 📝 Sign-Off Checklist

**Before marking Phase 2 COMPLETE:**

- [ ] All 6 components migrated
- [ ] Build passes: `npm run build` ✓
- [ ] Dev server starts: `npm run dev` ✓
- [ ] Language switching works (all 3 languages)
- [ ] All translations integrated (EN/ES/FR)
- [ ] No console errors
- [ ] Grep audit passed (no hardcoded strings)
- [ ] File headers updated
- [ ] Master spreadsheet complete
- [ ] README updated with i18n progress
- [ ] This checklist marked 100% complete

**Phase 2 Status:** ✅ READY FOR EXECUTION

---

**Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Created for:** Development Team  
**Ready to Execute:** January 27, 2026

