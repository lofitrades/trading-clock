/**
 * kb/knowledge/PHASE_2_STRING_EXTRACTION_PLAN.md
 * 
 * Purpose: Detailed execution plan for Phase 2 (String Extraction & Migration)
 * Scope: 350-400 hardcoded strings across 8 high-priority components
 * Timeline: 8-10 business days
 * Created: January 24, 2026
 */

# Phase 2: String Extraction & Migration - Detailed Execution Plan

**Status:** READY FOR EXECUTION  
**Start Date:** January 27, 2026 (pending Phase 1 sign-off)  
**Duration:** 8-10 business days  
**Target Completion:** February 7, 2026

---

## 📋 Overview

This phase extracts hardcoded English strings from 8 high-priority components (~350-400 strings) and organizes them into the i18n namespace structure already set up in Phase 1.

### Key Deliverables
- Master spreadsheet listing all 350+ strings with categorization
- Updated English JSON files in `src/i18n/locales/en/` (updated from baseline)
- Spanish translations of all new strings
- French translations of all new strings
- Component dependency mapping (which namespaces each component uses)

### Why This Matters
- **Customer-Facing Impact:** LandingPage, AuthModal, SettingsSidebar affect every user
- **Revenue Impact:** LandingPage copy is conversion-critical
- **Maintenance Cost:** These 8 components contain ~25% of total app strings
- **Technical Debt:** Hard to test components with hardcoded strings

---

## 🎯 Component Priority & Estimated Effort

### **TIER 1: CRITICAL (Must Do First)**

#### 1. **LandingPage.jsx** - 80-100 strings 🔴 HIGHEST PRIORITY
**File:** [pages/index.page.jsx](pages/index.page.jsx)  
**Impact:** SEO + marketing copy + highest conversion impact  
**Strings:**
- Hero section: headline, subheadline, CTA copy (8 strings)
- Benefits section: 4 benefit statements + descriptions (12 strings)
- Feature blocks: 6 sections × 3-4 strings each = ~20 strings
- Use cases: 4 scenarios × 3-4 strings each = ~16 strings
- FAQ section: 6 Q&A pairs × 2 strings = 12 strings
- CTA buttons: "Unlock all features", "Go to Calendar", etc. (6 strings)
- Nav/footer: links, legal copy (8 strings)

**Namespace Assignment:**
- `pages.landing.hero` → headline, subheadline, CTA
- `pages.landing.benefits` → benefit statements
- `pages.landing.features` → feature descriptions
- `pages.landing.useCases` → use case copy
- `pages.landing.faq` → questions, answers
- `common.buttons` → CTA buttons
- `legal` → terms, privacy links

**Effort:** Medium (40+ strings, high-quality copy)  
**Translator:** Requires professional who understands trading/finance terminology

**Extraction Strategy:**
```javascript
// BEFORE:
<Typography variant="h1">Unlock all features</Typography>
<Typography>Trade the right window...</Typography>

// AFTER:
<Typography variant="h1">{t('pages.landing.hero.headline')}</Typography>
<Typography>{t('pages.landing.hero.subheading')}</Typography>
```

**File to Update:**
- `src/i18n/locales/en/pages.json` → Add `landing` section with hero, benefits, features, useCases, faq subsections
- `src/i18n/locales/es/pages.json` → Spanish translations
- `src/i18n/locales/fr/pages.json` → French translations

---

#### 2. **AuthModal2.jsx** - 35-40 strings 🔴 HIGH PRIORITY
**File:** [src/components/AuthModal2.jsx](src/components/AuthModal2.jsx)  
**Impact:** Authentication flow + user signup conversion  
**Strings:**
- Headline: "Sign in to your workspace" (1)
- Tagline: "Trade the right window" (1)
- Benefits: 4 benefit statements (4)
- Email label: "Email address" (1)
- Email placeholder: "your@email.com" (1)
- Error messages: 3-4 validation messages (4)
- OAuth: "Continue with Google" (1)
- Legal copy: "By proceeding, you agree..." + links (4)
- Helper text: "Click the sign-in link to open..." (1)
- Magic link copy: "⏱️ Link expires in 60 minutes..." (1)
- Success: "Signing you in..." (1)
- Buttons: "Send me a sign-in link", "Cancel", etc. (3)

**Namespace Assignment:**
- `auth.modal.headline` → headline
- `auth.modal.benefits` → benefits array
- `auth.form.email` → label, placeholder
- `auth.errors` → validation messages
- `auth.oauth` → OAuth button copy
- `auth.legal` → terms, privacy, disclaimer
- `auth.messages` → help text, success messages

**Effort:** Low-Medium (35 strings, mostly form UI)  
**Translator:** Standard UI translator

**Extraction Strategy:**
```javascript
// BEFORE:
const benefits = ["Trade the right window", "Avoid event whiplash", ...];
<Button>{isLoading ? "Signing you in..." : "Send me a sign-in link →"}</Button>

// AFTER:
const benefits = [t('auth.modal.benefits.one'), t('auth.modal.benefits.two'), ...];
<Button>{isLoading ? t('auth.messages.signingIn') : t('auth.buttons.sendLink')}</Button>
```

**File to Update:**
- `src/i18n/locales/en/auth.json` → Already exists (35 baseline strings), verify completeness
- `src/i18n/locales/es/auth.json` → Already exists, may need updates
- `src/i18n/locales/fr/auth.json` → Already exists, may need updates

---

### **TIER 2: HIGH (Next Priority)**

#### 3. **SettingsSidebar2.jsx** - 45-50 strings
**File:** [src/components/SettingsSidebar2.jsx](src/components/SettingsSidebar2.jsx)  
**Impact:** Core settings UX, all authenticated users access this  
**Categories:**
- Tab labels: General, Sessions, About (3)
- Section headers: Visibility, Analog Hand Clock, Digital Clock, etc. (8)
- Toggle labels: "Events on canvas", "Session names", etc. (12)
- Descriptions: "Analog with sessions", "Readable digits", etc. (12)
- Admin controls: "Sync this week from NFS?", status messages (5)
- Buttons: "Reset to Default", "Contact us", "Logout" (3)
- Help text: "At least one element must be enabled" (1)
- Link text: "Edit your trading sessions" (1)

**Namespace Assignment:**
- `settings.tabs` → tab labels
- `settings.sections` → section headers
- `settings.toggles` → toggle labels
- `settings.descriptions` → toggle descriptions
- `settings.admin` → admin-only controls
- `settings.buttons` → action buttons
- `settings.validation` → validation messages

**Effort:** Medium (45 strings, many interdependent)  
**Translator:** Standard UI translator

---

#### 4. **EventModal.jsx** - 60-70 strings
**File:** [src/components/EventModal.jsx](src/components/EventModal.jsx)  
**Impact:** Event details viewing, high user interaction  
**Categories:**
- Section headers: "About This Event", "Trading Implication", "Key Thresholds" (10)
- Data labels: "Status", "Impact", "Currency", "Category", "Source" (8)
- Field labels: "Actual", "Forecast", "Previous", "Date", "Time" (6)
- Status badges: "NOW", "NEXT", "Past Event", "Custom event" (6)
- Tooltips: Field explanations, data quality info (12)
- Reminders: "Sign in to save reminders", error states (8)
- Action labels: "Refresh data", "View notes", "Add note", "Edit reminder" (6)
- Empty states: "No data", "Loading", error messages (3)

**Namespace Assignment:**
- `events.modal.sections` → section headers
- `events.modal.labels` → data field labels
- `events.modal.status` → status badge text
- `events.modal.tooltips` → help text
- `events.modal.reminders` → reminder-related copy
- `events.modal.actions` → action button labels
- `events.modal.empty` → empty state messages

**Effort:** Medium-High (70 strings, complex interactions)  
**Translator:** Subject matter expert (financial/trading terms)

---

#### 5. **CalendarEmbed.jsx & Related** - 50-60 strings
**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx)  
**Impact:** Calendar UI, primary feature for many users  
**Categories:**
- Column headers: "TIME", "CURRENCY", "IMPACT", "EVENT" (6)
- Date labels: "Today", "Tomorrow", "Yesterday", separators (8)
- Section titles: "Search & Filters", "Economic Calendar" (6)
- Status messages: "Loading events", "No events found" (8)
- Button labels: "Add custom event", "Filters", "Refresh", "Next event" (8)
- Tooltips: Column descriptions, feature explanations (10)
- Filter labels: "Currency", "Impact", "Date range" (8)
- Stats/counts: "events", "upcoming", "in progress" (4)

**Namespace Assignment:**
- `calendar.columns` → column headers
- `calendar.dates` → date labels
- `calendar.sections` → section titles
- `calendar.status` → status messages
- `calendar.buttons` → action buttons
- `calendar.tooltips` → help text
- `calendar.filters` → filter options
- `calendar.stats` → count/status labels

**Effort:** Medium (60 strings, many UI elements)  
**Translator:** Standard UI translator

---

#### 6. **CustomEventDialog.jsx** - 35-45 strings
**File:** [src/components/CustomEventDialog.jsx](src/components/CustomEventDialog.jsx)  
**Impact:** User-created events, feature enabler  
**Categories:**
- Dialog titles: "Edit custom event", "New custom event" (2)
- Section headers: "Details", "Schedule", "Appearance" (4)
- Form labels: "Title", "Description", "Date", "Time", etc. (12)
- Recurrence options: "Does not repeat", "Every day", "Every week" (8)
- Impact levels: Impact descriptions (5)
- Buttons: "Save", "Cancel", "Delete" (3)
- Help text: Validation messages, tooltips (4)
- Success/Error: "Changes saved", error messages (2)

**Namespace Assignment:**
- `events.customDialog.titles` → dialog titles
- `events.customDialog.sections` → section headers
- `events.customDialog.form` → form labels
- `events.customDialog.recurrence` → recurrence options
- `events.customDialog.impact` → impact descriptions
- `events.customDialog.buttons` → action buttons
- `events.customDialog.messages` → validation, success, error

**Effort:** Low-Medium (45 strings, mostly form fields)  
**Translator:** Standard UI translator

---

### **TIER 3: MEDIUM (Supporting)**

#### 7. **AboutPage.jsx** - 25-30 strings
**File:** [pages/about.page.jsx](pages/about.page.jsx)  
**Impact:** SEO page, lower daily usage  
**Strings:** Page content, buttons, navigation links

**Namespace:** `pages.about` + `buttons`

#### 8. **ClockPage & Related** - 25-35 strings
**File:** [pages/clock.page.jsx](pages/clock.page.jsx)  
**Impact:** Secondary UI  
**Strings:** Session labels, timezone labels, button labels

**Namespace:** `clock` + `common.labels`

---

## 📊 Extraction Workflow (Per Component)

### Step 1: Audit & Document (2 hours per component)
```bash
# For each component:
1. Open file in VS Code
2. Search for all quoted strings: " and '
3. Identify UI-related strings (exclude: variable names, IDs, URLs, regex)
4. Create spreadsheet row:
   | File | Line | String | Type | Namespace | Key | Priority |
5. Group related strings (e.g., all toggle labels together)
6. Assign to namespace
7. Create key naming convention: `section.subsection.item`
```

### Step 2: Update JSON Files (1 hour per component)
```javascript
// src/i18n/locales/en/{namespace}.json
// Add nested object structure:
{
  "section": {
    "subsection": {
      "item": "English text"
    }
  }
}
```

### Step 3: Get Professional Translations (3-5 days, parallel)
```
Export English JSON → Send to translators → Review → Integrate Spanish/French JSON
```

### Step 4: Update Component Code (1-2 hours per component)
```javascript
// import at top
import { useTranslation } from 'react-i18next';

// Inside component
const { t } = useTranslation(['namespace1', 'namespace2']);

// Replace hardcoded strings
// Before: <Button>Send me a sign-in link</Button>
// After:  <Button>{t('auth.buttons.sendLink')}</Button>
```

### Step 5: Test Component (30 min per component)
```
1. Start dev server
2. Change language in console: i18next.changeLanguage('es')
3. Verify all UI text in component updates
4. Verify fallback to English if translation missing
5. Test on mobile (responsive)
6. Check console for any i18next warnings
```

---

## 📅 Week-by-Week Execution Plan

### **Week 2: January 27 - January 31**

**Days 1-2 (Mon-Tue): LandingPage Extraction**
- 2 hours: Audit & document 80 strings
- 1 hour: Update English JSON (pages.json, landing section)
- 2 hours: Send to translators
- 1 hour: Update component code with t() calls
- Status: Ready for translation

**Days 3-4 (Wed-Thu): AuthModal2 Extraction**
- 1.5 hours: Audit & document 40 strings
- 0.5 hour: Update English JSON (auth.json)
- 1 hour: Send to translators (parallel with LandingPage)
- 1 hour: Update component code
- Status: Ready for translation

**Day 5 (Fri): QA & Review**
- Verify both components compile without errors
- Quick language test in browser (English works, Spanish/French will follow)
- Document any missing strings or UI elements

### **Week 3: February 3 - February 7**

**Days 1-2 (Mon-Tue): SettingsSidebar2 + EventModal**
- 2 hours each: Audit & document (90 strings total)
- 1.5 hours: Update English JSON (settings.json, events.json)
- 1 hour: Send to translators
- 2 hours: Update component code (parallel)

**Days 3-4 (Wed-Thu): CalendarEmbed + CustomEventDialog**
- 2 hours each: Audit & document (95 strings total)
- 1.5 hours: Update English JSON (calendar.json, events.json)
- 1 hour: Send to translators
- 2 hours: Update component code (parallel)

**Day 5 (Fri): Final QA**
- Verify all 6 components compile
- Quick language test
- Collect translations from translator (if ready)
- Prepare Phase 3 kickoff

**Parallel Task: Translation Coordination**
- Days 1-3: Translators working on LandingPage + AuthModal (40 strings each)
- Days 4-5: Translators working on SettingsSidebar + EventModal (90 strings)
- Week 4: Translators working on Calendar + Custom (95 strings)
- Expected delivery: End of Week 3 for priority components

---

## 🛠️ Technical Implementation Details

### JSON File Structure Example
```json
{
  "auth": {
    "modal": {
      "headline": "Sign in to your workspace",
      "tagline": "Trade the right window",
      "benefits": {
        "tradeWindow": "Trade the right window",
        "avoidWhiplash": "Avoid event whiplash",
        "keepSetup": "Keep your setup saved",
        "correctTimezones": "Timezones stay correct"
      }
    },
    "form": {
      "email": {
        "label": "Email address",
        "placeholder": "your@email.com"
      }
    },
    "errors": {
      "invalidEmail": "Please enter a valid email address",
      "domainNotAuthorized": "Domain not authorized"
    },
    "oauth": {
      "google": "Continue with Google"
    },
    "messages": {
      "signingIn": "Signing you in…",
      "linkSent": "Check your inbox for a sign-in link",
      "linkExpires": "⏱️ Link expires in 60 minutes and can be used once"
    },
    "buttons": {
      "sendLink": "Send me a sign-in link →",
      "cancel": "Cancel"
    },
    "legal": {
      "agree": "By proceeding, you agree to our",
      "termsLink": "Terms of Service",
      "privacyLink": "Privacy Policy"
    }
  }
}
```

### Component Usage Pattern
```javascript
// src/components/AuthModal2.jsx (after Phase 2)
import { useTranslation } from 'react-i18next';

const AuthModal2 = () => {
  const { t } = useTranslation('auth');

  return (
    <Dialog>
      <Typography variant="h5">{t('modal.headline')}</Typography>
      <Typography>{t('modal.tagline')}</Typography>
      
      <List>
        {[
          t('modal.benefits.tradeWindow'),
          t('modal.benefits.avoidWhiplash'),
          t('modal.benefits.keepSetup'),
          t('modal.benefits.correctTimezones'),
        ].map((benefit, i) => (
          <ListItem key={i}>{benefit}</ListItem>
        ))}
      </List>

      <TextField 
        label={t('form.email.label')} 
        placeholder={t('form.email.placeholder')} 
      />
      
      {error && (
        <Alert severity="error">{t('errors.invalidEmail')}</Alert>
      )}

      <Button variant="contained">
        {isLoading ? t('messages.signingIn') : t('buttons.sendLink')}
      </Button>
    </Dialog>
  );
};
```

---

## 📋 Master Spreadsheet Template

Create in Google Sheets or Excel:

| Component | File | Line | Hardcoded String | Type | Namespace | JSON Key | Priority | Status |
|-----------|------|------|------------------|------|-----------|----------|----------|--------|
| AuthModal2 | src/components/AuthModal2.jsx | 45 | "Sign in to your workspace" | UI Label | auth | modal.headline | High | ✅ |
| AuthModal2 | src/components/AuthModal2.jsx | 52 | "Trade the right window" | UI Label | auth | modal.benefits.one | High | ✅ |
| LandingPage | pages/index.page.jsx | 123 | "Unlock all features" | CTA | pages | landing.cta.main | Critical | 🔄 |

---

## ✅ Acceptance Criteria for Phase 2 Completion

- [ ] All 350+ strings extracted and documented in master spreadsheet
- [ ] English JSON files updated in `src/i18n/locales/en/`
- [ ] Spanish translations received and integrated into `src/i18n/locales/es/`
- [ ] French translations received and integrated into `src/i18n/locales/fr/`
- [ ] All 8 components updated with `useTranslation()` and `t()` calls
- [ ] All components compile without errors
- [ ] Language switching works in dev server for all 8 components
- [ ] No console warnings or errors related to missing translations
- [ ] Responsive design maintained across mobile/tablet/desktop
- [ ] QA testing completed for each component in 3 languages

---

## 🚨 Common Pitfalls & How to Avoid

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| **Missing namespace** | `useTranslation() called without namespace` | Always specify: `useTranslation('auth', 'common')` |
| **Wrong key path** | `{ key: "module.error" }` but JSON has `{ "modules": { "error": "..." } }` | Verify exact nesting in JSON matches `t()` path |
| **Inconsistent naming** | `t('auth.form.email.label')` vs `t('auth.emailLabel')` | Create naming convention doc, use consistently |
| **Missing translations** | Console shows fallback keys in prod | Always provide all 3 languages before merge |
| **Hardcoded string left behind** | Some text still in original language | Do final grep audit: `grep -r "'[A-Z]" src/components/AuthModal2.jsx` |
| **Translation not updating** | Change language but UI doesn't change | Check: Are you using `useTranslation()` hook? Did you rebuild? |

---

## 📞 Translation Coordinator Checklist

**Week 2 (Monday):**
- [ ] Send 80 LandingPage strings to translators
- [ ] Send 40 AuthModal strings to translators
- [ ] Provide Google Sheets template
- [ ] Set deadline: Wednesday EOD

**Week 3 (Friday):**
- [ ] Receive LandingPage + AuthModal translations
- [ ] Review for quality & accuracy (especially finance terms)
- [ ] Send back for corrections if needed
- [ ] Integrate into JSON files

**Week 4:**
- [ ] Send remaining 5 components (240+ strings)
- [ ] Receive and integrate translations

---

## 🔄 Dependencies & Blockers

**Blocker 1:** Professional Translation Quality
- **Impact:** If translations are low quality, Phase 3-5 slower
- **Mitigation:** Hire translators experienced in finance/trading terminology
- **Timeline:** Hire by Jan 26 to start translations Jan 27

**Blocker 2:** Component Complexity
- **Impact:** Some components have complex state logic
- **Mitigation:** Test after each component migration
- **Timeline:** Budget extra time for SettingsSidebar (most complex)

**Blocker 3:** Missing Strings Discovery
- **Impact:** Strings found later in Phase 3
- **Mitigation:** Thorough grep audit + manual review
- **Timeline:** Review each component again after initial extraction

---

## 📈 Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Strings extracted | 350+ | — |
| Components migrated | 8 high-priority | — |
| Languages ready | 3 (EN, ES, FR) | — |
| Build errors | 0 | — |
| Console warnings | 0 | — |
| Language switch speed | <200ms | — |
| Component test coverage | 100% (3 languages) | — |
| Timeline adherence | ±1 day | — |

---

**Next Phase:** Phase 3 - Component Migration & UI Testing (Feb 10-14)

**Document Status:** READY FOR EXECUTION  
**Last Updated:** January 24, 2026 v1.0.0

