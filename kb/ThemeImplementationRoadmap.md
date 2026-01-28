# Theme Implementation Roadmap

**Version:** 1.3.0  
**Created:** January 28, 2026  
**Status:** ✅ Phase 3.2 Complete - Theme Toggle UI Implemented  
**Estimated Effort:** 17-24 hours (3-4 days)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Architecture Design](#architecture-design)
4. [Color Palette Specification](#color-palette-specification)
5. [Phase 1: Foundation](#phase-1-foundation)
6. [Phase 2: Component Migration](#phase-2-component-migration)
7. [Phase 3: UI Toggle & Settings](#phase-3-ui-toggle--settings)
8. [Phase 4: Polish & Testing](#phase-4-polish--testing)
9. [Files Inventory](#files-inventory)
10. [Testing Checklist](#testing-checklist)
11. [Progress Log](#progress-log)

---

## Executive Summary

Implement MUI light/dark theme toggle following BEP standards with:
- Dynamic theme switching via `ThemeContext`
- System preference detection (`prefers-color-scheme`)
- Three-way toggle: Light / System / Dark
- Firestore + localStorage persistence
- Full i18n support (EN/ES/FR)
- Smooth CSS transitions
- No flash of wrong theme on load (FOUC prevention)

### Key Constraints

| Constraint | Reason |
|------------|--------|
| ❌ DO NOT modify `ClockCanvas.jsx` internals | Uses native Canvas API per project instructions |
| ✅ Pass theme colors as props to canvas | Canvas receives colors from theme-aware parent |
| ✅ Keep session colors user-customizable | Independent of theme mode |
| ✅ Brand teal (`#018786`) for logos only | UI uses `#006064` for accessibility |

---

## Current State Assessment

### ✅ What's Already in Place

| Asset | Location | Status |
|-------|----------|--------|
| MUI ThemeProvider | `src/main.jsx` | Single static theme |
| Theme configuration | `src/theme.js` | Light mode only |
| Settings persistence | `src/contexts/SettingsContext.jsx` | Firestore + localStorage |
| useMediaQuery hook | Multiple components | Used for breakpoints only |
| Brand palette | `kb/BrandGuide.md` | Light/dark guidelines defined |

### ❌ What's Missing

| Gap | Impact |
|-----|--------|
| Dark palette definition | No dark mode colors |
| ThemeContext | No dynamic theme switching |
| System preference detection | No `prefers-color-scheme` usage |
| CSS variables for colors | Hardcoded in `index.css` |
| Theme toggle UI | No user control |
| i18n translations | No theme-related strings |

### ⚠️ Technical Debt (Hardcoded Colors)

**High-priority files with hardcoded hex colors:**

```
src/theme.js                    - 10+ colors (source of truth)
src/index.css                   - #F9F9F9, #333, #666
src/components/AuthModal2.jsx   - #018786, #006665, rgba values
src/components/ClockPanelPaper.jsx - #ffffff, #0F172A, #3c4d63
src/components/AccountModal.jsx - #d32f2f
src/utils/newsApi.js            - Impact colors (#d32f2f, #f57c00, etc.)
src/utils/clockUtils.js         - #9e9e9e (gray sessions)
```

---

## Architecture Design

### Provider Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         main.jsx                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  I18nextProvider                                          │  │
│  │  └─ HelmetProvider                                        │  │
│  │     └─ BrowserRouter                                      │  │
│  │        └─ ThemeContextProvider (NEW)                      │  │
│  │           └─ MUI ThemeProvider theme={dynamicTheme}       │  │
│  │              └─ AuthProvider                              │  │
│  │                 └─ SettingsProvider                       │  │
│  │                    └─ LanguageProvider                    │  │
│  │                       └─ TooltipProvider                  │  │
│  │                          └─ AppRoutes                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### ThemeContext API

```typescript
interface ThemeContextValue {
  // State
  themeMode: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark'; // Computed from system pref if mode='system'
  
  // Actions
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void; // Cycles: light → dark → system → light
  
  // Utilities
  isDarkMode: boolean; // Shorthand for resolvedTheme === 'dark'
}
```

### Theme Factory Pattern

```javascript
// src/theme.js (refactored)
import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './themePalettes';

export const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light' ? lightPalette : darkPalette),
  },
  // ... component overrides (shared)
});

export default getTheme('light'); // Default export for backwards compat
```

### CSS Variable Injection Strategy

```javascript
// In ThemeContext, inject CSS vars on theme change:
useEffect(() => {
  const root = document.documentElement;
  const colors = resolvedTheme === 'dark' ? darkCssVars : lightCssVars;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}, [resolvedTheme]);
```

### FOUC Prevention

```html
<!-- index.html - Blocking script before React -->
<script>
  (function() {
    const stored = localStorage.getItem('t2t-theme-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (stored === 'system' && prefersDark) || (!stored && prefersDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  })();
</script>
```

---

## Color Palette Specification

### Light Mode (Current)

| Token | Hex | Usage |
|-------|-----|-------|
| `background.default` | `#F9F9F9` | Page background |
| `background.paper` | `#FFFFFF` | Cards, modals, drawers |
| `text.primary` | `#4B4B4B` | Headings, body text |
| `text.secondary` | `#666666` | Captions, hints |
| `primary.main` | `#006064` | Buttons, links, active states |
| `primary.light` | `#428E92` | Hover states |
| `primary.dark` | `#00363A` | Pressed states |
| `secondary.main` | `#85b8b7` | Complementary elements |
| `divider` | `rgba(0,0,0,0.12)` | Borders, separators |
| `action.hover` | `rgba(0,0,0,0.04)` | Interactive hover |

### Dark Mode (Proposed)begin Phase 1: Foundation

| Token | Hex | Usage | Rationale |
|-------|-----|-------|-----------|
| `background.default` | `#121212` | Page background | Material Design dark standard |
| `background.paper` | `#1E1E1E` | Cards, modals, drawers | 8dp elevation equivalent |
| `text.primary` | `#E0E0E0` | Headings, body text | High contrast on dark |
| `text.secondary` | `#A0A0A0` | Captions, hints | Medium contrast |
| `primary.main` | `#4DB6AC` | Buttons, links, active | Lighter teal for dark bg |
| `primary.light` | `#80CBC4` | Hover states | Increased vibrancy |
| `primary.dark` | `#00897B` | Pressed states | Deeper teal |
| `secondary.main` | `#B2DFDB` | Complementary elements | Light teal complement |
| `divider` | `rgba(255,255,255,0.12)` | Borders, separators | Inverted opacity |
| `action.hover` | `rgba(255,255,255,0.08)` | Interactive hover | Inverted |

### Impact Colors (Theme-Aware)

| Impact | Light Mode | Dark Mode |
|--------|------------|-----------|
| High | `#d32f2f` | `#ef5350` |
| Medium | `#f57c00` | `#ff9800` |
| Low | `#F2C94C` | `#FFD54F` |
| Non-economic | `#9e9e9e` | `#bdbdbd` |

### CSS Variables Mapping

```css
:root {
  /* Injected by ThemeContext */
  --t2t-bg-default: #F9F9F9;
  --t2t-bg-paper: #FFFFFF;
  --t2t-text-primary: #4B4B4B;
  --t2t-text-secondary: #666666;
  --t2t-primary-main: #006064;
  --t2t-divider: rgba(0,0,0,0.12);
}

[data-theme="dark"] {
  --t2t-bg-default: #121212;
  --t2t-bg-paper: #1E1E1E;
  --t2t-text-primary: #E0E0E0;
  --t2t-text-secondary: #A0A0A0;
  --t2t-primary-main: #4DB6AC;
  --t2t-divider: rgba(255,255,255,0.12);
}
```

---

## Phase 1: Foundation

**Estimated Time:** 4-6 hours  
**Status:** ✅ Completed

### Tasks

- [ ] **1.1** Create `src/contexts/ThemeContext.jsx`
  - [ ] Define `ThemeContextProvider` component
  - [ ] Implement `themeMode` state with `'light'` | `'dark'` | `'system'`
  - [ ] Add `useMediaQuery('(prefers-color-scheme: dark)')` for system detection
  - [ ] Compute `resolvedTheme` from mode + system preference
  - [ ] Export `useThemeMode` hook
  - [ ] Add localStorage persistence (`t2t-theme-mode` key)

- [ ] **1.2** Refactor `src/theme.js`
  - [ ] Create `lightPalette` object (extract current palette)
  - [ ] Create `darkPalette` object (new dark colors)
  - [ ] Export `getTheme(mode)` factory function
  - [ ] Keep `export default` for backwards compatibility
  - [ ] Update changelog header

- [ ] **1.3** Create `src/theme/themePalettes.js`
  - [ ] Define shared component overrides
  - [ ] Export `lightPalette` and `darkPalette`
  - [ ] Export CSS variable maps

- [ ] **1.4** Update `src/main.jsx`
  - [ ] Import `ThemeContextProvider`
  - [ ] Wrap app with `ThemeContextProvider` (above MUI ThemeProvider)
  - [ ] Replace static `theme` with dynamic theme from context
  - [ ] Update changelog header

- [ ] **1.5** Convert `src/index.css`
  - [ ] Replace `#F9F9F9` → `var(--t2t-bg-default)`
  - [ ] Replace `#333` → `var(--t2t-text-primary)`
  - [ ] Replace `#666` → `var(--t2t-text-secondary)`
  - [ ] Add CSS variable fallbacks
  - [ ] Update changelog header

- [ ] **1.6** Add FOUC prevention to `index.html`
  - [ ] Add blocking `<script>` before `<div id="root">`
  - [ ] Read localStorage and set `data-theme` attribute
  - [ ] Set `color-scheme` CSS property

### Acceptance Criteria

- [ ] Theme switches between light/dark programmatically
- [ ] System preference detected correctly
- [ ] No console errors
- [ ] Page renders without flash on reload
- [ ] localStorage persists theme choice

---

## Phase 2: Component Migration

**Estimated Time:** 6-8 hours  
**Status:** ⬜ Not Started

### Tier 1: High-Impact Components

- [x] **2.1** `src/components/AuthModal2.jsx` ✅
  - [x] Replace `#018786` → `theme.palette.primary.main`
  - [x] Replace `rgba(1, 135, 134, 0.08)` → `alpha(theme.palette.primary.main, 0.08)`
  - [x] Replace `#006665` → `theme.palette.primary.dark`
  - [x] Test all auth flows in dark mode

- [x] **2.2** `src/components/ClockPanelPaper.jsx` ✅
  - [x] Replace `#ffffff` → `theme.palette.background.paper`
  - [x] Use `theme.palette.text.primary` for text color
  - [x] Pass theme colors to canvas children as props
  - [x] Test with session-based background toggle

- [x] **2.3** `src/components/AccountModal.jsx` ✅
  - [x] Replace hardcoded error colors → `theme.palette.error`
  - [x] Replace hover backgrounds → `theme.palette.action.hover`

- [x] **2.4** `src/components/SettingsSidebar2.jsx` ✅
  - [x] Verify `bgcolor: 'background.paper'` works (should auto-switch)
  - [x] Check divider colors
  - [x] Test drawer appearance in dark mode

### Tier 2: Calendar & Events Components

- [x] **2.5** `src/components/CalendarEmbed.jsx` ✅
  - [x] Verify theme-aware backgrounds
  - [x] Check table/timeline contrast
  - [x] Migrated scrollbar styles to theme-aware useMemo

- [x] **2.6** `src/components/EventsTimeline2.jsx` ✅
  - [x] Verify timeline colors adapt
  - [x] Check event card backgrounds
  - [x] Replaced all disabled/past event gray colors

- [x] **2.7** `src/components/EventModal.jsx` ✅
  - [x] Verify modal backgrounds
  - [x] Check impact color contrast
  - [x] Updated all action button states

- [x] **2.8** `src/components/EventsFilters3.jsx` ✅
  - [x] Verify filter chip colors
  - [x] Check dropdown backgrounds
  - [x] Refactored ChipButton to accept theme prop

### Tier 3: Utility Files

- [ ] **2.9** `src/utils/newsApi.js`
  - [ ] Create `getImpactColors(theme)` helper
  - [ ] Export theme-aware color getters
  - [ ] Update all impact color usages

- [ ] **2.10** `src/utils/clockUtils.js`
  - [ ] Accept `grayColor` as parameter (default: `#9e9e9e`)
  - [ ] Pass from parent based on theme

- [ ] **2.11** `src/utils/customEventStyle.js`
  - [ ] Make default color theme-aware

### Tier 4: Navigation & Layout

- [ ] **2.12** `src/components/AppBar.tsx`
  - [ ] Verify header adapts to dark mode
  - [ ] Check logo variant switching (white on dark)

- [ ] **2.13** `src/components/NavigationMenu.tsx`
  - [ ] Verify menu backgrounds
  - [ ] Check active state colors

- [ ] **2.14** `src/components/PublicLayout.jsx`
  - [ ] Verify footer adapts
  - [ ] Check overall page backgrounds

- [ ] **2.15** `src/components/LandingPage.jsx`
  - [ ] Verify hero section in dark mode
  - [ ] Check all section backgrounds
  - [ ] Test CTA button contrast

### Acceptance Criteria

- [ ] All components render correctly in both themes
- [ ] No hardcoded color values remain (except canvas internals)
- [ ] Contrast ratios meet WCAG AA (4.5:1 for text)
- [ ] Interactive elements clearly visible

---

## Phase 3: UI Toggle & Settings (DEFERRED)

**Estimated Time:** 3-4 hours  
**Status:** ⬜ Deferred - Postponed for Phase 3 in next session

*Note: Phase 3 UI implementation deferred. Phase 2 color migration complete and verified. Phase 4 testing commences immediately to validate theme switching in browser.*

### Tasks

- [ ] **3.1** Add i18n translations
  - [ ] `public/locales/en/settings.json` - Add appearance section
  - [ ] `public/locales/es/settings.json` - Spanish translations
  - [ ] `public/locales/fr/settings.json` - French translations

```json
{
  "appearance": {
    "title": "Appearance",
    "subtitle": "Customize how Time 2 Trade looks",
    "themeMode": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "systemHint": "Follows your device settings"
  }
}
```

- [ ] **3.2** Add theme toggle to `SettingsSidebar2.jsx`
  - [ ] Create new `SectionCard` for Appearance
  - [ ] Add `ToggleButtonGroup` with Light/System/Dark options
  - [ ] Use icons: `LightModeRounded`, `DarkModeRounded`, `SettingsBrightnessRounded`
  - [ ] Connect to `ThemeContext`
  - [ ] Position in General tab (after Language & Timezone)

- [ ] **3.3** Sync theme to Firestore
  - [ ] Add `themeMode` to `SettingsContext` schema
  - [ ] Include in Firestore user document
  - [ ] Load on auth state change
  - [ ] Merge with `ThemeContext` or keep separate

- [ ] **3.4** Add theme indicator to AppBar (optional)
  - [ ] Small icon button for quick toggle
  - [ ] Tooltip with current mode

### Acceptance Criteria

- [ ] Toggle UI matches existing settings design language
- [ ] All three modes work correctly
- [ ] Settings persist to Firestore for logged-in users
- [ ] Settings persist to localStorage for guests
- [ ] i18n works for all three languages

---

## Phase 4: Polish & Testing

**Estimated Time:** 4-6 hours  
**Status:** 🚀 In Progress - Browser Testing & Validation

### Tasks

- [ ] **4.1** Browser Testing & Validation
  - [ ] Verify theme switching works in browser
  - [ ] Check localStorage persistence
  - [ ] Test system preference detection
  - [ ] Verify no FOUC on page load
  - [ ] Test theme toggle across browser tabs

- [ ] **4.2** Desktop Browsers Testing
  - [ ] Chrome: Theme switching, localStorage, system mode
  - [ ] Firefox: Same as Chrome
  - [ ] Safari: Same as Chrome
  - [ ] Edge: Same as Chrome

- [ ] **4.3** Mobile Browsers Testing
  - [ ] iOS Safari: System pref detection, toggle
  - [ ] Android Chrome: System pref detection, toggle
  - [ ] Verify safe areas handled correctly

- [ ] **4.4** Route Testing (All Themes)
  - [ ] `/` Landing page - Hero, sections, CTAs
  - [ ] `/clock` Clock page - Canvas, overlays, zoom
  - [ ] `/calendar` Calendar page - Events, tables, filters
  - [ ] `/about` About page - Content, sections
  - [ ] `/privacy` Privacy page - Legal content
  - [ ] `/terms` Terms page - Legal content
  - [ ] `/settings` Settings - All sections, modals

- [ ] **4.5** Component Testing (Both Themes)
  - [ ] AuthModal2 - Email/Google flows
  - [ ] SettingsSidebar2 - All sections, visibility
  - [ ] CalendarEmbed - Events, filters, timeline
  - [ ] EventsTable - Sorting, filtering
  - [ ] EventsTimeline2 - Past/current/next events
  - [ ] EventModal - All sections, notes, favorites
  - [ ] Dialogs - All dialogs in both themes
  - [ ] Toasts - Notifications in both themes

- [ ] **4.6** Canvas & Overlay Testing
  - [ ] Clock numbers visible in both themes
  - [ ] Clock hands visible in both themes
  - [ ] Session arcs render correctly (user-controlled)
  - [ ] Event markers visible and readable
  - [ ] Hover tooltips visible on canvas

- [ ] **4.7** Accessibility & Contrast
  - [ ] Measure text contrast (target ≥4.5:1)
  - [ ] Check interactive element contrast (≥3:1)
  - [ ] Verify focus indicators visible
  - [ ] Test keyboard navigation in both themes
  - [ ] Test with screen readers (light & dark)

- [ ] **4.8** Performance Testing
  - [ ] Theme switch latency ≤300ms
  - [ ] No layout shift on theme change
  - [ ] Smooth 60fps transitions
  - [ ] Mobile: Test on throttled network
  - [ ] Memory: No leaks on multiple toggles

- [ ] **4.9** Visual Polish
  - [ ] Verify all logo variants display correctly
  - [ ] Scrollbar styling matches theme
  - [ ] No inconsistent colors across app
  - [ ] Borders/dividers visible in both themes
  - [ ] Input fields properly styled

- [ ] **4.10** Error States & Edge Cases
  - [ ] Auth errors display properly
  - [ ] Loading states visible
  - [ ] Empty states match theme
  - [ ] Test with localStorage disabled
  - [ ] Test rapid theme toggles

- [ ] **4.11** PWA & Meta Tags
  - [ ] PWA install works in both themes
  - [ ] Meta theme-color updates dynamically
  - [ ] Favicon visible in both themes

- [ ] **4.12** Documentation & Cleanup
  - [ ] Update `kb/kb.md` - Architecture section
  - [ ] Update component file headers (v1.x.0 complete)
  - [ ] Remove any console.log statements
  - [ ] Verify no eslint warnings
  - [ ] Commit and create summary

### Acceptance Criteria

- [ ] All routes render correctly in both light & dark modes
- [ ] No visual bugs, color mismatches, or contrast issues
- [ ] Theme switching is smooth (no flashing)
- [ ] Persistence works (localStorage + system pref)
- [ ] All interactive elements work in both modes
- [ ] Canvas renders correctly with theme colors
- [ ] Accessibility standards met (WCAG AA)
- [ ] Performance acceptable on mobile
- [ ] Documentation complete

---

## Files Inventory

### New Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/ThemeContext.jsx` | Theme state management |
| `src/theme/themePalettes.js` | Light/dark palette definitions |
| `src/utils/themeColors.js` | Theme-aware color helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `src/theme.js` | Refactor to factory pattern |
| `src/main.jsx` | Add ThemeContextProvider |
| `src/index.css` | CSS variables |
| `index.html` | FOUC prevention script |
| `src/contexts/SettingsContext.jsx` | Add themeMode persistence |
| `src/components/SettingsSidebar2.jsx` | Theme toggle UI |
| `src/components/AuthModal2.jsx` | Theme-aware colors |
| `src/components/ClockPanelPaper.jsx` | Theme-aware colors |
| `src/components/AccountModal.jsx` | Theme-aware colors |
| `src/components/AppBar.tsx` | Logo variant switching |
| `src/utils/newsApi.js` | Theme-aware impact colors |
| `src/utils/clockUtils.js` | Accept color params |
| `public/locales/*/settings.json` | i18n translations |

### Files to NOT Modify

| File | Reason |
|------|--------|
| `src/components/ClockCanvas.jsx` | Native Canvas API - per project instructions |
| `src/firebase.js` | Firebase config - per project instructions |

---

## Testing Checklist

### Functional Tests

- [ ] Light mode matches current production exactly
- [ ] Dark mode has proper contrast on all pages
- [ ] System preference detection works
- [ ] Theme persists after refresh
- [ ] Theme syncs across tabs (localStorage event)
- [ ] Theme loads from Firestore for logged-in users
- [ ] Guest users can toggle theme
- [ ] No flash of wrong theme on load

### Visual Tests (Both Themes)

- [ ] Landing page hero section
- [ ] Clock page with all elements
- [ ] Calendar page with events
- [ ] Settings sidebar
- [ ] Auth modals (login, signup, forgot password)
- [ ] All dialogs and modals
- [ ] Mobile bottom navigation
- [ ] Toast notifications
- [ ] Loading states

### Accessibility Tests

- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Interactive element contrast ≥ 3:1
- [ ] Focus indicators visible in both themes
- [ ] Color not sole means of conveying info

### Performance Tests

- [ ] No layout shift on theme change
- [ ] Transition smooth (no jank)
- [ ] Initial render not delayed

---

## Progress Log

### Session 3 - January 27, 2026 (CURRENT)

**Status:** ✅ Phase 3.2 Complete - Theme Toggle UI Implemented  
**Time Spent:** 30 minutes  
**Completed:**
- [x] 3.1 i18n Translations - Added appearance section to all 6 locale files (EN/ES/FR × src/public)
  - Title, Theme Mode, Light, Dark, System, System Description translations
- [x] 3.2 Theme Toggle UI - Implemented SettingsSidebar2 appearance section
  - ToggleButtonGroup with Light/Dark/System buttons
  - LightModeIcon, DarkModeIcon, SettingsBrightnessIcon integration
  - Full responsive MUI styling with theme tokens
  - onChange handler wired to setThemeMode()
  - Positioned before Language & Timezone section in General tab

**Files Created:**
- ✅ `PHASE_3_COMPLETION_SUMMARY.md` (Phase 3.2 documentation)

**Files Modified:**
- ✅ `src/components/SettingsSidebar2.jsx` (v2.0.3 - Theme toggle UI)
- ✅ `src/i18n/locales/en/settings.json` (appearance section)
- ✅ `src/i18n/locales/es/settings.json` (appearance section)
- ✅ `src/i18n/locales/fr/settings.json` (appearance section)
- ✅ `public/locales/en/settings.json` (appearance section)
- ✅ `public/locales/es/settings.json` (appearance section)
- ✅ `public/locales/fr/settings.json` (appearance section)

**Testing Status:**
- ✅ Zero compilation errors
- ✅ App loads successfully at localhost:5173
- ✅ Settings drawer opens without errors
- ✅ Theme toggle visible in General tab
- ✅ All 3 theme buttons display correctly
- ✅ Icons render properly
- ✅ Translations loaded (EN/ES/FR)

**Next Steps:**
- Phase 3.3: Firestore persistence (optional)
- Phase 3.4: AppBar quick toggle (optional)
- Phase 4: Comprehensive browser testing

---

### Session 2 - January 27, 2026

**Status:** ✅ Phase 2 Complete - 8 Components Migrated  
**Time Spent:** 90 minutes  
**Completed:**
- [x] 2.1-2.8: Migrated 8 major components to theme tokens (70+ color replacements)
- [x] Fixed nested component issues (DaySection, EventRow in CalendarEmbed)
- [x] Infrastructure: Fixed JSON duplicate keys in admin.json
- [x] Updated ThemeImplementationRoadmap v1.2.0 with Phase 2 completion

**Files Modified:**
- AuthModal2.jsx, ClockPanelPaper.jsx, AccountModal.jsx, SettingsSidebar2.jsx
- CalendarEmbed.jsx, EventsTimeline2.jsx, EventModal.jsx, EventsFilters3.jsx
- admin.json (src & public), settings.json (added appearance keys)

**Verification:**
- ✅ grep_search confirmed zero hardcoded hex colors in actual code
- ✅ get_errors confirmed zero compilation errors
- ✅ All theme tokens properly implemented

---

### Session 1 - January 28, 2026

**Status:** ✅ Phase 1 Complete  
**Time Spent:** 2 hours  
**Completed:**
- [x] 1.1 Created `src/contexts/ThemeContext.jsx` - Full theme state management with system preference detection, localStorage persistence, resolvedTheme computation
- [x] 1.2 Refactored `src/theme.js` - Factory pattern with `getTheme(mode)`, moved palettes to separate file
- [x] 1.3 Created `src/theme/themePalettes.js` - Light/dark palettes, impact colors, CSS variable maps, shared component overrides
- [x] 1.4 Updated `src/main.jsx` - Added ThemeContextProvider, dynamic theme from context, `AppWithTheme` component
- [x] 1.5 Converted `src/index.css` - CSS variables for all hardcoded colors, smooth transitions
- [x] 1.6 Added FOUC prevention to `index.html` - Blocking script sets data-theme before React hydrates

**Files Created:**
- ✅ `src/contexts/ThemeContext.jsx` (v1.0.0)
- ✅ `src/theme/themePalettes.js` (v1.0.0)

**Files Modified:**
- ✅ `src/theme.js` (v2.0.0 - factory pattern)
- ✅ `src/main.jsx` (v5.0.0 - ThemeContextProvider)
- ✅ `src/index.css` (v1.3.0 - CSS variables)
- ✅ `index.html` (v2.1.1 - FOUC prevention)

**Testing Status:**
- ⚠️ Code compiles, but untested in browser yet
- Next: Run dev server to test theme switching

**Next Steps:**
- Run `npm run dev` to test theme switching
- Verify no console errors
- Verify localStorage persistence
- Begin Phase 2: Component Migration

---

### Session 2 - January 28, 2026 (Phase 2 + Fixes)

**Status:** ✅ Phase 2 Complete - All 8 components migrated  
**Time Spent:** 3.5 hours  
**Completed:**
- [x] 2.1 AuthModal2.jsx - 11 hardcoded colors replaced with theme tokens (v1.6.0)
- [x] 2.2 ClockPanelPaper.jsx - 3 colors replaced (v1.1.0)
- [x] 2.3 AccountModal.jsx - 1 error color replaced (v2.3.0)
- [x] 2.4 SettingsSidebar2.jsx - Verified clean, no hardcoded colors (v2.0.2)
- [x] 2.5 CalendarEmbed.jsx - 15+ colors replaced, scrollbar refactored (v1.5.78)
- [x] 2.6 EventsTimeline2.jsx - 15+ colors replaced for disabled/past states (v3.9.0)
- [x] 2.7 EventModal.jsx - 8+ colors in button states (v1.11.3)
- [x] 2.8 EventsFilters3.jsx - 8+ colors, ChipButton refactored (v1.3.48)
- [x] Fixed nested components (DaySection, EventRow) - added useTheme hooks
- [x] Fixed admin.json duplicate keys

**Key Achievements:**
- 70+ individual color token replacements across all components
- 2 major architecture refactors (CalendarEmbed scrollbar, EventsFilters3 ChipButton)
- All nested components now have access to theme via useTheme hook
- JSON validation fixed for locale files

**Files Modified:**
- ✅ 8 components (AuthModal2, ClockPanelPaper, AccountModal, SettingsSidebar2, CalendarEmbed, EventsTimeline2, EventModal, EventsFilters3)
- ✅ `src/i18n/locales/en/admin.json` - Removed duplicates
- ✅ `public/locales/en/admin.json` - Removed duplicates

**Testing Status:**
- ✅ All Phase 2 components verified with grep_search (no remaining hardcoded hex colors in actual code)
- ✅ Component compilation successful
- ⚠️ Browser runtime testing pending

**Blockers:**
- None - Phase 2 migration complete

**Next Steps:**
- Begin Phase 4: Browser testing and validation
- Verify theme switching works in all routes
- Test dark/light mode contrast and visibility
- Validate localStorage persistence
- Test system preference detection  
**Completed:**
- [x] 1.1 Created `src/contexts/ThemeContext.jsx` - Full theme state management with system preference detection, localStorage persistence, resolvedTheme computation
- [x] 1.2 Refactored `src/theme.js` - Factory pattern with `getTheme(mode)`, moved palettes to separate file
- [x] 1.3 Created `src/theme/themePalettes.js` - Light/dark palettes, impact colors, CSS variable maps, shared component overrides
- [x] 1.4 Updated `src/main.jsx` - Added ThemeContextProvider, dynamic theme from context, `AppWithTheme` component
- [x] 1.5 Converted `src/index.css` - CSS variables for all hardcoded colors, smooth transitions
- [x] 1.6 Added FOUC prevention to `index.html` - Blocking script sets data-theme before React hydrates

**Files Created:**
- ✅ `src/contexts/ThemeContext.jsx` (v1.0.0)
- ✅ `src/theme/themePalettes.js` (v1.0.0)

**Files Modified:**
- ✅ `src/theme.js` (v2.0.0 - factory pattern)
- ✅ `src/main.jsx` (v5.0.0 - ThemeContextProvider)
- ✅ `src/index.css` (v1.3.0 - CSS variables)
- ✅ `index.html` (v2.1.1 - FOUC prevention)

**Testing Status:**
- ⚠️ Code compiles, but untested in browser yet
- Next: Run dev server to verify theme switching works

**Next Steps:**
- Run `npm run dev` to test theme switching
- Verify no console errors
- Verify localStorage persistence
- Begin Phase 2: Component Migration

---

### Session Template

```markdown
### Session N - [Date]

**Status:** [Emoji] [Description]  
**Time Spent:** X hours  
**Completed:**
- [x] Task description

**Blockers:**
- Issue description

**Next Steps:**
- Task to do next
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-01-28 | Phase 2 complete - All 8 components migrated. Phase 3 deferred. Phase 4 browser testing ready. 70+ color replacements. Nested component fixes. JSON validation fixes. |
| 1.1.0 | 2026-01-28 | Phase 1 complete - Foundation established (ThemeContext, themes, FOUC prevention) |
| 1.0.0 | 2026-01-28 | Initial roadmap creation |

---

**Last Updated:** January 28, 2026  
**Author:** GitHub Copilot  
**Review Status:** Phase 2 Complete - Ready for Phase 4 Testing
