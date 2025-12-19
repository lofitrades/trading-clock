/**
 * src/app/clientEffects.js
 * 
 * Purpose: Client-side helpers for the /app SPA entry. These utilities are
 * invoked inside effects to avoid touching window or document during SSR.
 * 
 * Changelog:
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

export const scheduleNonCriticalAssets = (onIdle) => {
  if (typeof window === 'undefined') return;

  const loadFlagIcons = () => import('flag-icons/css/flag-icons.min.css');
  const run = () => {
    loadFlagIcons();
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
