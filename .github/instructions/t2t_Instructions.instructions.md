---
applyTo: '**'
---

# Time 2 Trade (T2T) - GitHub Copilot Instructions

**Version:** 4.0.0  
**Last Updated:** January 16, 2026  
**Purpose:** AI agent guidelines for working with Time 2 Trade codebase

---

## 🚨 CRITICAL: Read This First

### Before Making ANY Changes:

1. **📖 READ THE KNOWLEDGE BASE**
   - Open `kb/kb.md` and read relevant sections
   - Contains: architecture, tech stack, data models, patterns, troubleshooting
   - DO NOT duplicate kb.md content - reference it instead

2. **🔍 UNDERSTAND CONTEXT**
   - Use semantic search to find related code
   - Check component dependencies and imports
   - Review existing patterns before implementing new ones

3. **📝 FILE HEADERS ARE MANDATORY**
   Every file MUST start with:
   ```javascript
   /**
    * relative/path/to/file.ext
    * 
    * Purpose: Brief description (2-3 lines max)
    * Key responsibility and main functionality
    * 
    * Changelog:
    * v1.1.0 - 2026-01-16 - Added feature X
    * v1.0.0 - 2025-09-15 - Initial implementation
    */
   ```

4. **🔄 UPDATE DOCUMENTATION**
   - After significant changes, update `kb/kb.md` → Change Log
   - Update version numbers in affected file headers
   - Keep descriptions concise and actionable

---

## 🎯 Project Context

**What:** Trading session clock with dual-circle design (AM inner, PM outer) for futures/forex traders  
**URL:** https://time2.trade/  
**Key Features:**
- 8 customizable trading sessions with visual clock arcs
- Economic events calendar (multi-source: NFS, JBlanked/MQL5, GPT fallback)
- Timezone support with automatic conversions
- Cloud sync settings via Firebase
- PWA installable app
- SEO-optimized multi-page SPA

**Tech:** React 19 + Vite 6 + MUI v7 + Firebase (Auth, Firestore, Functions v2)

**For details:** See `kb/kb.md` → Project Overview, Tech Stack, Architecture

---

## 🗺️ Routing Architecture

### Route Structure
| Route | Component | Access | Purpose |
|-------|-----------|--------|---------|
| `/` | `LandingPage` | Public | SEO-optimized marketing page |
| `/clock` | `ClockPage` | Public | **Primary app** - Trading clock UI |
| `/app` | `HomePage` | Public | Legacy app shell (noindex) |
| `/calendar` | `CalendarPage` | Public | Economic events calendar |
| `/about` | `AboutPage` | Public | About page |
| `/privacy` | `PrivacyPage` | Public | Privacy policy |
| `/terms` | `TermsPage` | Public | Terms of service |
| `/contact` | `ContactPage` | Public | Contact form |
| `/login` | `LoginPage` | Public (restricted) | Standalone passwordless auth (fallback) |
| `/upload-desc` | `UploadDescriptions` | Admin | Upload event descriptions |
| `/export` | `ExportEvents` | Admin | Export events to JSON |
| `/fft2t` | `FFTTUploader` | Superadmin | GPT event uploader |

### Authentication UI
- **Primary:** `AuthModal2.jsx` - Used throughout app (landing, calendar, settings)
- **Fallback:** `/login` route - For direct links and magic link callbacks

### Route Guards
- `PublicRoute` - Accessible to all, optional `restricted` prop redirects authenticated users
- `PrivateRoute` - Requires authentication, supports `roles` and `plans` props

### Key Files
- `src/routes/AppRoutes.jsx` - Route configuration
- `src/components/routes/PublicRoute.jsx` - Public route guard
- `src/components/routes/PrivateRoute.jsx` - Private route guard

---

## 📁 Critical File Rules

### 🚫 NEVER MODIFY:
- `src/firebase.js` - Firebase configuration (already set up)
- `.env` / `functions/.env` - Environment variables (NEVER commit)
- `src/components/ClockCanvas.jsx` - Native Canvas API (DO NOT replace with MUI)

### ✅ PRIMARY COMPONENTS (Actively Used):
- `src/components/AuthModal2.jsx` - **Primary auth UI** (800+ lines, fully MUI)
- `src/components/SettingsSidebar2.jsx` - **Primary settings drawer** (1330+ lines, fully MUI)
- `src/components/CalendarEmbed.jsx` - Calendar workspace component
- `src/components/EventsFilters3.jsx` - Event filtering UI
- `src/components/EventsTimeline2.jsx` - Timeline view
- `src/components/EventsTable.jsx` - Table view

### ⚠️ LEGACY COMPONENTS (Being Phased Out):
- `src/components/AuthModal.jsx` - Legacy auth (use AuthModal2)
- `src/components/SettingsSidebar.jsx` - Legacy settings (use SettingsSidebar2)

### 📖 KEY REFERENCE FILES:
- `kb/kb.md` - Primary documentation (read first!)
- `src/hooks/useClock.js` - Session detection logic
- `src/hooks/useSettings.js` - Settings persistence
- `src/hooks/useCalendarData.js` - Calendar data fetching
- `src/services/economicEventsService.js` - Events service
- `src/services/canonicalEconomicEventsService.js` - Canonical events
- `src/utils/clockUtils.js` - Canvas drawing utilities

---

## 🏗️ Architecture Quick Reference

### State Management
- `AuthContext` - User authentication state + role management
- `SettingsContext` - User settings (clock, sessions, preferences)
- Custom hooks for feature-specific state

### Data Flow
1. User visits → Load route → Check auth state
2. Auth modal (AuthModal2) → Magic link or Google OAuth
3. Clock updates → Detect active session → Update UI
4. Settings change → Debounced Firestore sync
5. Guest mode → localStorage fallback

### Firebase Collections
```
users/                           # User profiles + settings
economicEvents/                  # Canonical events (multi-source)
  └─ events/                     # Event documents
      └─ {eventDocId}
          ├─ canonicalName
          ├─ currency
          ├─ date
          ├─ sources: { nfs, jblanked, gpt }
          └─ ...
economicEventsCalendar/          # Legacy per-source events
economicEventDescriptions/       # Event descriptions + trading tips
systemJobs/                      # Background job tracking
```

### Cloud Functions (functions/src/)
| Function | Purpose |
|----------|---------|
| `syncEconomicEventsCalendarScheduled` | Daily 5 AM EST sync |
| `syncEconomicEventsCalendarNow` | Manual sync trigger |
| `nfsSyncService.ts` | NFS week sync |
| `jblankedActualsService.ts` | JBlanked actuals sync |
| `gptUploadService.ts` | GPT placeholder ingest |

**For architecture details:** See `kb/kb.md` → Architecture Overview

---

## 🧩 Component Architecture

### Page Layouts
```
AppRoutes
├── PublicLayout (marketing pages)
│   ├── AppBar / NavigationMenu
│   ├── CookiesBanner
│   └── Page Content
├── AppLayout (app pages)
│   ├── AppBar (sticky)
│   ├── Main Content
│   └── Mobile Bottom Nav
└── Modals (global)
    ├── AuthModal2 (z-index: 12001)
    ├── WelcomeModal (z-index: 11000)
    ├── ContactModal
    └── ConfirmModal
```

### Clock Components
```
ClockPage / HomePage
├── ClockCanvas.jsx (Canvas API - DO NOT MODIFY)
├── ClockEventsOverlay.jsx (event markers)
├── ClockHandsOverlay.jsx (hand overlays)
├── DigitalClock.jsx
├── SessionLabel.jsx
└── TimezoneSelector.jsx
```

### Calendar Components
```
CalendarPage
└── CalendarEmbed.jsx
    ├── EventsFilters3.jsx
    ├── NewsSourceSelector.jsx
    ├── EventsTable.jsx / EventsTimeline2.jsx
    ├── EventModal.jsx
    └── EventNotesDialog.jsx
```

### Z-Index Stack (IMPORTANT)
```
12001-12004  AuthModal2 + nested modals (HIGHEST)
11000        WelcomeModal
10000        EmailLinkHandler verification
2000         High-priority modals
1600         SettingsSidebar2 drawer
1400         AppBar / Bottom navigation
1200         Popovers, tooltips
1100         Sticky headers
```

---

## 🪝 Hooks Reference

| Hook | Purpose |
|------|---------|
| `useClock.js` | Clock tick, session detection, time calculations |
| `useSettings.js` | Settings persistence (Firestore + localStorage) |
| `useCalendarData.js` | Calendar data fetching with filters |
| `useClockEventMarkers.js` | Clock overlay marker calculations |
| `useClockEventsData.js` | Clock events data fetching |
| `useEventNotes.js` | User event notes CRUD |
| `useFavorites.js` | Event favorites management |
| `useFullscreen.js` | Fullscreen mode toggle |
| `useTimeEngine.js` | Advanced time calculations |

---

## 🔧 Services Reference

| Service | Purpose |
|---------|---------|
| `economicEventsService.js` | Main events API (fetch, sync, filter) |
| `canonicalEconomicEventsService.js` | Canonical multi-source events |
| `eventNotesService.js` | User notes Firestore operations |
| `favoritesService.js` | Favorites Firestore operations |
| `eventsCache.js` | LocalStorage caching layer |
| `firestoreHelpers.js` | Firestore utility functions |

---

## 📝 Coding Standards

### React Best Practices
```javascript
// ✅ DO: Functional components with hooks
const Component = ({ prop }) => {
  const [state, setState] = useState(init);
  useEffect(() => { /* cleanup */ return () => {}; }, [deps]);
  return <div>...</div>;
};

// ✅ DO: Memoize expensive operations
const value = useMemo(() => compute(a, b), [a, b]);
const MemoComponent = React.memo(({ data }) => <div>{data}</div>);

// ✅ DO: Use lazy loading for routes/modals
const AuthModal2 = lazy(() => import('./AuthModal2'));

// ❌ DON'T: Class components, inline complex logic, missing dependency arrays
```

### MUI Components
```javascript
// ✅ DO: Use sx prop with theme values
<Button variant="contained" color="primary" sx={{ mt: 2, px: 3 }}>
  Click Me
</Button>

// ✅ DO: Use slotProps for Dialog customization
<Dialog
  sx={{ zIndex: 12001 }}
  slotProps={{
    backdrop: { sx: { zIndex: -1 } },
    paper: { sx: { borderRadius: 3 } },
  }}
>

// ❌ DON'T: Inline styles, styled-components, className for dynamic styles
```

### Firebase Patterns
```javascript
// ✅ DO: Proper cleanup and serverTimestamp
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (user) => setUser(user));
  return () => unsub();
}, []);

await setDoc(doc(db, 'users', uid), {
  createdAt: serverTimestamp(),
});

// ❌ DON'T: Client timestamps, missing unsubscribe, no error handling
```

### File Naming
- **Components:** PascalCase (`AuthModal2.jsx`)
- **Hooks:** camelCase with `use` prefix (`useClock.js`)
- **Services:** camelCase with Service suffix (`economicEventsService.js`)
- **Utils:** camelCase (`clockUtils.js`)
- **TypeScript:** `.tsx` for components, `.ts` for logic

---

## 🚨 Critical Constraints

### DO NOT:
1. ❌ Modify Firebase config or commit credentials
2. ❌ Replace ClockCanvas.jsx with MUI (uses native Canvas API)
3. ❌ Break auth flow (magic links + OAuth must work)
4. ❌ Change session detection without testing midnight crossover
5. ❌ Add external CSS frameworks (Bootstrap, Tailwind)
6. ❌ Use `document.getElementById` (use refs)
7. ❌ Add console.logs in production
8. ❌ Change Firestore structure without migration plan
9. ❌ Lower AuthModal2 z-index below 12001
10. ❌ Modify canonical events structure without updating all sources

### ALWAYS:
1. ✅ Test auth flows (magic link, Google OAuth, logout)
2. ✅ Verify settings persist (Firestore + localStorage fallback)
3. ✅ Check responsive design (mobile, tablet, desktop)
4. ✅ Ensure at least 1 clock element is visible (toggle constraint)
5. ✅ Test timezone changes update clock correctly
6. ✅ Verify Canvas hover tooltips work
7. ✅ Test route guards (public vs private routes)
8. ✅ Verify z-index layering on mobile

### Performance
- Clock updates: 1 second interval (not 60fps)
- Canvas: `requestAnimationFrame`, cache static elements
- Settings: Debounced Firestore updates (500ms)
- Routes: Lazy loading with Suspense
- Events: LocalStorage caching with 24-hour expiry

---

## 🧪 Testing Priorities

### Authentication
- Magic link email flow (send → click → verify)
- Google OAuth (new user + returning user)
- Logout and session cleanup
- Role-based access (admin, superadmin)

### Routing
- Public routes accessible without auth
- Private routes redirect to /login
- Restricted routes redirect authenticated users
- 404 handling

### Settings Persistence
- Firestore save/load when logged in
- localStorage fallback for guests
- Default settings for new users

### Calendar & Events
- Multi-source event fetching (NFS, JBlanked, GPT)
- Filter persistence across sessions
- Event notes CRUD
- Favorites sync

### Responsive Design
- Desktop (1200px+), Tablet (768-1199px), Mobile (<768px)
- Safe area handling (notch, home indicator)

**For complete checklist:** See `kb/kb.md` → Testing Strategy

---

## 🔧 Development Workflow

### Local Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production (includes prerender)
npm run lint             # Lint code
npm run preview          # Preview production build
```

### Cloud Functions
```bash
cd functions
npm install              # Install function dependencies
npm run build            # Build TypeScript
firebase deploy --only functions  # Deploy functions
```

### Deployment (Firebase Hosting - Primary)
```bash
npm run deploy           # Build + deploy to Firebase Hosting
```

**Production URL:** https://time2.trade/

### Git Workflow
- **Main branch:** `main` (protected)
- **Feature branches:** `feature/description`
- **Bug fixes:** `bugfix/description`
- **DO NOT commit:** `.env`, `functions/.env`, `node_modules/`, `dist/`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Blank screen on load | Check body bg-color is F9F9F9, verify route exists, check console |
| Settings not persisting | Verify user authenticated, check Firestore rules, inspect network |
| Session not detecting | Verify 24-hour format, correct timezone, test midnight crossover |
| Canvas not scaling | Check `devicePixelRatio`, verify `ctx.scale(dpr, dpr)` |
| Auth modal behind AppBar | Ensure z-index is 12001+, check slotProps backdrop |
| Magic link fails | Check authorized domains in Firebase Console, verify SMTP config |
| Events not loading | Check canonical collection path, verify sync job ran |
| Route not found | Check AppRoutes.jsx, ensure component is lazy loaded |

**For detailed troubleshooting:** See `kb/kb.md` → Troubleshooting Guide

---

## 📚 Quick Reference Links

**Primary Documentation:**
- `kb/kb.md` - Comprehensive knowledge base (READ FIRST)
- `kb/BrandGuide.md` - Brand colors, typography, logo usage
- `kb/TargetAudience.md` - User personas and JTBD

**External APIs:**
- JBlanked API: https://jblanked.com/api/docs/news-calendar-api

**Framework Docs:**
- MUI: https://mui.com/material-ui/getting-started/
- Firebase: https://firebase.google.com/docs
- React Router: https://reactrouter.com/en/main

---

## 📈 Current Priorities

### ✅ Completed (v3.0.0 → v4.0.0)
- Multi-page SPA routing architecture
- AuthModal2 - Full MUI auth with magic links
- SettingsSidebar2 - Full MUI settings drawer
- Canonical economic events (multi-source)
- Calendar page with embed component
- PWA support with install prompt
- SEO optimization with prerender
- Firebase Analytics integration
- Event notes and favorites
- Clock events overlay

### 📋 Technical Debt
- Remove legacy AuthModal.jsx and SettingsSidebar.jsx
- Add unit tests (Vitest) and E2E tests (Playwright)
- Implement error boundaries
- Add file headers to remaining files

**For full roadmap:** See `kb/kb.md` → Change Log

---

## 💡 Key Principles

1. **Simplicity First:** Minimal design, no unnecessary decorations
2. **Reference, Don't Duplicate:** Point to kb.md instead of repeating details
3. **User Experience:** Dynamic backgrounds, text color adaptation, responsive design
4. **Performance:** Memoization, debouncing, Canvas caching, lazy loading
5. **Accessibility:** Clear error messages, informative tooltips, keyboard navigation
6. **Consistency:** Follow existing patterns, maintain file header format, update docs
7. **Mobile-First:** Design for mobile, enhance for desktop
8. **Auth-Gated Gracefully:** Show value before requiring login, use AuthModal2

---

**Last Updated:** January 16, 2026  
**Version:** 4.0.0 (Multi-page SPA + Canonical Events + Full MUI Migration)

---

**Need more details?** → Read `kb/kb.md` for comprehensive documentation on architecture, tech stack, data models, security rules, deployment procedures, and troubleshooting guides.
