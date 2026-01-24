/**
 * kb/knowledge/I18N_DEVELOPER_QUICK_START.md
 * 
 * Purpose: Quick reference for developers working on i18n Phase 2-6
 * Audience: Development team starting component migration
 * Date: January 24, 2026
 */

# i18n Developer Quick Start Guide

**How to work with translations in Time 2 Trade**

---

## 🚀 Before You Start

### Knowledge Prerequisites
- Read: [I18N_PHASE_1_COMPLETION_REPORT.md](I18N_PHASE_1_COMPLETION_REPORT.md) (10 min)
- Read: [PHASE_2_STRING_EXTRACTION_PLAN.md](PHASE_2_STRING_EXTRACTION_PLAN.md) (20 min)
- Bookmark: This file (5 min reference)

### One-Time Setup
```bash
# Already done in Phase 1, but verify:
npm list i18next react-i18next  # Should show v23.x and v13.x

# Verify app starts:
npm run dev  # Should load on http://localhost:5173
```

---

## 📋 Core Concepts

### 1. Namespace Pattern
Each domain has its own namespace file:

```
src/i18n/locales/en/
├── common.json       → Shared UI (buttons, labels, navigation)
├── auth.json         → Authentication flow
├── settings.json     → Settings drawer
├── events.json       → Event details & custom events
├── calendar.json     → Calendar view
├── pages.json        → Landing, about, contact pages
├── legal.json        → Terms, privacy, disclaimers
└── errors.json       → Validation & error messages
```

### 2. Key Naming Convention
```
namespace.section.subsection.item

Examples:
- auth.modal.headline
- auth.form.email.label
- auth.errors.invalidEmail
- settings.toggles.eventsOnCanvas
- calendar.columns.currency
```

### 3. Translation File Structure
```json
{
  "modal": {
    "headline": "Sign in to your workspace",
    "benefits": {
      "one": "Trade the right window",
      "two": "Avoid event whiplash"
    }
  }
}
```

---

## 💻 How to Use Translations in Components

### Step 1: Import the Hook
```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Initialize in Component
```javascript
const MyComponent = () => {
  // Import from one namespace
  const { t } = useTranslation('auth');
  
  // OR import from multiple namespaces
  const { t } = useTranslation(['auth', 'common']);
```

### Step 3: Replace Hardcoded Strings
```javascript
// BEFORE
return (
  <Button>Send me a sign-in link</Button>
);

// AFTER
return (
  <Button>{t('auth.buttons.sendLink')}</Button>
);
```

### Step 4: Test Language Switching
```javascript
// In browser console:
i18next.changeLanguage('es');  // Switch to Spanish
i18next.changeLanguage('fr');  // Switch to French
i18next.changeLanguage('en');  // Back to English
```

---

## 📝 Complete Example: AuthModal2.jsx

### Original (Hardcoded)
```javascript
const AuthModal2 = () => {
  return (
    <Dialog>
      <Typography variant="h5">
        Sign in to your workspace
      </Typography>
      
      <TextField 
        label="Email address"
        placeholder="your@email.com"
      />
      
      <Button>
        {isLoading ? "Signing you in..." : "Send me a sign-in link →"}
      </Button>
    </Dialog>
  );
};
```

### Migrated (with i18n)
```javascript
import { useTranslation } from 'react-i18next';

const AuthModal2 = () => {
  const { t } = useTranslation('auth');
  
  return (
    <Dialog>
      <Typography variant="h5">
        {t('modal.headline')}
      </Typography>
      
      <TextField 
        label={t('form.email.label')}
        placeholder={t('form.email.placeholder')}
      />
      
      <Button>
        {isLoading ? t('messages.signingIn') : t('buttons.sendLink')}
      </Button>
    </Dialog>
  );
};
```

### In JSON (en/auth.json)
```json
{
  "modal": {
    "headline": "Sign in to your workspace"
  },
  "form": {
    "email": {
      "label": "Email address",
      "placeholder": "your@email.com"
    }
  },
  "messages": {
    "signingIn": "Signing you in…"
  },
  "buttons": {
    "sendLink": "Send me a sign-in link →"
  }
}
```

---

## 🔍 Common Patterns

### Pattern 1: Lists of Items
```javascript
// Before
const benefits = [
  "Trade the right window",
  "Avoid event whiplash",
  "Keep your setup saved"
];

// After
const benefits = [
  t('auth.modal.benefits.one'),
  t('auth.modal.benefits.two'),
  t('auth.modal.benefits.three')
];

// OR with loops
const benefitKeys = ['one', 'two', 'three'];
const benefits = benefitKeys.map(key => t(`auth.modal.benefits.${key}`));
```

### Pattern 2: Conditional Text
```javascript
// Before
<Typography>
  {isError ? "Error occurred" : "Loading..."}
</Typography>

// After
<Typography>
  {isError ? t('errors.occurred') : t('messages.loading')}
</Typography>
```

### Pattern 3: Buttons & Labels
```javascript
// Before
<Button>{action === 'edit' ? 'Update' : 'Create'}</Button>

// After
<Button>{t(action === 'edit' ? 'buttons.update' : 'buttons.create')}</Button>
```

### Pattern 4: Form Validation
```javascript
// Before
if (!email) setError("Email is required");

// After
if (!email) setError(t('errors.emailRequired'));
```

---

## ✅ Testing Checklist (Per Component)

After migrating a component, verify:

- [ ] Component renders without errors (English)
- [ ] All text displays correctly in English
- [ ] Language switch works: `i18next.changeLanguage('es')`
- [ ] All text updates to Spanish
- [ ] Language switch to French: `i18next.changeLanguage('fr')`
- [ ] All text updates to French
- [ ] Switch back to English: `i18next.changeLanguage('en')`
- [ ] Text reverts to English
- [ ] No console errors or i18n warnings
- [ ] Responsive design maintained (mobile/tablet)
- [ ] No hardcoded strings remaining (grep audit)
- [ ] File headers updated (if modified)

---

## 🐛 Debugging Tips

### Missing Translation Key
**Symptom:** UI shows `auth.buttons.unknownKey` instead of text

**Fix:**
```javascript
// 1. Check key exists in JSON
// src/i18n/locales/en/auth.json
{
  "buttons": {
    "sendLink": "Send me a sign-in link →"  // ✅ This key exists
  }
}

// 2. Check component spelling
{t('auth.buttons.sendLink')}  // ✅ Correct
{t('auth.button.sendLink')}   // ❌ Wrong (button vs buttons)

// 3. Check namespace imported
const { t } = useTranslation('auth');  // ✅ Correct namespace
const { t } = useTranslation('common');  // ❌ Wrong namespace
```

### Language Switch Not Working
**Symptom:** Change language in console, UI doesn't update

**Check:**
```javascript
// 1. Verify useTranslation hook is called
const { t } = useTranslation('auth');  // ✅ Must be inside component

// 2. Verify component re-renders (use key or state)
// This works (will re-render on language change):
<div>{t('auth.modal.headline')}</div>  ✅

// This doesn't (stored in constant):
const text = t('auth.modal.headline');
<div>{text}</div>  ❌ (won't update on language change)

// 3. Check if i18next loaded
console.log(i18next.language);  // Current language
console.log(i18next.options.resources);  // Loaded resources
```

### Console Error: "useTranslation must be called inside a function"
**Fix:**
```javascript
// ❌ Wrong - called outside component
const { t } = useTranslation('auth');
const MyComponent = () => <div>{t('key')}</div>;

// ✅ Correct - called inside component
const MyComponent = () => {
  const { t } = useTranslation('auth');
  return <div>{t('key')}</div>;
};
```

---

## 📊 Translation File Status

### Phase 1 (COMPLETE)
```
265 baseline strings per language:
✅ en/common.json     - 50 strings
✅ en/auth.json       - 35 strings
✅ en/settings.json   - 40 strings
✅ en/events.json     - 45 strings
✅ en/calendar.json   - 30 strings
✅ en/pages.json      - 15 strings
✅ en/legal.json      - 5 strings
✅ en/errors.json     - 10 strings

Spanish & French: Complete translations of all 8 files
```

### Phase 2 (IN PROGRESS)
```
350+ additional strings to extract:
⏳ LandingPage        - ~100 strings
⏳ AuthModal2         - ~40 strings
⏳ SettingsSidebar2   - ~50 strings
⏳ EventModal         - ~70 strings
⏳ CalendarEmbed      - ~60 strings
⏳ CustomEventDialog  - ~45 strings
⏳ AboutPage          - ~30 strings
⏳ ClockPage          - ~35 strings

See PHASE_2_STRING_EXTRACTION_PLAN.md for detailed breakdown
```

---

## 🔗 Key Files Reference

| File | Purpose | Edit When |
|------|---------|-----------|
| `src/i18n/config.js` | i18next config | Adding new language |
| `src/i18n/locales/en/*.json` | English strings | Phase 2+ |
| `src/i18n/locales/es/*.json` | Spanish strings | Receiving translations |
| `src/i18n/locales/fr/*.json` | French strings | Receiving translations |
| `src/main.jsx` | React i18n setup | Already done (v4.0.0) |
| Components | Add useTranslation() | During Phase 2-3 |

---

## 🚀 Quick Command Reference

```bash
# Start development server
npm run dev

# Build for production
npm run build

# In browser console, test language switching:
i18next.changeLanguage('es')  # Spanish
i18next.changeLanguage('fr')  # French
i18next.changeLanguage('en')  # English

# View current language
i18next.language

# View loaded resources
i18next.options.resources

# Find hardcoded strings in component
grep -r "'[A-Z]" src/components/MyComponent.jsx
```

---

## 📞 Need Help?

### Quick References
- **Phase 1 Complete:** [I18N_PHASE_1_COMPLETION_REPORT.md](I18N_PHASE_1_COMPLETION_REPORT.md)
- **Phase 2 Plan:** [PHASE_2_STRING_EXTRACTION_PLAN.md](PHASE_2_STRING_EXTRACTION_PLAN.md)
- **Full Audit:** [I18N_INTERNATIONALIZATION_AUDIT.md](I18N_INTERNATIONALIZATION_AUDIT.md)
- **Quick Ref:** [I18N_QUICK_REFERENCE.md](I18N_QUICK_REFERENCE.md)
- **Roadmap:** [I18N_IMPLEMENTATION_ROADMAP.md](I18N_IMPLEMENTATION_ROADMAP.md)

### Common Issues
| Issue | Solution |
|-------|----------|
| `Cannot find module 'i18next'` | Run `npm install --legacy-peer-deps i18next react-i18next` |
| Language switch not working | Add `const { t } = useTranslation()` inside component |
| Translation key showing in UI | Check JSON file has the key, check component has correct namespace |
| Build fails with i18n error | Verify `src/i18n/config.js` exists, rebuild: `npm run build` |
| App crashes on startup | Check `src/main.jsx` has `I18nextProvider` wrapper |

---

## 🎯 Next Steps

1. **Read Phase 2 Plan:** [PHASE_2_STRING_EXTRACTION_PLAN.md](PHASE_2_STRING_EXTRACTION_PLAN.md) (20 min)
2. **Pick a component:** Start with LandingPage or AuthModal2 (highest priority)
3. **Extract strings:** Follow Phase 2 extraction workflow
4. **Create JSON keys:** Add to appropriate namespace file
5. **Update component:** Add `useTranslation()` and `t()` calls
6. **Test:** Switch languages, verify UI updates
7. **Repeat:** Move to next component

**Est. time per component:** 2-3 hours (including testing)

---

**Version:** 1.0.0  
**Last Updated:** January 24, 2026  
**Status:** READY FOR PHASE 2 EXECUTION

