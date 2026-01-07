/**
 * src/utils/analytics.js
 * 
 * Purpose: Client-side Firebase Analytics helpers.
 * Safely initializes GA4 once and provides SPA-friendly page view logging utilities.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-22 - Added guarded analytics initialization and page_view helper for SPA routes.
 */

import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { auth } from '../firebase';

let analyticsInstance = null;

export const initAnalytics = async () => {
  if (analyticsInstance) return analyticsInstance;
  if (typeof window === 'undefined') return null;

  let supported = false;
  try {
    supported = await isSupported();
  } catch (err) {
    console.error('[Analytics] isSupported check failed:', err);
    return null;
  }

  if (!supported) {
    console.warn('[Analytics] Analytics not supported in this environment.');
    return null;
  }

  try {
    const app = auth.app;
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (err) {
    console.error('[Analytics] Initialization failed:', err);
    return null;
  }
};

export const logPageView = async (pathname, title, search) => {
  const analytics = await initAnalytics();
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_location: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: pathname,
      page_title: title || (typeof document !== 'undefined' ? document.title : undefined),
      page_search: search || (typeof window !== 'undefined' ? window.location.search : undefined) || undefined,
    });
  } catch (err) {
    console.error('[Analytics] logPageView failed:', err);
  }
};

export const logAppEvent = async (eventName, params = {}) => {
  const analytics = await initAnalytics();
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, params);
  } catch (err) {
    console.error('[Analytics] logEvent failed:', err);
  }
};
