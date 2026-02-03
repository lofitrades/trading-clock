# 🚀 Performance Optimization Roadmap - Time 2 Trade

**Lighthouse Score:** 38/100 → Target: 85+  
**Date:** January 29, 2026  
**Analysis Based On:** Lighthouse Performance Audit + Codebase Review

---

## 📊 Current Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **FCP** (First Contentful Paint) | 2.4s | <1.8s | 🔴 Poor |
| **LCP** (Largest Contentful Paint) | 4.0s | <2.5s | 🔴 Poor |
| **TBT** (Total Blocking Time) | 650ms | <200ms | 🔴 Poor |
| **CLS** (Cumulative Layout Shift) | 0 | <0.1 | ✅ Good |
| **Speed Index** | 3.3s | <3.4s | 🟡 Needs Work |

---

## 🎯 Root Causes Identified

### 1. **i18n Namespace Overload** (CRITICAL - Est. 600ms savings)
**Problem:** 18 namespaces preloaded immediately in `src/i18n/config.js`:
```javascript
ns: ['common', 'pages', 'filter', 'calendar', 'settings', 'contact', 'admin', 'actions', 
     'dialogs', 'form', 'validation', 'states', 'tooltips', 'a11y', 'auth', 'events', 
     'reminders', 'sessions']
```

**Impact:** Network dependency chain shows ~1,886ms critical path loading JSON files sequentially.

### 2. **JavaScript Execution Time** (CRITICAL - 9.6s total)
| File | CPU Time | Issue |
|------|----------|-------|
| `index-B45DuEr_.js` | 6,630ms | Main bundle too large |
| `App-BPQJ4uSI.js` | 5,503ms | Synchronous initialization |
| Firebase core+firestore | 166ms | Loaded eagerly |
| MUI icons | 43.8 KiB | All icons bundled |

### 3. **Forced Reflow** (216ms blocking)
- `clockUtils-tKX4nELR.js`: 45ms reflow
- `LandingPage-Dh_TiRNh.js`: 8ms reflow
- `Slide-CP0cWBcO.js`: 31ms reflow

### 4. **Unused JavaScript** (317 KiB potential savings)
- Third-party ads: 158.5 KiB unused
- `index-B45DuEr_.js`: 61.5 KiB unused
- `firebase-firestore`: 45.3 KiB unused

### 5. **Render Blocking CSS** (120ms delay)
- `index-DRyAXKJU.css`: 1.7 KiB blocking render

---

## 🗺️ Optimization Roadmap

### Phase 1: Critical Path Optimization (Est. +25 points)

#### 1.1 i18n Lazy Loading Strategy 🔴 HIGH PRIORITY
**File:** `src/i18n/config.js`

**Current:** 18 namespaces preloaded
**Target:** 3 namespaces preloaded (route-aware lazy loading)

```javascript
// BEFORE: 18 preloaded namespaces causing 1,886ms chain
ns: ['common', 'pages', 'filter', 'calendar', 'settings', ...]

// AFTER: Only 3 critical namespaces preloaded
ns: ['common', 'pages'],  // ~15 KiB total
// All other namespaces loaded on-demand via useTranslation()
```

**Implementation:**
1. Reduce preload list to `['common', 'pages']` only
2. Use `partialBundledLanguages: true` for true lazy loading
3. Add namespace loading to component `useEffect`:
```javascript
// In components that need namespaces
useEffect(() => {
  i18n.loadNamespaces(['calendar', 'filter']);
}, []);
```

**Est. Savings:** 600-800ms FCP/LCP improvement

---

#### 1.2 Firebase Lazy Initialization 🔴 HIGH PRIORITY
**File:** `src/firebase.js`

**Current:** Eager initialization on app load
**Target:** Lazy initialization on first use

```javascript
// BEFORE: Synchronous initialization
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const auth = getAuth(app);
const db = getFirestore(app);

// AFTER: Lazy getters with memoization
let _auth = null;
let _db = null;

export const getAuthLazy = () => {
  if (!_auth) {
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(app);
  }
  return _auth;
};

export const getDbLazy = async () => {
  if (!_db) {
    const { getFirestore } = await import('firebase/firestore');
    _db = getFirestore(app);
  }
  return _db;
};
```

**Alternative (Recommended):** Use dynamic imports in AuthContext/SettingsContext only when authentication is needed.

**Est. Savings:** 100-200ms TBT reduction

---

#### 1.3 MUI Icons Tree Shaking 🟡 MEDIUM PRIORITY
**Issue:** `mui-icons-0gBUM6OH.js` is 43.8 KiB

**Current Pattern (DETECTED):**
```javascript
// Individual imports are being used correctly
import AddRoundedIcon from '@mui/icons-material/AddRounded';
```

**Verification Needed:** Confirm no barrel imports exist:
```javascript
// BAD - pulls entire icon library
import { Add, Close, Edit } from '@mui/icons-material';
```

**Action:** Audit `customEventStyle.js` - has 30+ icon imports that may all be bundled.

---

#### 1.4 CSS Critical Path 🟡 MEDIUM PRIORITY
**File:** `index.html`

**Current:** CSS blocking render (120ms)
**Target:** Inline critical CSS, defer non-critical

```html
<!-- AFTER: Inline critical CSS -->
<style>
  /* Critical above-the-fold styles */
  body { margin: 0; background: #F9F9F9; font-family: 'Poppins', sans-serif; }
  #root { min-height: 100vh; display: flex; flex-direction: column; }
  /* Skeleton loading state */
  .t2t-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); }
</style>

<!-- Preload main CSS but don't block -->
<link rel="preload" href="/assets/index-DRyAXKJU.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

---

### Phase 2: Bundle Optimization (Est. +15 points)

#### 2.1 Enhanced Code Splitting
**File:** `vite.config.js`

```javascript
manualChunks: (id) => {
  // MUI core components - shared across all pages
  if (id.includes('node_modules/@mui/material')) {
    return 'mui-core';
  }
  
  // MUI icons - only load when needed
  if (id.includes('node_modules/@mui/icons-material')) {
    return 'mui-icons';
  }
  
  // Firebase Auth - lazy load
  if (id.includes('node_modules/firebase/auth')) {
    return 'firebase-auth';
  }
  
  // Firebase Firestore - lazy load (large ~92 KiB)
  if (id.includes('node_modules/firebase/firestore')) {
    return 'firebase-firestore';
  }
  
  // Firebase Analytics - defer until interaction
  if (id.includes('node_modules/firebase/analytics')) {
    return 'firebase-analytics';
  }
  
  // i18next - already using HTTP backend
  if (id.includes('node_modules/i18next')) {
    return 'i18n';
  }
  
  // date-fns tree-shake
  if (id.includes('node_modules/date-fns')) {
    return 'date-fns';
  }
},
```

#### 2.2 Route-Based Preloading
**File:** `src/routes/AppRoutes.jsx`

```javascript
// Add prefetch hints for likely next routes
const prefetchRoutes = {
  '/': ['/clock', '/calendar'],
  '/clock': ['/calendar'],
  '/calendar': ['/clock'],
};

useEffect(() => {
  const nextRoutes = prefetchRoutes[location.pathname] || [];
  nextRoutes.forEach(route => {
    // Prefetch route chunks on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Dynamic import to prefetch
        if (route === '/clock') import('../components/ClockPage');
        if (route === '/calendar') import('../components/CalendarPage');
      }, { timeout: 5000 });
    }
  });
}, [location.pathname]);
```

---

### Phase 3: Runtime Performance (Est. +10 points)

#### 3.1 Eliminate Forced Reflows
**Files:** `clockUtils.js`, `LandingPage.jsx`

**Common Causes:**
- Reading `offsetWidth`/`offsetHeight` after DOM mutations
- Accessing computed styles in render loops

**Solution Pattern:**
```javascript
// BEFORE: Forced reflow in each iteration
elements.forEach(el => {
  const width = el.offsetWidth;  // Forces layout
  el.style.width = width + 10 + 'px';  // Triggers reflow
});

// AFTER: Batch reads, then batch writes
const widths = elements.map(el => el.offsetWidth);  // Single reflow
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10 + 'px';
});
```

#### 3.2 Defer Non-Critical Initialization
**Files:** Various contexts

```javascript
// Defer analytics until after paint
useEffect(() => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initAnalytics();
    }, { timeout: 3000 });
  } else {
    setTimeout(initAnalytics, 2000);
  }
}, []);
```

---

### Phase 4: Third-Party Script Optimization (Est. +5 points)

#### 4.1 AdSense Defer Strategy (Already Implemented ✅)
**File:** `index.html` - Already defers AdSense loading

#### 4.2 Google Tag Manager Optimization
**Current:** Loading immediately
**Target:** Defer until user interaction or idle

```html
<!-- Move from <head> to before </body>, add defer -->
<script>
  // Only load GTM after first interaction
  const loadGTM = () => {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?l=dataLayer&id=G-LW2262GH6M';
    document.head.appendChild(script);
  };
  
  // Load on interaction or after 3s
  ['click', 'scroll', 'keydown'].forEach(evt => {
    window.addEventListener(evt, loadGTM, { once: true, passive: true });
  });
  setTimeout(loadGTM, 3000);
</script>
```

#### 4.3 Preconnect Optimization
**Current:** Unused preconnect to `firebase.googleapis.com`
**Action:** Remove unused preconnect or ensure it's actually used

---

## 📋 Implementation Priority Matrix

| Phase | Task | Impact | Effort | Priority |
|-------|------|--------|--------|----------|
| 1.1 | i18n namespace reduction | 🔴 High | Medium | **P0** |
| 1.2 | Firebase lazy init | 🔴 High | Medium | **P0** |
| 1.4 | Critical CSS inline | 🟡 Medium | Low | **P1** |
| 2.1 | Enhanced code splitting | 🟡 Medium | Medium | **P1** |
| 3.1 | Fix forced reflows | 🟡 Medium | High | **P2** |
| 4.2 | GTM defer | 🟢 Low | Low | **P2** |
| 1.3 | MUI icons audit | 🟢 Low | Low | **P3** |

---

## 🔧 Quick Wins (Implement First)

### 1. Reduce i18n Preload (30 min)
```javascript
// src/i18n/config.js
ns: ['common', 'pages'],  // Down from 18 namespaces
```

### 2. Add Resource Hints (15 min)
```html
<!-- index.html - Add before </head> -->
<link rel="preload" href="/assets/index-B45DuEr_.js" as="script" crossorigin>
<link rel="dns-prefetch" href="https://ep1.adtrafficquality.google">
```

### 3. Defer Flag Icons (Already Done ✅)
```javascript
// src/app/clientEffects.js - Already deferred via scheduleNonCriticalAssets
```

---

## 📈 Expected Results

| Phase | Estimated Score Improvement |
|-------|----------------------------|
| Phase 1 | +25 points (38 → 63) |
| Phase 2 | +15 points (63 → 78) |
| Phase 3 | +10 points (78 → 88) |
| Phase 4 | +5 points (88 → 93) |

**Target Score:** 85+ (Good performance rating)

---

## 🧪 Testing Checklist

After each optimization:
1. [ ] Run Lighthouse audit (mobile, Slow 4G throttling)
2. [ ] Verify FCP < 1.8s
3. [ ] Verify LCP < 2.5s
4. [ ] Verify TBT < 200ms
5. [ ] Test on real mobile device
6. [ ] Verify no regressions in functionality
7. [ ] Check bundle size with `npm run build`

---

## 📚 References

- [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [i18next Lazy Loading](https://www.i18next.com/overview/plugins-and-utils#backends)

---

**Last Updated:** January 29, 2026  
**Next Review:** After Phase 1 implementation

---

## 🛠️ Detailed Implementation Guide

### IMMEDIATE ACTION: i18n Namespace Reduction

**File:** `src/i18n/config.js`

#### Current Configuration (18 namespaces - CAUSING 1,886ms DELAY):
```javascript
ns: ['common', 'pages', 'filter', 'calendar', 'settings', 'contact', 'admin', 
     'actions', 'dialogs', 'form', 'validation', 'states', 'tooltips', 'a11y', 
     'auth', 'events', 'reminders', 'sessions']
```

#### Recommended Configuration (Route-Aware Loading):

**Landing Page (`/`):** common, pages
**Clock Page (`/clock`):** common, filter, events, sessions, tooltips  
**Calendar Page (`/calendar`):** common, filter, calendar, events, reminders
**Settings Drawer:** settings, a11y (load on drawer open)
**Auth Modals:** auth, validation (load on modal open)

**Phase 1 Quick Fix:**
```javascript
ns: ['common', 'pages'],  // Minimal preload
```

**Phase 2 Route-Aware Loading:**
```javascript
// In components, use lazy namespace loading:
const { t, i18n } = useTranslation('common');

useEffect(() => {
  // Load namespaces needed for this component
  i18n.loadNamespaces(['filter', 'events']).catch(console.error);
}, [i18n]);
```

---

### GTAG/Analytics Deferral

**Current Issue:** Google Tag Manager loads 131.8 KiB immediately

**Add to `index.html` (replace current gtag script):**
```html
<script>
  // Defer GTM until interaction or idle (saves 131.8 KiB from critical path)
  window.deferredGtag = function() {
    dataLayer.push(arguments);
  };
  window.dataLayer = window.dataLayer || [];
  
  const loadGTM = () => {
    if (window.__gtmLoaded) return;
    window.__gtmLoaded = true;
    
    // Now gtag points to real implementation
    window.gtag = function() { dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-LW2262GH6M');
    
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?l=dataLayer&id=G-LW2262GH6M';
    document.head.appendChild(s);
  };
  
  // Load after first interaction or 3s timeout
  ['click', 'scroll', 'keydown'].forEach(e => 
    window.addEventListener(e, loadGTM, { once: true, passive: true })
  );
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGTM, { timeout: 3000 });
  } else {
    setTimeout(loadGTM, 3000);
  }
</script>
```

---

### Firebase Lazy Loading Pattern

**File:** `src/firebase.js`

**Current (Eager):**
```javascript
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**Recommended (Lazy with Memoization):**
```javascript
import { initializeApp } from 'firebase/app';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);

// Lazy auth getter
let _auth = null;
export const getAuthInstance = async () => {
  if (!_auth) {
    const { getAuth } = await import('firebase/auth');
    _auth = getAuth(app);
  }
  return _auth;
};

// Lazy Firestore getter
let _db = null;
export const getDbInstance = async () => {
  if (!_db) {
    const { getFirestore } = await import('firebase/firestore');
    _db = getFirestore(app);
  }
  return _db;
};

// For backwards compatibility (deprecate gradually)
export { app };
```

**Update AuthContext to use lazy getter:**
```javascript
// In AuthContext.jsx
useEffect(() => {
  let unsubscribe;
  
  const setupAuth = async () => {
    const auth = await getAuthInstance();
    unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  };
  
  setupAuth();
  
  return () => unsubscribe?.();
}, []);
```

---

### Forced Reflow Hotspots

Based on grep search, the following patterns cause forced reflow:

| File | Line | Pattern | Fix Priority |
|------|------|---------|--------------|
| `App.jsx` | 497, 528 | `getBoundingClientRect()` in render | 🔴 HIGH |
| `LandingPage.jsx` | 323, 357 | `clientHeight` + `getBoundingClientRect()` | 🔴 HIGH |
| `ClockCanvas.jsx` | 247, 358, 380, 424 | Canvas mouse events | 🟡 MEDIUM |
| `CalendarEmbed.jsx` | 1733, 1787-88 | Layout measurements | 🟡 MEDIUM |
| `EventsTimeline2.jsx` | 2111, 2124, 2260-61 | Scroll calculations | 🟢 LOW |

**Fix Pattern (App.jsx example):**
```javascript
// BEFORE (causes layout thrashing):
const viewportHeight = appContainerRef.current?.getBoundingClientRect().height;

// AFTER (use cached value or ResizeObserver):
const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    setViewportSize({ width, height });
  });
  
  if (appContainerRef.current) {
    observer.observe(appContainerRef.current);
  }
  
  return () => observer.disconnect();
}, []);

// Now use viewportSize.height instead of getBoundingClientRect()
```

---

### Critical CSS Inline Strategy

**Add to `index.html` `<head>` before other stylesheets:**
```html
<style id="critical-css">
  /* Critical above-the-fold styles */
  *,*::before,*::after{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;font-family:'Poppins',system-ui,-apple-system,sans-serif;line-height:1.5;background:#F9F9F9;-webkit-font-smoothing:antialiased}
  [data-theme="dark"] body{background:#121212}
  #root{min-height:100vh;display:flex;flex-direction:column}
  
  /* Loading skeleton */
  .t2t-loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:inherit}
  .t2t-loading-spinner{width:40px;height:40px;border:3px solid rgba(0,0,0,.1);border-top-color:#0f6fec;border-radius:50%;animation:spin 1s linear infinite}
  [data-theme="dark"] .t2t-loading-spinner{border-color:rgba(255,255,255,.1);border-top-color:#0f6fec}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
```

**Then convert main CSS to non-blocking:**
```html
<link rel="preload" href="/assets/index-DRyAXKJU.css" as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/index-DRyAXKJU.css"></noscript>
```

---

## 📊 Bundle Size Analysis (Current)

| Chunk | Size | Category | Optimization |
|-------|------|----------|--------------|
| `index-B45DuEr_.js` | 154.7 KiB | Main bundle | Split further |
| `firebase-firestore` | 92.3 KiB | Firebase | Lazy load |
| `firebase-core` | 45.3 KiB | Firebase | Keep (needed for init) |
| `mui-icons` | 43.8 KiB | UI | Tree-shake audit |
| `PublicLayout` | 25.6 KiB | Layout | Keep |
| 18 i18n JSON files | ~30 KiB total | i18n | Reduce preload |
| Google Ads | 230.4 KiB | 3rd party | Already deferred ✅ |
| Google Tag Manager | 131.8 KiB | 3rd party | Defer ⚠️ |

**Target:** Reduce main bundle critical path to < 100 KiB

---

## ✅ Implementation Checklist

### Phase 1 (Do First - Est. 2 hours)
- [ ] Reduce i18n preload to `['common', 'pages']` only
- [ ] Add deferred GTM loading script
- [ ] Add critical CSS inline to index.html
- [ ] Test on Lighthouse (mobile, Slow 4G)

### Phase 2 (After Phase 1 validated - Est. 4 hours)
- [ ] Implement Firebase lazy loading
- [ ] Add route-aware namespace loading
- [ ] Update Vite manualChunks for better splitting
- [ ] Add resource hints (preload, prefetch)

### Phase 3 (Performance polish - Est. 3 hours)
- [ ] Fix forced reflows in App.jsx
- [ ] Fix forced reflows in LandingPage.jsx
- [ ] Audit MUI icon imports
- [ ] Add route prefetching

### Validation After Each Phase
- [ ] Lighthouse score improved
- [ ] No console errors
- [ ] All features still work
- [ ] Bundle size decreased
