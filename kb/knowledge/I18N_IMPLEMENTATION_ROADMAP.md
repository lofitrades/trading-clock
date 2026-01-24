/**
 * kb/knowledge/I18N_IMPLEMENTATION_ROADMAP.md
 * 
 * Purpose: Detailed week-by-week implementation guide for i18n execution
 * For: Development team & project managers
 * Created: January 23, 2026
 */

# I18N Implementation Roadmap - Week-by-Week Plan

## 📅 Overview

**Timeline:** 4-6 weeks  
**Start Date:** January 24, 2026
**Current Date:** January 24, 2026  
**Expected End Date:** March 7, 2026 (6 weeks)  
**Team:** 1 Senior Dev + 2-3 Translators + 1 QA Engineer  

### 📊 Progress Summary

| Phase | Title | Status | Duration | Completed |
|-------|-------|--------|----------|-----------|
| 1 | Foundation Setup | ✅ COMPLETE | 8 hours | Jan 24, 2026 |
| 2 | String Extraction | ⏳ IN PROGRESS | 8-10 days | ~20% (LandingPage + AuthModal2) |
| 3 | Component Migration | ⏳ NOT STARTED | 5-7 days | — |
| 4 | Language UI | ⏳ NOT STARTED | 3-4 days | — |
| 5 | Testing & QA | ⏳ NOT STARTED | 4-5 days | — |
| 6 | Deployment | ⏳ NOT STARTED | 2-3 days | — |

### ✅ PHASE 2 STATUS UPDATE

**Status:** IN PROGRESS - Early Acceleration (ahead of schedule)  
**Completed (Jan 24, 2026):**
- ✅ LandingPage audit (100+ strings, all sections)
- ✅ LandingPage extraction (pages.landing namespace created)
- ✅ LandingPage translations (EN/ES/FR professional)
- ✅ LandingPage component migration (v2.0.0 + v2.1.0 BEP optimizations)
- ✅ AuthModal2 audit (50+ strings identified, modal structure mapped)
- ✅ AuthModal2 extraction (auth namespace expanded, 50+ modal-specific keys)
- ✅ AuthModal2 translations (EN/ES/FR professional, finance terminology verified)

**Next:** AuthModal2 component migration (Jan 25-27)

---

## 🔴 PHASE 1: FOUNDATION (Week 1 - Days 1-2) ✅ COMPLETE

### Goal
Set up i18next infrastructure, configuration, and file structure.

### Daily Breakdown

#### **Day 1: Setup & Configuration**

**Tasks:**
- [x] Create branch: `feature/i18n-foundation`
- [x] Install dependencies:
  ```bash
  npm install --legacy-peer-deps i18next react-i18next \
    i18next-browser-languagedetector \
    i18next-http-backend
  ```
- [x] Create directory structure:
  ```
  src/i18n/
  ├── config.js
  ├── locales/
  │   ├── en/
  │   ├── es/
  │   └── fr/
  ```
- [x] Create `src/i18n/config.js`:
  ```javascript
  import i18n from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import LanguageDetector from 'i18next-browser-languagedetector';
  
  // ... full config (see audit doc for template)
  ```
- [x] Create `src/i18n/locales/en/common.json` (empty namespace)
- [x] Create `src/i18n/locales/es/*` and `src/i18n/locales/fr/*`

**Deliverables:**
- ✅ i18next config working
- ✅ Import in `src/main.jsx`
- ✅ No breaking changes (app still boots)

**Time:** 4-5 hours ✅ ACTUAL: 4.5 hours

---

#### **Day 2: Provider Integration & Testing**

**Tasks:**
- [x] Update `src/main.jsx` to import i18n:
  ```jsx
  import { I18nextProvider } from 'react-i18next';
  import './i18n/config.js';  // Must be before App
  import i18n from './i18n/config.js';
  ```
- [x] Wrap App with `I18nextProvider`
- [x] Create test component to verify i18n works:
  ```jsx
  import { useTranslation } from 'react-i18next';
  const Test = () => {
    const { t } = useTranslation();
    return <div>{t('test')}</div>;
  };
  ```
- [x] Test language switching in browser console:
  ```javascript
  i18next.changeLanguage('es');  // Should work
  ```
- [x] Verify no console errors
- [x] Test localStorage persistence

**Deliverables:**
- ✅ App boots with i18next
- ✅ Language switching works
- ✅ Persistence works
- ✅ No breaking changes
- ✅ Build succeeds (npm run build)
- ✅ Dev server running (npm run dev)

**Time:** 2-3 hours ✅ ACTUAL: 3.5 hours

**Total Phase 1:** 6-8 hours ✅ ACTUAL: 8 hours (1 day equivalent)

---

## 🟠 PHASE 2: EXTRACTION & TRANSLATION (Weeks 2-4)

### Goal
Extract 1,860+ hardcoded strings and translate to Spanish/French.

### Week 2: Audit & Catalog

#### **Day 3-5: String Extraction Audit**

**Tasks:**
- [ ] Create master spreadsheet:
  - Column A: File path
  - Column B: Component/Function name
  - Column C: Hardcoded string
  - Column D: Category (UI/Page/Legal/Util)
  - Column E: Priority (High/Med/Low)
  - Column F: Namespace
  - Column G: Proposed Key

- [ ] Run comprehensive grep audit:
  ```bash
  grep -r "'[A-Z]" src/components/ | wc -l  # Count strings
  grep -r "\"[A-Z]" src/components/ | wc -l  # Count strings
  ```

- [ ] Manual audit of priority files:
  - [ ] AuthModal2.jsx (~80 strings) → `auth` namespace
  - [ ] SettingsSidebar2.jsx (~120 strings) → `settings` namespace
  - [ ] CustomEventDialog.jsx (~60 strings) → `events` namespace
  - [ ] EventModal.jsx (~40 strings) → `events` namespace
  - [ ] CalendarEmbed.jsx (~50 strings) → `calendar` namespace

- [ ] Document string patterns:
  - Button labels
  - Placeholder text
  - Error messages
  - Field labels
  - Help text
  - Legal disclaimers

**Deliverables:**
- ✅ Master spreadsheet with all 1,860+ strings
- ✅ Organized by file and category
- ✅ Assigned to namespaces
- ✅ Priority ranking

**Time:** 8-10 hours (3-4 days)

---

### Week 2-3: JSON Translation Files

#### **Days 6-10: Create English Baseline JSON**

**Tasks:**
- [ ] Create `src/i18n/locales/en/common.json`:
  ```json
  {
    "buttons": {
      "signUp": "Sign Up",
      "signIn": "Sign In",
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete"
    },
    "labels": {
      "email": "Email",
      "password": "Password"
    }
  }
  ```

- [ ] Create `src/i18n/locales/en/auth.json` (~80 strings)
- [ ] Create `src/i18n/locales/en/settings.json` (~120 strings)
- [ ] Create `src/i18n/locales/en/events.json` (~100 strings)
- [ ] Create `src/i18n/locales/en/calendar.json` (~50 strings)
- [ ] Create `src/i18n/locales/en/pages.json` (~200 strings)
- [ ] Create `src/i18n/locales/en/legal.json` (~700 strings)
- [ ] Create `src/i18n/locales/en/errors.json` (~50 strings)

**Validation:**
- [ ] No duplicate keys within namespace
- [ ] All strings accounted for
- [ ] Proper nesting/organization
- [ ] Run validation script:
  ```bash
  node scripts/validateTranslations.js
  ```

**Deliverables:**
- ✅ 8 JSON translation files for English
- ✅ ~1,860 strings organized
- ✅ Proper JSON structure
- ✅ No syntax errors

**Time:** 12-15 hours (4-5 days)

---

### Week 3: Professional Translation

#### **Days 11-15: Coordinate with Translators**

**Tasks:**
- [ ] Contact professional translators:
  - Spanish translator
  - French translator
  - (Optional) German translator

- [ ] Provide translation brief:
  - Context: Time 2 Trade trading clock + calendar app
  - Audience: Futures/forex day traders
  - Style: Professional, concise, technical accuracy
  - Deadline: [+7 days]

- [ ] Create translation package:
  - All 8 English JSON files
  - Glossary (trading terms, product names)
  - Brand guide
  - Style guide

- [ ] Monitor translation progress:
  - Day 1-2: Initial review by translator
  - Day 3-5: First draft completion
  - Day 6-7: Review & revisions

**Deliverables:**
- ✅ Spanish translations (~/80% complete)
- ✅ French translations (~/80% complete)
- ✅ Translation notes & context

**Time:** 5-10 hours coordination (1-2 days)  
**Translator Time:** 5-7 days parallel

---

### Week 3-4: Create Translated Files

#### **Days 16-20: Structure Translated JSON**

**Tasks:**
- [ ] Create directory structure:
  ```
  src/i18n/locales/
  ├── en/
  │   ├── common.json
  │   ├── auth.json
  │   └── ... (7 total)
  ├── es/
  │   ├── common.json
  │   ├── auth.json
  │   └── ... (7 total)
  ├── fr/
  │   ├── common.json
  │   ├── auth.json
  │   └── ... (7 total)
  └── de/
      ├── common.json
      ├── auth.json
      └── ... (7 total) [Optional]
  ```

- [ ] Review translations for:
  - Accuracy (matches English meaning)
  - Completeness (no missing strings)
  - Formatting (no broken HTML/links)
  - Technical terms (trading jargon)

- [ ] Create fallback mechanism:
  - Missing translations → fall back to English
  - Add script to detect missing keys:
    ```bash
    node scripts/checkMissingTranslations.js
    ```

- [ ] Validate all translation files:
  ```bash
  for file in src/i18n/locales/*/common.json; do
    npm run validate-json "$file"
  done
  ```

**Deliverables:**
- ✅ Spanish JSON files (complete)
- ✅ French JSON files (complete)
- ✅ German JSON files (optional)
- ✅ Fallback mechanism
- ✅ Validation passing

**Time:** 8-10 hours (3-4 days)

**Total Phase 2:** ~4 weeks

---

## 🟡 PHASE 3: COMPONENT MIGRATION (Week 5)

### Goal
Replace hardcoded strings with i18next `t()` calls in all components.

### Week 5: High Priority Components

#### **Days 21-25: Migrate Priority Components**

**Migration Pattern:**
```jsx
// BEFORE
<Button>Sign Up</Button>

// AFTER
import { useTranslation } from 'react-i18next';

const { t } = useTranslation(['auth', 'common']);
<Button>{t('auth:buttons.signUp')}</Button>
```

**Components to Migrate (Parallel Tasks):**

1. **AuthModal2.jsx** (~2 hours)
   - [ ] Import `useTranslation` hook
   - [ ] Add namespace: `['auth', 'common']`
   - [ ] Replace 80 hardcoded strings
   - [ ] Test with English
   - [ ] Test with Spanish
   - [ ] Test with French

2. **SettingsSidebar2.jsx** (~3 hours)
   - [ ] Import `useTranslation` hook
   - [ ] Add namespace: `['settings', 'common']`
   - [ ] Replace 120+ hardcoded strings
   - [ ] Test all settings sections
   - [ ] Test language switching

3. **CustomEventDialog.jsx** (~2 hours)
   - [ ] Import `useTranslation` hook
   - [ ] Add namespace: `['events', 'calendar', 'common']`
   - [ ] Replace 60 hardcoded strings
   - [ ] Test form validation messages
   - [ ] Test error messages

4. **EventModal.jsx** (~1.5 hours)
   - [ ] Import `useTranslation` hook
   - [ ] Add namespace: `['events', 'common']`
   - [ ] Replace 40 hardcoded strings
   - [ ] Test impact badge tooltips

5. **CalendarEmbed.jsx** (~1.5 hours)
   - [ ] Import `useTranslation` hook
   - [ ] Add namespace: `['calendar', 'common']`
   - [ ] Replace 50 hardcoded strings
   - [ ] Test filter UI

**Testing During Migration:**
- [ ] Build project: `npm run build` (should pass)
- [ ] No console errors
- [ ] All translations render correctly
- [ ] Language switching works

**Deliverables:**
- ✅ 5 high-priority components migrated
- ✅ ~350 strings now translated
- ✅ All tests passing
- ✅ No breaking changes

**Time:** 10-12 hours (2-3 days)

---

### Week 5: Additional Components

#### **Days 26-30: Migrate Medium Priority**

**Components to Migrate:**

1. **LandingPage.jsx** (~3 hours)
   - [ ] Replace 150 hardcoded strings
   - [ ] Test hero section
   - [ ] Test benefits section
   - [ ] Test CTA buttons

2. **AboutPage.jsx** (~2 hours)
   - [ ] Replace 100 hardcoded strings
   - [ ] Use `aboutContent.js` as fallback

3. **EventsTable.jsx & EventsTimeline2.jsx** (~2 hours)
   - [ ] Replace 50 combined strings
   - [ ] Test table headers
   - [ ] Test column labels

4. **RemindersEditor2.jsx** (~1 hour)
   - [ ] Replace 40 hardcoded strings

**Deliverables:**
- ✅ 8 medium-priority components migrated
- ✅ ~400+ additional strings translated
- ✅ Total: ~750 strings migrated

**Time:** 8-10 hours (2-3 days)

**Total Phase 3:** 1 week

---

## 🟢 PHASE 4: LANGUAGE SWITCHING UI (Week 6)

### Goal
Create language selector UI and persistence mechanism.

### Days 31-35: Language Switcher Component

**Tasks:**
- [ ] Create `src/components/LanguageSwitcher.jsx`:
  ```jsx
  import { useTranslation } from 'react-i18next';
  import { Button, Menu, MenuItem } from '@mui/material';
  import LanguageIcon from '@mui/icons-material/Language';
  
  export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    
    const languages = [
      { code: 'en', label: 'English', flag: '🇺🇸' },
      { code: 'es', label: 'Español', flag: '🇪🇸' },
      { code: 'fr', label: 'Français', flag: '🇫🇷' },
    ];
    
    const handleLanguageChange = (code) => {
      i18n.changeLanguage(code);
      localStorage.setItem('preferredLanguage', code);
      // Also save to Firestore if user authenticated
      if (user?.uid) {
        updateUserSettings({ language: code });
      }
    };
    
    return (
      <>
        <Button startIcon={<LanguageIcon />} onClick={...}>
          {languages.find(l => l.code === i18n.language)?.flag}
        </Button>
        <Menu>
          {languages.map(lang => (
            <MenuItem onClick={() => handleLanguageChange(lang.code)}>
              {lang.flag} {lang.label}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }
  ```

- [ ] Add to AppBar in desktop view
- [ ] Add to mobile menu

**Testing:**
- [ ] Language switcher appears in AppBar ✅
- [ ] Click to open menu ✅
- [ ] Select language ✅
- [ ] Page re-renders in new language ✅
- [ ] localStorage persists choice ✅
- [ ] Reload page → remembers language ✅
- [ ] Authenticated users → saved to Firestore ✅

**Deliverables:**
- ✅ LanguageSwitcher component created
- ✅ Integrated in AppBar + mobile menu
- ✅ localStorage persistence working
- ✅ Firestore integration for authenticated users

**Time:** 4-6 hours (1 day)

---

### Days 36-40: Context Provider & Persistence

**Tasks:**
- [ ] Create `src/contexts/LanguageContext.jsx`:
  ```jsx
  import { createContext, useContext, useEffect } from 'react';
  import { useTranslation } from 'react-i18next';
  
  const LanguageContext = createContext();
  
  export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    
    // Load language on mount
    useEffect(() => {
      const saved = localStorage.getItem('preferredLanguage') || 'en';
      i18n.changeLanguage(saved);
    }, []);
    
    return (
      <LanguageContext.Provider value={{ language: i18n.language }}>
        {children}
      </LanguageContext.Provider>
    );
  }
  ```

- [ ] Integrate context in `src/App.jsx`
- [ ] Test language persistence across pages
- [ ] Test language persistence across sessions

**Deliverables:**
- ✅ LanguageContext created
- ✅ Integrated in App
- ✅ localStorage persistence working
- ✅ Page refresh maintains language

**Time:** 3-4 hours (0.5 day)

**Total Phase 4:** 1 week

---

## 🔵 PHASE 5: TESTING & QA (Week 6-7)

### Goal
Comprehensive testing across all languages and scenarios.

### Days 41-45: Functional Testing

**Browser Testing (All 3 Languages):**

1. **AuthModal2 Testing**
   - [ ] Sign up flow (English)
   - [ ] Sign up flow (Spanish)
   - [ ] Sign up flow (French)
   - [ ] Magic link flow
   - [ ] Google OAuth flow
   - [ ] All text readable, properly sized
   - [ ] No overlapping text

2. **Settings Panel Testing**
   - [ ] All toggles labeled correctly
   - [ ] All descriptions visible
   - [ ] Session names display in language
   - [ ] Timezone names display correctly
   - [ ] Save settings works

3. **Calendar Testing**
   - [ ] Event modal opens in language
   - [ ] Impact badges translate
   - [ ] Currency names display
   - [ ] Filter labels translate
   - [ ] Event details readable

4. **Landing Page Testing**
   - [ ] Hero section displays
   - [ ] Benefits section translates
   - [ ] CTA buttons work
   - [ ] No text truncation

**Language-Specific Testing:**

| Language | Check | Status |
|----------|-------|--------|
| Spanish | All UI renders correctly | ⏳ |
| Spanish | No missing translations | ⏳ |
| Spanish | Dates format correctly (ES) | ⏳ |
| French | All UI renders correctly | ⏳ |
| French | No missing translations | ⏳ |
| French | Dates format correctly (FR) | ⏳ |

**Deliverables:**
- ✅ All components test passing in 3 languages
- ✅ No broken translations
- ✅ All text readable

**Time:** 12-16 hours (3-4 days)

---

### Days 46-50: Advanced Testing

**Performance Testing:**
- [ ] Language switch time <200ms
- [ ] Bundle size increase <30KB
- [ ] No layout shift on translation
- [ ] Lighthouse score maintained

**Accessibility Testing:**
- [ ] Screen reader works in all languages
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels translated

**SEO Testing:**
- [ ] `lang` attribute set correctly
- [ ] hreflang meta tags present
- [ ] Sitemap includes language variants
- [ ] robots.txt doesn't block languages

**Edge Cases:**
- [ ] Missing translation keys fall back to English
- [ ] Very long translations don't break layout
- [ ] Numbers format correctly (ES: 1.234,56 / FR: 1 234,56)
- [ ] Dates format correctly per locale

**Deliverables:**
- ✅ Performance targets met
- ✅ Accessibility passing
- ✅ SEO implemented
- ✅ Edge cases handled

**Time:** 10-12 hours (2-3 days)

**Total Phase 5:** 2 weeks

---

## 🟣 PHASE 6: DEPLOYMENT & DOCUMENTATION (Week 7-8)

### Goal
Set up translation management system and deploy to production.

### Days 51-55: Translation Management Setup

**Tasks:**
- [ ] Choose platform: Crowdin OR Lokalise
- [ ] Create account and project
- [ ] Upload English JSON files
- [ ] Invite Spanish & French translators
- [ ] Configure auto-sync to GitHub

**Crowdin Setup Example:**
```bash
# Install Crowdin CLI
npm install -g @crowdin/cli

# Initialize project
crowdin init

# Upload English strings
crowdin upload

# Pull translations
crowdin download
```

**Deliverables:**
- ✅ Translation platform active
- ✅ All strings uploaded
- ✅ Translators have access
- ✅ Auto-sync configured

**Time:** 4-6 hours (1 day)

---

### Days 56-60: Documentation & Monitoring

**Tasks:**
- [ ] Create **i18n Contributor Guide**:
  - How to add new strings
  - Naming conventions
  - Translation workflow
  - Key format guidelines

- [ ] Set up monitoring:
  - Log missing translation keys
  - Alert on 404 translation files
  - Track language usage analytics

- [ ] Create rollback plan:
  - If translations break
  - If performance degrades
  - If users report issues

- [ ] Update README.md with i18n section

**Deliverables:**
- ✅ Contributor documentation
- ✅ Monitoring dashboards set up
- ✅ Rollback procedures documented

**Time:** 6-8 hours (1-2 days)

---

### Days 61-70: Production Deployment

**Pre-Deployment Checklist:**
- [ ] All tests passing
- [ ] Performance baseline established
- [ ] Rollback plan documented
- [ ] On-call support scheduled
- [ ] Analytics events tagged
- [ ] Monitoring alerts configured

**Deployment:**
- [ ] Merge `feature/i18n-foundation` to `develop`
- [ ] Create PR for team review
- [ ] Approved by: Senior Dev, QA Lead, PM
- [ ] Merge to `main`
- [ ] Deploy to staging environment
- [ ] 24-hour staging validation
- [ ] Deploy to production
- [ ] Monitor for 48 hours

**Post-Deployment:**
- [ ] Check analytics for language distribution
- [ ] Monitor error logs for missing keys
- [ ] Gather user feedback
- [ ] Celebrate! 🎉

**Deliverables:**
- ✅ i18n deployed to production
- ✅ All 3 languages live
- ✅ Language switcher visible
- ✅ Monitoring active

**Time:** 3-5 days

**Total Phase 6:** 1-2 weeks

---

## 📊 Master Timeline

```
Week 1:  🔴 PHASE 1 - Foundation                 (6-8 hrs)
Week 2:  🟠 PHASE 2 - String Audit               (40-50 hrs)
Week 3:  🟠 PHASE 2 - Translation Coordination   (+ translator time)
Week 4:  🟠 PHASE 2 - Translated Files           (40-50 hrs)
Week 5:  🟡 PHASE 3 - Component Migration        (40-50 hrs)
Week 6:  🟢 PHASE 4 - Language Switching UI      (16-20 hrs)
Week 6:  🔵 PHASE 5 - Testing & QA              (20-25 hrs)
Week 7:  🔵 PHASE 5 - Advanced Testing          (20-25 hrs)
Week 7:  🟣 PHASE 6 - Translation Platform      (10-15 hrs)
Week 8:  🟣 PHASE 6 - Documentation & Deploy    (15-20 hrs)

TOTAL:   ~250-300 dev hours (6-8 weeks, 1 senior dev)
         + 40-60 translator hours
         + 10-15 QA hours
```

---

## 👥 Team Allocation

| Role | Phase | Weekly Hours | Deliverables |
|------|-------|-------------|--------------|
| **Senior Dev** | 1-6 | 40-50 hrs/wk | Architecture, config, migration, deployment |
| **Translator (ES)** | 2-3 | 20-30 hrs | Spanish translation files |
| **Translator (FR)** | 2-3 | 20-30 hrs | French translation files |
| **QA Engineer** | 5-6 | 15-25 hrs/wk | Testing, validation, monitoring |
| **PM** | 1-8 | 3-5 hrs/wk | Coordination, status updates |

---

## ✅ Success Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Translation Coverage | >99% | ⏳ |
| Languages Live | 3 (EN, ES, FR) | ⏳ |
| Language Switch Time | <200ms | ⏳ |
| Bundle Size Increase | <30KB gzipped | ⏳ |
| Missing Keys | 0 | ⏳ |
| Lighthouse Score | ≥90 all categories | ⏳ |
| User Satisfaction | >90% (survey) | ⏳ |

---

## 🚀 Launch Checklist

**1 Week Before Launch:**
- [ ] All tests passing on production
- [ ] Monitoring alerts configured
- [ ] On-call support scheduled
- [ ] Launch communication prepared

**Launch Day:**
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Respond to user feedback
- [ ] Document any issues

**Post-Launch (48 hours):**
- [ ] Monitor performance metrics
- [ ] Gather initial user feedback
- [ ] Assess language distribution
- [ ] Plan Phase 2 languages

---

**Roadmap Version:** 1.0.0  
**Last Updated:** January 23, 2026  
**Status:** Ready for Execution  
**Next Review:** After Phase 1 completion
