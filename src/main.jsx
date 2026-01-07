/**
 * src/main.jsx
 * 
 * Purpose: Application entry point for Time 2 Trade SPA.
 * Bootstraps React with providers and routing.
 * 
 * Changelog:
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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import theme from './theme';
import './index.css';
import AppRoutes from './routes/AppRoutes';
import { setupViewportCssVars, scheduleNonCriticalAssets } from './app/clientEffects';
import { registerServiceWorker } from './registerServiceWorker';

// Remove SEO fallback immediately (before React renders)
const seoFallback = document.getElementById('seo-fallback');
if (seoFallback) {
  seoFallback.remove();
}

// Setup viewport CSS variables for mobile browser chrome
setupViewportCssVars();

// Load non-critical assets (flag-icons CSS, service worker) when idle
scheduleNonCriticalAssets(registerServiceWorker);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <SettingsProvider>
              <AppRoutes />
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

