---
applyTo: '**'
---

# Time 2 Trade (T2T) - GitHub Copilot Instructions

**Version:** 3.0.0  
**Last Updated:** November 29, 2025  
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
    * v1.1.0 - 2025-11-29 - Added feature X
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
**Key Features:** 8 customizable sessions, economic events (JBlanked API), timezone support, cloud sync  
**Tech:** React 19 + Vite + MUI v7 + Firebase (Auth, Firestore, Functions v2)

**For details:** See `kb/kb.md` → Project Overview, Tech Stack, Architecture

---

## 📁 Critical File Rules

### 🚫 NEVER MODIFY:
- `src/firebase.js` - Firebase configuration (already set up)
- `.env` - Environment variables (NEVER commit)
- `src/components/ClockCanvas.jsx` - Native Canvas API (DO NOT replace with MUI)

### ⚠️ NEEDS MUI MIGRATION:
- `src/components/AuthModal.jsx` (social auth buttons)
- `src/components/AccountModal.jsx` (avatar upload)
- `src/components/SettingsSidebar.jsx` (300+ lines, complex)

### 📖 KEY REFERENCE FILES:
- `kb/kb.md` - Primary documentation (read first!)
- `src/hooks/useClock.js` - Session detection logic
- `src/hooks/useSettings.js` - Settings persistence (Firestore + localStorage)
- `src/utils/clockUtils.js` - Canvas drawing utilities

---

## 🏗️ Architecture Quick Reference

**State Management:**
- `AuthContext` - User authentication state
- `useSettings()` hook - Settings persistence (Firestore when logged in, localStorage for guests)
- `useClock()` hook - Time updates (1 second interval)

**Data Flow:**
1. User logs in → Load settings from Firestore
2. Clock updates → Detect active session → Update UI
3. Settings change → Debounced Firestore sync
4. Guest mode → localStorage fallback

**Firebase Collections:**
- `users` - User profiles + settings
- `economicEventsCalendar` - 12,966 events (JBlanked sync)
- `economicEventDescriptions` - Event descriptions + trading tips
- `systemJobs` - Background job tracking

**For architecture details:** See `kb/kb.md` → Architecture Overview, Component Architecture

---

## 📝 Coding Standards

### React Best Practices:
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

// ❌ DON'T: Class components, inline complex logic, missing dependency arrays
```

### MUI Components:
```javascript
// ✅ DO: Use sx prop with theme values
<Button variant="contained" color="primary" sx={{ mt: 2, px: 3 }}>
  Click Me
</Button>

<Box sx={{ color: 'primary.main', bgcolor: 'background.paper' }}>
  Content
</Box>

// ❌ DON'T: Inline styles, styled-components, className for dynamic styles
```

### Firebase Patterns:
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

### File Naming:
- **Components:** PascalCase (`AuthModal.jsx`)
- **Hooks:** camelCase with `use` prefix (`useClock.js`)
- **Utils:** camelCase (`clockUtils.js`)

---

## 🚨 Critical Constraints

### DO NOT:
1. ❌ Modify Firebase config or commit credentials
2. ❌ Replace ClockCanvas.jsx with MUI (uses native Canvas API)
3. ❌ Break auth flow (email verification required)
4. ❌ Change session detection without testing midnight crossover
5. ❌ Add external CSS frameworks (Bootstrap, Tailwind)
6. ❌ Use `document.getElementById` (use refs)
7. ❌ Add console.logs in production
8. ❌ Change Firestore structure without migration plan

### ALWAYS:
1. ✅ Test auth flows (login, signup, logout, password reset)
2. ✅ Verify settings persist (Firestore + localStorage fallback)
3. ✅ Check responsive design (mobile, tablet, desktop)
4. ✅ Ensure at least 1 clock element is visible (toggle constraint)
5. ✅ Test timezone changes update clock correctly
6. ✅ Verify Canvas hover tooltips work

### Performance:
- Clock updates: 1 second (not 60fps)
- Canvas: `requestAnimationFrame`, cache static elements
- Settings: Debounced Firestore updates
- Memoize: Timezone selector, expensive computations

---

## 🧪 Testing Priorities

**Authentication:**
- Email/password with verification required
- Social logins (Google, Facebook, Twitter)
- Password reset, account deletion, profile updates

**Settings Persistence:**
- Firestore save/load when logged in
- localStorage fallback for guests
- Default settings for new users

**Clock Functionality:**
- Active session detection (including midnight crossover)
- Time to end/start calculations
- Timezone conversions
- Canvas hover tooltips

**Responsive Design:**
- Desktop, laptop, tablet (portrait/landscape), mobile
- Settings button always visible (top-right)
- Timezone selector fixed at bottom
- Sidebar scrollable on small screens

**For complete checklist:** See `kb/kb.md` → Testing Strategy

---

## 🔧 Development Workflow

### Local Development:
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run lint             # Lint code
```

### Git Workflow:
- **Main branch:** `main` (protected)
- **Feature branches:** `feature/description`
- **Bug fixes:** `bugfix/description`
- **DO NOT commit:** `.env`, `node_modules/`, `dist/`, `.DS_Store`

### Deployment:
- **Host:** GitHub Pages (`https://lofitrades.github.io/trading-clock/`)
- **Command:** `npm run deploy` (uses gh-pages)

**For environment setup:** See `kb/kb.md` → Development Environment

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Blank screen on load | Check CssBaseline removed from `main.jsx`, body bg-color is F9F9F9, Switch.jsx not corrupted |
| Settings not persisting | Verify user authenticated, Firestore rules allow write, check console errors |
| Session not detecting | Verify 24-hour format, correct timezone, test midnight crossover (23:00→01:00) |
| Canvas not scaling | Check `devicePixelRatio`, match CSS dimensions × DPR, verify `ctx.scale(dpr, dpr)` |

**For detailed troubleshooting:** See `kb/kb.md` → Troubleshooting Guide

---

## 📚 Quick Reference Links

**Primary Documentation:**
- `kb/kb.md` - Comprehensive knowledge base (READ FIRST)

**JBlanked API Documentation:**
- API Portal: https://jblanked.com/api/portal
- News Calendar API: https://jblanked.com/api/docs/news-calendar-api
- Economic Events Endpoint: `https://jblanked.com/api/news/v2/economic-calendar-events/`

**MUI Documentation:**
- Components: https://mui.com/material-ui/getting-started/
- Theming: https://mui.com/material-ui/customization/theming/

**Firebase Documentation:**
- Auth: https://firebase.google.com/docs/auth/web/start
- Firestore: https://firebase.google.com/docs/firestore/quickstart

**React Best Practices:**
- Hooks: https://react.dev/reference/react

---

## 📈 Current Priorities

### Active Work:
- ✅ **COMPLETED:** Economic events integration (v2.0.0)
- ⏳ **IN PROGRESS:** MUI migration (3 components remaining)
- 📋 **NEXT:** Add file headers to existing files

### Technical Debt:
- Complete MUI migration (AuthModal, AccountModal, SettingsSidebar)
- Remove Sidebar.css and login-signup.css
- Add unit tests (Vitest) and E2E tests (Playwright)
- Implement error boundaries
- Add file headers to all existing files

**For full roadmap:** See `kb/kb.md` → Change Log, Future Enhancements

---

## 💡 Key Principles

1. **Simplicity First:** Minimal design, no unnecessary decorations
2. **Reference, Don't Duplicate:** Point to kb.md instead of repeating details
3. **User Experience:** Dynamic backgrounds, text color adaptation, responsive design
4. **Performance:** Memoization, debouncing, Canvas caching, lazy loading
5. **Accessibility:** Clear error messages, informative tooltips, keyboard navigation
6. **Consistency:** Follow existing patterns, maintain file header format, update docs

---

**Last Updated:** November 29, 2025  
**Version:** 3.0.0 (Economic Events Integration + Enterprise Documentation)

---

**Need more details?** → Read `kb/kb.md` for comprehensive documentation on architecture, tech stack, data models, security rules, deployment procedures, and troubleshooting guides.
