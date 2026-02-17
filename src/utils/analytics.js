/**
 * src/utils/analytics.js
 * 
 * Purpose: Client-side Firebase Analytics helpers.
 * Safely initializes GA4 once and provides SPA-friendly page view logging utilities.
 * 
 * BEP PERFORMANCE: All Firebase imports are dynamic to avoid pulling firebase/analytics
 * and firebase/auth into the main bundle at parse time. Analytics SDK loads only when
 * first invoked (typically after first route change), saving ~50KB+ from critical path.
 * 
 * Changelog:
 * v1.1.0 - 2026-02-13 - BEP PERFORMANCE: Converted to fully dynamic imports.
 *                       Removes static firebase/analytics and firebase.js imports
 *                       that were adding ~50KB to the critical main bundle.
 * v1.0.0 - 2025-12-22 - Added guarded analytics initialization and page_view helper for SPA routes.
 */

let analyticsInstance = null;

export const initAnalytics = async () => {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { isSupported, getAnalytics } = await import('firebase/analytics');
    const supported = await isSupported();

    if (!supported) {
      return null;
    }

    const { app } = await import('../firebase');
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (err) {
    // Silently fail — analytics is non-critical
    return null;
  }
};

export const logPageView = async (pathname, title, search) => {
  const analytics = await initAnalytics();
  if (!analytics) return;

  try {
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, 'page_view', {
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: pathname,
      page_title: title || (typeof document !== 'undefined' ? document.title : undefined),
      page_search: search || (typeof window !== 'undefined' ? window.location.search : undefined) || undefined,
    });
  } catch (err) {
    // Silently fail — analytics is non-critical
  }
};

export const logAppEvent = async (eventName, params = {}) => {
  const analytics = await initAnalytics();
  if (!analytics) return;

  try {
    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, eventName, params);
  } catch (err) {
    // Silently fail — analytics is non-critical
  }
};
