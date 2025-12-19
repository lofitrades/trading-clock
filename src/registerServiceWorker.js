/**
 * src/registerServiceWorker.js
 * 
 * Purpose: Register the public service worker to enable installability and basic offline caching in production builds.
 * Key responsibility and main functionality: Registers sw.js when supported, defers to load event, and silently ignores failures to avoid impacting UX.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-17 - Initial service worker registration helper.
 */

export function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
