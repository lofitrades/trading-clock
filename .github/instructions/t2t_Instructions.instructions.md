---
applyTo: '**'
---

# Time 2 Trade (T2T) - Project Instructions for AI Agents

## 🎯 Project Overview

**Time 2 Trade** is a web application for futures and forex day traders that visualizes key market trading sessions (sessions) using an innovative dual-circle analog clock design. The app helps traders track active market sessions and manage their trading schedule across multiple timezones.

### Core Purpose
- Visualize 8 customizable "sessions" (high-volatility trading periods) on a dual-circle clock
- Inner circle: AM hours (12 AM - 12 PM)
- Outer circle: PM hours (12 PM - 12 AM)
- Support multiple timezones for global traders
- Persist user settings via Firebase Firestore
- Provide free accounts with premium features

---

## 🏗️ Tech Stack (Current State - Mid-Migration)

### ✅ Confirmed Technologies:
- **Frontend Framework**: React 19.0.0
- **Build Tool**: Vite 6.1.0
- **UI Library**: Material-UI (MUI) v6.1+ (migrating from styled-components)
- **Icons**: @mui/icons-material (replacing Font Awesome & Material Symbols)
- **Backend**: Firebase 11.3.1
  - Authentication (Email/Password, Google, Facebook, Twitter OAuth)
  - Firestore (user settings storage)
  - Storage (profile photo uploads)
- **Styling**: Emotion (via MUI) + CSS modules
- **State Management**: React Context API (AuthContext)
- **Custom Hooks**: useClock, useSettings

### 🚧 Migration Status:
**COMPLETED (12/17 components):**
- ✅ MUI Theme configuration (`src/theme.js`)
- ✅ Switch component → MUI Switch
- ✅ ConfirmModal → MUI Dialog
- ✅ UnlockModal → MUI Dialog
- ✅ ForgotPasswordModal → MUI Dialog + TextField
- ✅ DigitalClock → MUI Typography
- ✅ SessionLabel → MUI Paper + Typography
- ✅ App.jsx menu button → MUI IconButton
- ✅ index.html cleaned (removed Font Awesome, Material Symbols, Facebook SDK)

**PENDING (5 remaining):**
- ⏳ AuthModal (complex - social auth buttons)
- ⏳ AccountModal (complex - avatar upload)
- ⏳ Sidebar (most complex - 300+ lines)
- ⏳ Remove unused CSS files (Sidebar.css, login-signup.css)
- ⏳ Final testing

---

## 📁 Project Structure

```
trading-clock/
├── .github/
│   └── instructions/
│       └── t2t_Instructions.instructions.md (this file)
├── public/
│   └── AboutContent.txt
├── src/
│   ├── App.jsx                    # Main app component
│   ├── App.css                    # App-specific styles (minimal)
│   ├── index.css                  # Global styles (keep - used for layout)
│   ├── main.jsx                   # Entry point with ThemeProvider
│   ├── theme.js                   # MUI theme configuration
│   ├── firebase.js                # Firebase config (DO NOT MODIFY)
│   ├── assets/
│   ├── components/
│   │   ├── AccountModal.jsx       # ⏳ Needs MUI migration
│   │   ├── AuthModal.jsx          # ⏳ Needs MUI migration
│   │   ├── ClockCanvas.jsx        # ✅ Keep as-is (Canvas API)
│   │   ├── ConfirmModal.jsx       # ✅ MUI Dialog
│   │   ├── DigitalClock.jsx       # ✅ MUI Typography
│   │   ├── ForgotPasswordModal.jsx # ✅ MUI Dialog
│   │   ├── SessionLabel.jsx      # ✅ MUI Paper + Typography
│   │   ├── Sidebar.jsx            # ⏳ Needs MUI migration
│   │   ├── Sidebar.css            # ⏳ DELETE after migration
│   │   ├── Switch.jsx             # ✅ MUI Switch
│   │   ├── TimeSettings.jsx
│   │   ├── TimeStatus.jsx
│   │   ├── TimezoneSelector.jsx   # ✅ Minimal design (fixed bottom)
│   │   ├── UnlockModal.jsx        # ✅ MUI Dialog
│   │   └── login-signup.css       # ⏳ DELETE after migration
│   ├── contexts/
│   │   └── AuthContext.jsx        # ✅ Auth state management
│   ├── hooks/
│   │   ├── useClock.js            # ✅ Clock logic & session detection
│   │   └── useSettings.js         # ✅ Settings persistence (Firestore + localStorage)
│   └── utils/
│       ├── clockUtils.js          # ✅ Canvas drawing utilities
│       └── messages.js            # ✅ User-friendly error messages
├── index.html
├── package.json
├── vite.config.js
└── .env                           # Firebase credentials (DO NOT COMMIT)
```

---

## 🔥 Firebase Configuration

### Project Details:
- **Project ID**: `time-2-trade-app`
- **Auth Domain**: `time-2-trade-app.firebaseapp.com`
- **Environment Variables**: `.env` file (already configured)

### Firebase Services Used:
1. **Authentication**:
   - Email/Password with email verification required
   - Google OAuth
   - Facebook OAuth (handled by Firebase, no SDK needed in HTML)
   - Twitter OAuth
   - Auto-signup on login if user not found
   - Auto-login on signup if email already exists

2. **Firestore** (`users` collection):
   ```javascript
   users/{uid} {
     email: string,
     displayName: string,
     photoURL: string,
     createdAt: timestamp,
     updatedAt: timestamp,
     settings: {
       clockSize: number,           // 150|250|300|375|500
       sessions: array[8],          // session objects
       selectedTimezone: string,     // IANA timezone
       backgroundColor: string,      // hex color
       backgroundBasedOnSession: boolean,
       showHandClock: boolean,
       showDigitalClock: boolean,
       showSessionLabel: boolean,
       showTimeToEnd: boolean,
       showTimeToStart: boolean,
     }
   }
   ```

3. **Storage** (`profilePictures/{uid}`):
   - User avatar uploads

### 🚨 CRITICAL RULES:
- **NEVER modify `src/firebase.js`**
- **NEVER commit `.env` file**
- **ALWAYS use environment variables for Firebase config**
- Firebase Authentication is handled by Firebase SDK, not external SDKs

---

## 🎨 Design System & UX Principles

### Color Palette:
```javascript
primary: {
  main: '\x23018786',    // Teal (active state)
  light: '\x2385b8b7',   // Light teal (hover/secondary)
  dark: '\x23006665',    // Dark teal
}
background: {
  default: '\x23F9F9F9', // Light gray (app background)
  paper: '\x23FFFFFF',   // White (cards/modals)
}
text: {
  primary: '\x234B4B4B', // Dark gray
  secondary: '\x23666666', // Medium gray
}
```

### Session Default Colors:
1. NY AM: Mint green (A8D8B9)
2. NY PM: Baby blue (A7C7E7)
3. Market Closed: Peach (F7C2A3)
4. Asia: Pink (F8C8D1)
5. London: Lavender (D1B2E1)
6-8. User customizable

### UX Principles:
1. **Minimal Design**: No unnecessary borders, shadows, or decorations
2. **Dynamic Background**: App background changes based on active session (optional toggle)
3. **Text Color Adaptation**: Text color automatically adjusts (white on dark backgrounds, dark on light)
4. **Fixed Elements**: 
   - Settings button: Top-right corner
   - Timezone selector: Bottom center (minimal, transparent)
5. **Responsive Clock Sizes**:
   - Aesthetic: 300px
   - Tiny: 150px
   - Small: 250px
   - Normal: 375px (default)
   - Big (Tablet): 500px
6. **Pro Features**: Free account required to unlock (no paywall)
7. **Tooltips**: Informative without being intrusive

---

## 🧩 Component Architecture

### Component Hierarchy:
```
App (maxWidth: clockSize + 200)
├── IconButton (settings menu)
├── clock-elements-container
│   ├── ClockCanvas (if showHandClock)
│   ├── DigitalClock (if showDigitalClock)
│   └── SessionLabel (if showSessionLabel)
├── TimezoneSelector (fixed bottom)
└── Sidebar (drawer)
    ├── User Menu (login/logout/account)
    ├── About Section (collapsible)
    └── Settings Section (collapsible)
        ├── General Settings
        │   ├── Hand Clock (toggle)
        │   ├── Hand Clock (toggle)
        │   ├── Show Session Label (toggle)
        │   ├── Clock Style (select)
        │   ├── Background Color (color picker)
        │   └── Background based on Session (toggle)
        └── Session Settings (8 sessions)
            ├── Name (text input)
            ├── Start Time (time picker)
            ├── End Time (time picker)
            ├── Color (color picker)
            ├── Show Time to End (toggle)
            └── Show Time to Start (toggle)
```

### State Management:
- **Global State**: `AuthContext` (user authentication)
- **Local State**: `useSettings()` hook (settings persistence)
- **Clock State**: `useClock()` hook (time updates every 1 second)

### Data Flow:
1. User logs in → `AuthContext` updates
2. Settings load from Firestore → `useSettings` hook
3. Clock updates every second → `useClock` hook
4. Active session detected → Background/label update
5. Settings change → Firestore update (debounced)
6. Guest user → localStorage fallback

---

## 🔐 Authentication Flow

### Login Process:
1. User enters email/password or uses social login
2. Firebase authenticates
3. **Email/Password**: Check if email verified → Reject if not
4. **Social Login**: Auto-verified
5. Load user settings from Firestore
6. If no settings exist, create default settings document
7. Close auth modal

### Signup Process:
1. User enters email/password or uses social login
2. Firebase creates account
3. **Email/Password**: Send verification email → Show activation modal
4. **Social Login**: Auto-verified
5. Create default settings in Firestore
6. Close auth modal

### Special Cases:
- **Login with non-existent email**: Auto-create account + send verification
- **Signup with existing email**: Auto-login (if password correct)

---

## 🎯 Session Logic

### Session Detection Algorithm:
```javascript
1. Get current time in selected timezone
2. For each session:
   - Parse start/end times (24-hour format)
   - Check if current time falls within range
   - Handle midnight crossover (end < start)
3. If multiple active, choose most recently started
4. Calculate time to end (in seconds)
5. Find next upcoming session
6. Calculate time to start (in seconds)
```

### Clock Rendering:
- **AM Circle**: radius = 52% of clock radius
- **PM Circle**: radius = 75% of clock radius
- **Line Width**: Scales with clock size (12-100px)
- **Hover Effect**: Increase line width by ~15%
- **Tooltip**: Show session name on hover

### Canvas Drawing:
1. Draw static elements (face, numbers) once
2. Draw dynamic elements (sessions, hands) every frame
3. Use `requestAnimationFrame` for smooth updates
4. Numbers positioned at 31% radius
5. Hour hand length: 50% (AM) or 74% (PM)
6. Minute hand: 90% radius
7. Second hand: 100% radius

---

## 📝 Coding Standards

### React Best Practices:
```javascript
// ✅ DO: Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>...</div>;
};

// ✅ DO: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// ✅ DO: Use React.memo for pure components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// ❌ DON'T: Use class components
// ❌ DON'T: Inline complex logic in JSX
// ❌ DON'T: Forget dependency arrays in useEffect
```

### MUI Component Usage:
```javascript
// ✅ DO: Use MUI components with sx prop for styling
import { Button, Dialog, TextField } from '@mui/material';

<Button 
  variant="contained" 
  color="primary"
  sx={{ mt: 2, px: 3 }}
>
  Click Me
</Button>

// ✅ DO: Use theme values
<Box sx={{ 
  color: 'primary.main',
  bgcolor: 'background.paper',
  p: theme => theme.spacing(2)
}}>
  Content
</Box>

// ❌ DON'T: Use inline styles for themeable values
// ❌ DON'T: Mix styled-components with MUI
// ❌ DON'T: Use className for dynamic styles
```

### Firebase Best Practices:
```javascript
// ✅ DO: Handle auth state changes
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
  return () => unsubscribe();
}, []);

// ✅ DO: Use serverTimestamp for consistency
await setDoc(doc(db, 'users', uid), {
  createdAt: serverTimestamp(),
});

// ✅ DO: Handle errors gracefully
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  setError(getFriendlyErrorMessage(error.code));
}

// ❌ DON'T: Store sensitive data in Firestore without security rules
// ❌ DON'T: Use timestamps from client (use serverTimestamp)
// ❌ DON'T: Forget to unsubscribe from listeners
```

### File Naming Conventions:
- **Components**: PascalCase (e.g., `AuthModal.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useClock.js`)
- **Utils**: camelCase (e.g., `clockUtils.js`)
- **Styles**: Component name + `.css` (e.g., `Sidebar.css`)

---

## 🚨 Critical Rules & Constraints

### DO NOT:
1. ❌ Modify `src/firebase.js` or `.env` file
2. ❌ Commit Firebase credentials
3. ❌ Remove or modify `ClockCanvas.jsx` (uses native Canvas API)
4. ❌ Break authentication flow (email verification is required)
5. ❌ Change session detection algorithm without testing
6. ❌ Add external CSS frameworks (Bootstrap, Tailwind, etc.)
7. ❌ Use `document.getElementById` (use refs instead)
8. ❌ Add console.logs in production code
9. ❌ Remove user settings validation
10. ❌ Change Firebase collection/document structure without migration plan

### ALWAYS:
1. ✅ Test auth flows (login, signup, logout, password reset)
2. ✅ Verify settings persist across sessions
3. ✅ Check responsive design (mobile, tablet, desktop)
4. ✅ Validate timezone changes update clock correctly
5. ✅ Ensure session colors are user-customizable
6. ✅ Test with and without authentication
7. ✅ Verify localStorage fallback for guest users
8. ✅ Check dynamic background color changes
9. ✅ Test all toggle switches (minimum 1 must be enabled)
10. ✅ Ensure Canvas hover tooltips work

### Performance Considerations:
- Clock updates every 1 second (not 60fps)
- Canvas rendering uses `requestAnimationFrame`
- Settings updates are debounced (not on every keystroke)
- Static canvas elements drawn once, cached
- Memoize timezone selector (expensive operation)
- User settings loaded once on mount

---

## 🧪 Testing Checklist

### Authentication Testing:
- [ ] Email/password signup with verification
- [ ] Email/password login (verified users only)
- [ ] Google OAuth login
- [ ] Facebook OAuth login
- [ ] Twitter OAuth login
- [ ] Password reset flow
- [ ] Logout functionality
- [ ] Account deletion
- [ ] Profile photo upload/delete
- [ ] Display name update

### Settings Testing:
- [ ] All 8 sessions editable
- [ ] Session colors persist
- [ ] Start/end times validation
- [ ] Clock size changes (5 options)
- [ ] Background color picker
- [ ] Background based on session toggle
- [ ] Show/hide hand clock
- [ ] Show/hide digital clock
- [ ] Show/hide session label
- [ ] Show/hide time to end
- [ ] Show/hide time to start
- [ ] At least 1 clock element must be visible

### Clock Testing:
- [ ] Analog clock renders correctly
- [ ] Digital clock shows correct time
- [ ] Session label updates in real-time
- [ ] Active session detection accurate
- [ ] Time to end countdown accurate
- [ ] Next session time to start accurate
- [ ] Timezone changes reflect immediately
- [ ] Hover tooltips on sessions
- [ ] Canvas scaling on window resize
- [ ] Clock hands update every second

### Responsive Testing:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet Portrait (768x1024)
- [ ] Tablet Landscape (1024x768)
- [ ] Mobile Portrait (375x667)
- [ ] Mobile Landscape (667x375)
- [ ] Timezone selector stays at bottom
- [ ] Settings button always visible
- [ ] Sidebar scrollable on small screens

### Data Persistence Testing:
- [ ] Settings save to Firestore when logged in
- [ ] Settings load from Firestore on login
- [ ] Settings save to localStorage when logged out
- [ ] Settings load from localStorage on page refresh (guest)
- [ ] Settings cleared on logout
- [ ] Default settings created for new users

---

## 🔧 Development Workflow

### Local Development:
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Environment Setup:
1. Ensure `.env` file exists with Firebase credentials
2. DO NOT modify Firebase config values
3. If Firebase connection fails, verify `.env` is not committed

### Git Workflow:
- **Main branch**: `main` (protected)
- **Feature branches**: `feature/description`
- **Bug fixes**: `bugfix/description`
- **DO NOT commit**: `.env`, `node_modules/`, `dist/`, `.DS_Store`

### Deployment:
- Hosted on GitHub Pages: `https://lofitrades.github.io/trading-clock/`
- Deploy command: `npm run deploy` (uses gh-pages)
- Build output: `dist/` folder

---

## 📚 Key Files Reference

### `src/App.jsx`
- Main application container
- Manages sidebar open/close state
- Applies dynamic background color via `useEffect`
- Renders clock elements conditionally based on settings
- Handles text color adaptation for readability

### `src/hooks/useSettings.js`
- Manages all user settings state
- Loads settings from Firestore (logged in) or localStorage (guest)
- Provides update functions for each setting
- Validates toggle constraints (min 1 clock element visible)
- Syncs settings to Firestore on change

### `src/hooks/useClock.js`
- Updates current time every 1 second
- Detects active session based on current time
- Calculates time remaining until session ends
- Finds next upcoming session
- Calculates time until next session starts
- Handles timezone conversions

### `src/utils/clockUtils.js`
- Canvas drawing functions
- Static elements (clock face, numbers)
- Dynamic elements (sessions, hands)
- Color darkness detection (for text color)
- Time formatting utilities
- Hover detection logic

### `src/components/ClockCanvas.jsx`
- Renders analog clock using HTML5 Canvas
- Implements hover detection for session tooltips
- Uses `requestAnimationFrame` for smooth animations
- Scales based on `clockSize` prop
- Caches static elements for performance

### `src/components/Sidebar.jsx` (⚠️ NEEDS MIGRATION)
- Complex component with 300+ lines
- User authentication UI
- Collapsible sections (About, Settings)
- Nested accordions (General, Session settings)
- 8 session editors
- Toggle switches, text inputs, time pickers, color pickers
- User menu with profile photo
- **TO DO**: Migrate to MUI Drawer, Accordion, TextField, Select, Menu

---

## 🎓 Learning Resources

### MUI Documentation:
- Components: https://mui.com/material-ui/getting-started/
- Styling: https://mui.com/system/basics/
- Theming: https://mui.com/material-ui/customization/theming/

### Firebase Documentation:
- Auth: https://firebase.google.com/docs/auth/web/start
- Firestore: https://firebase.google.com/docs/firestore/quickstart
- Storage: https://firebase.google.com/docs/storage/web/start

### React Best Practices:
- Hooks: https://react.dev/reference/react
- Performance: https://react.dev/learn/render-and-commit

---

## 🐛 Common Issues & Solutions

### Issue: Blank screen on load
**Solution**: 
- Check if CssBaseline is removed from `main.jsx`
- Verify body background-color is set to F9F9F9 in `index.css`
- Ensure Switch.jsx is not corrupted (common issue after edits)

### Issue: "Invalid version specified" (Facebook SDK)
**Solution**: 
- Facebook SDK should NOT be in `index.html`
- Firebase handles OAuth, no external SDK needed

### Issue: Settings not persisting
**Solution**:
- Check if user is authenticated
- Verify Firestore security rules allow write
- Check browser console for Firestore errors

### Issue: Session not detecting correctly
**Solution**:
- Verify start/end times are in 24-hour format
- Check timezone is correct
- Test with midnight crossover cases (e.g., 23:00 to 01:00)

### Issue: Canvas not scaling
**Solution**:
- Check `window.devicePixelRatio` for high-DPI displays
- Ensure canvas width/height match CSS width/height * DPR
- Verify `ctx.scale(dpr, dpr)` is called

---

## 📈 Future Enhancements (Roadmap)

### Planned Features:
1. **Alerts & Push Notifications**: Notify before session starts
2. **Trading Journal**: Log trades during sessions
3. **Trading Buddy Chatbot**: AI assistant for traders
4. **High-Impact Events**: Economic calendar integration
5. **Integrated Music Player**: Lofi/chill music during trading sessions
6. **Mobile App**: React Native version
7. **Dark Mode**: Theme toggle
8. **Custom Session Templates**: Save/load session presets
9. **Multi-Clock View**: Display multiple timezones simultaneously
10. **Analytics Dashboard**: Track time spent in each session

### Technical Debt:
- Complete MUI migration (AuthModal, AccountModal, Sidebar)
- Remove Sidebar.css and login-signup.css
- Add unit tests (Jest + React Testing Library)
- Add E2E tests (Cypress or Playwright)
- Implement error boundaries
- Add loading states for async operations
- Optimize bundle size (code splitting)
- Add service worker for offline support
- Implement proper TypeScript migration path

---

## 👤 Contact & Support

- **Developer**: Lofi Trades
- **Email**: lofitradesx@gmail.com
- **Twitter/X**: [@lofi_trades][twitter-link]
- **Support**: [Buy me a coffee][coffee-link]

[twitter-link]: https://x.com/lofi_trades
[coffee-link]: https://www.buymeacoffee.com/lofitrades

---

## 📜 License & Usage

- **License**: Private (not open source yet)
- **Commercial Use**: Not permitted without permission
- **AI Training**: Do not use code for training AI models without permission

---

**Last Updated**: November 28, 2025
**Version**: 1.0.0-beta (MUI Migration in Progress)