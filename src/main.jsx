/**
 * src/main.jsx
 * 
 * Purpose: Application entry point with all providers and routing setup.
 * Configures theme, authentication, settings, and React Router.
 * 
 * Changelog:
 * v2.0.0 - 2025-11-30 - Added React Router integration
 * v2.0.1 - 2025-12-16 - Added VisualViewport-based CSS vars to prevent fixed UI from sitting under mobile browser chrome.
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import 'flag-icons/css/flag-icons.min.css';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import theme from './theme';

const updateVisualViewportCssVars = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const visualViewport = window.visualViewport;

  const heightPx = Math.round((visualViewport?.height ?? window.innerHeight) || 0);
  const offsetTopPx = Math.round(visualViewport?.offsetTop ?? 0);

  // When browser UI overlays the page (common on Android), the visual viewport is smaller than the layout viewport.
  // This inset helps keep bottom-fixed controls (e.g., Scroll to Next) above the bottom toolbar.
  const insetBottomPx = visualViewport
    ? Math.max(0, Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop))
    : 0;

  root.style.setProperty('--t2t-vv-height', `${heightPx}px`);
  root.style.setProperty('--t2t-vv-offset-top', `${offsetTopPx}px`);
  root.style.setProperty('--t2t-vv-inset-bottom', `${insetBottomPx}px`);
};

const setupViewportCssVars = () => {
  if (typeof window === 'undefined') return;

  let rafId = 0;
  const schedule = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      updateVisualViewportCssVars();
    });
  };

  updateVisualViewportCssVars();
  window.addEventListener('resize', schedule, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', schedule, { passive: true });
    window.visualViewport.addEventListener('scroll', schedule, { passive: true });
  }
};

setupViewportCssVars();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/trading-clock">
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
