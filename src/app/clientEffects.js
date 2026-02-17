/**
 * src/app/clientEffects.js
 * 
 * Purpose: Client-side helpers for the /app SPA entry. These utilities are
 * invoked inside effects to avoid touching window or document during SSR.
 * 
 * Changelog:
 * v1.1.0 - 2026-02-13 - BEP PERFORMANCE: Removed global flag-icons CSS from idle loader.
 *                       Flag-icons (~68KB) now loads on-demand via loadFlagIconsCSS() only on
 *                       routes that render country flags (/clock, /calendar, /app).
 *                       Saves 68KB transfer on landing page and other non-flag routes.
 * v1.0.0 - 2025-12-18 - Extracted viewport CSS vars and idle asset loader for SSR safety.
 */

export const updateVisualViewportCssVars = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const visualViewport = window.visualViewport;

  const heightPx = Math.round((visualViewport?.height ?? window.innerHeight) || 0);
  const offsetTopPx = Math.round(visualViewport?.offsetTop ?? 0);

  const insetBottomPx = visualViewport
    ? Math.max(0, Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop))
    : 0;

  root.style.setProperty('--t2t-vv-height', `${heightPx}px`);
  root.style.setProperty('--t2t-vv-offset-top', `${offsetTopPx}px`);
  root.style.setProperty('--t2t-vv-inset-bottom', `${insetBottomPx}px`);
};

export const setupViewportCssVars = () => {
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

/**
 * BEP PERFORMANCE v1.1.0 - 2026-02-13: Removed flag-icons from global idle load.
 * Flag-icons CSS (~68KB) is now loaded on-demand only on routes that need it
 * (/clock, /calendar, /app) via loadFlagIconsCSS(). Saves ~68KB on landing page
 * and other routes that don't display country flags.
 */
export const scheduleNonCriticalAssets = (onIdle) => {
  if (typeof window === 'undefined') return;

  const run = () => {
    if (typeof onIdle === 'function') {
      onIdle();
    }
  };

  const onReady = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 2000 });
    } else {
      window.setTimeout(run, 900);
    }
  };

  if (document.readyState === 'complete') {
    onReady();
    return;
  }

  window.addEventListener('load', onReady, { once: true, passive: true });
};

/**
 * BEP PERFORMANCE: Route-specific flag-icons CSS loader.
 * Call this from components/pages that render country flag icons
 * (e.g., ClockPage, CalendarPage, App/HomePage).
 * Idempotent — safe to call multiple times, CSS loads only once.
 */
let _flagIconsLoaded = false;
export const loadFlagIconsCSS = () => {
  if (_flagIconsLoaded) return;
  _flagIconsLoaded = true;
  import('flag-icons/css/flag-icons.min.css');
};
