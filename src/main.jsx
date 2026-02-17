/**
 * src/main.jsx
 * 
 * Purpose: Application entry point for Time 2 Trade SPA.
 * Bootstraps React with providers and routing. Includes ThemeContextProvider for dynamic theme switching.
 * 
 * Changelog:
 * v5.3.0 - 2026-02-10 - BEP: Added vite:preloadError handler for stale chunk auto-reload after deploys.
 *                       When a user has a cached page referencing old chunk hashes, the dynamic import
 *                       fails. This handler auto-reloads the page once to fetch fresh assets.
 * v5.2.0 - 2026-02-07 - BEP SEO ROUTING FIX: Added early language prefix stripping before React mounts. Detects /es/ or /fr/ URL prefix from shared links/bookmarks/crawl, persists language to localStorage, strips prefix via history.replaceState. Ensures React Router can match prefix-free routes (/clock, /blog/:slug). Without this, language-prefixed URLs would hit the 404 catch-all.
 * v5.1.0 - 2026-02-02 - BEP ANALYTICS: Integrated Facebook Pixel for conversion tracking. Initialized on app startup.
 * v5.0.1 - 2026-01-28 - BEP FIX: Cache root instance to prevent duplicate createRoot() calls during HMR.
 *                       Stores root on container element to reuse across hot reloads.
 * v5.0.0 - 2026-01-28 - BEP: Added ThemeContextProvider for light/dark mode support. 
 *                       Dynamic theme from getTheme() based on ThemeContext resolvedTheme.
 * v4.0.0 - 2026-01-24 - Added i18next integration for multilanguage support (EN, ES, FR MVP).
 * v3.0.3 - 2025-12-22 - Wrapped app with HelmetProvider for route-level SEO metadata.
 * v3.0.2 - 2025-12-18 - Added viewport CSS vars and flag-icons loading for proper initialization.
 * v3.0.1 - 2025-12-18 - Restored SPA entry after removing incomplete SSR implementation.
 * v3.0.0 - 2025-12-18 - Delegated bootstrap to src/app/AppBootstrap for SSR-safe reuse.
 * v2.0.0 - 2025-11-30 - Added React Router integration
 * v2.1.1 - 2025-12-17 - Defer service worker registration and flag icon CSS load to idle to trim main-thread work on first paint.
 * v2.1.0 - 2025-12-17 - Lazy-load AppRoutes to reduce initial bundle size and improve mobile FCP.
 * v2.0.2 - 2025-12-16 - Removed Router basename for root-level Firebase Hosting deployment.
 * v2.0.1 - 2025-12-16 - Added VisualViewport-based CSS vars to prevent fixed UI from sitting under mobile browser chrome.
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { TooltipProvider } from './contexts/TooltipContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { useThemeMode } from './contexts/themeContextUtils';
import { getTheme } from './theme';
import { initFacebookPixel } from './services/facebookPixelService';
import './index.css';
import './i18n/config.js';  // Initialize i18next BEFORE App
import i18n from './i18n/config.js';
import AppRoutes from './routes/AppRoutes';
import { setupViewportCssVars, scheduleNonCriticalAssets } from './app/clientEffects';
import { registerServiceWorker } from './registerServiceWorker';

// BEP v5.3.0: Handle stale chunk errors after deployments.
// When a new build is deployed, existing browser tabs still reference old chunk hashes.
// Vite fires 'vite:preloadError' when a dynamic import() fails to fetch.
// Auto-reload once to pick up fresh assets. Guard prevents infinite reload loops.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 't2t_chunk_reload';
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
  }
});

// BEP SEO: Detect language from URL prefix and normalize for SPA routing.
// Firebase serves pre-rendered HTML at /es/clock, /fr/about etc. for crawlers.
// LanguageContext reads language from localStorage (set here on first visit).
// React Router only has prefix-free routes (/clock, /calendar, /blog/:slug).
// Strip the prefix via replaceState so React Router can match routes correctly.
// Without this, /es/clock would fall through to the 404 catch-all route.
(() => {
  const LANG_PREFIXES = ['es', 'fr'];
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  if (LANG_PREFIXES.includes(pathSegments[0])) {
    // Persist detected language before stripping prefix
    localStorage.setItem('preferredLanguage', pathSegments[0]);
    const strippedPath = '/' + pathSegments.slice(1).join('/') || '/';
    window.history.replaceState(null, '', strippedPath + window.location.search + window.location.hash);
  }
})();

// Remove SEO fallback immediately (before React renders)
const seoFallback = document.getElementById('seo-fallback');
if (seoFallback) {
  seoFallback.remove();
}

// Setup viewport CSS variables for mobile browser chrome
setupViewportCssVars();

// Initialize Facebook Pixel for conversion tracking
initFacebookPixel();

// Load non-critical assets (service worker) when idle\n// BEP PERFORMANCE v5.4.0: Flag-icons CSS removed from global idle load.\n// Now loaded on-demand only on routes with country flags (/clock, /calendar, /blog).
scheduleNonCriticalAssets(registerServiceWorker);

/**
 * Inner app component that uses ThemeContext
 * Separated to ensure ThemeContextProvider is in scope
 */
export function AppWithTheme() {
  const { resolvedTheme } = useThemeMode();
  const dynamicTheme = useMemo(() => getTheme(resolvedTheme), [resolvedTheme]);

  return (
    <ThemeProvider theme={dynamicTheme}>
      <AuthProvider>
        <SettingsProvider>
          <LanguageProvider>
            <TooltipProvider>
              <AppRoutes />
            </TooltipProvider>
          </LanguageProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// BEP: Cache root instance to prevent duplicate createRoot() calls during HMR
const container = document.getElementById('root');
let root = container._reactRoot;

if (!root) {
  root = createRoot(container);
  container._reactRoot = root;
}

root.render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeContextProvider>
            <AppWithTheme />
          </ThemeContextProvider>
        </BrowserRouter>
      </HelmetProvider>
    </I18nextProvider>
  </StrictMode>
);

