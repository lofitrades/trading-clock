/**
 * src/services/facebookPixelService.js
 * 
 * Purpose: Facebook Pixel event tracking (custom events only)
 * The base pixel is loaded in index.html ONLY after user grants consent.
 * All tracking functions check hasAdConsent() before firing events.
 * 
 * BEP GDPR: This service is consent-gated. No events fire unless:
 * 1. User clicked "Allow all" on cookie banner
 * 2. Meta Pixel was loaded via t2tLoadMetaPixel()
 * 
 * Changelog:
 * v1.3.0 - 2026-02-03 - BEP FIX: Changed trackLogin to use trackCustom instead of track.
 *                       'Login' is a non-standard event per Meta Pixel docs.
 * v1.2.0 - 2026-02-02 - BEP GDPR COMPLIANCE: All tracking functions now check hasAdConsent()
 *                       before firing any events. Pixel only works after explicit consent.
 *                       Imported hasAdConsent from consent.js for centralized checks.
 * v1.1.0 - 2026-02-02 - BEP FIX: Removed duplicate initialization. Base pixel is in index.html.
 *                       This service now only handles custom events (no init, no PageView).
 * v1.0.0 - 2026-02-02 - Initial implementation with page view + conversion tracking
 */

import { hasAdConsent } from '../utils/consent';

/**
 * Check if pixel is available AND user has consented
 * BEP GDPR: Returns true only if both conditions are met
 * @returns {boolean}
 */
function canTrack() {
  if (!hasAdConsent()) {
    return false; // User has not consented
  }
  if (!window.fbq) {
    return false; // Pixel not loaded yet
  }
  return true;
}

/**
 * Initialize Facebook Pixel
 * NOTE: The base pixel is already initialized in index.html (consent-gated).
 * This function is now a no-op but kept for API compatibility.
 */
export function initFacebookPixel() {
  // Pixel is initialized in index.html - no action needed here
  if (window.fbq) {
    console.log('[Facebook Pixel] Ready (initialized via HTML)');
  } else if (!hasAdConsent()) {
    console.log('[Facebook Pixel] Waiting for consent');
  } else {
    console.warn('[Facebook Pixel] fbq not found - check index.html');
  }
}

/**
 * Track page view event
 * NOTE: Initial PageView is tracked automatically in index.html when consent granted.
 * Use this only for SPA route changes if needed.
 * @param {string} path - Route path (e.g., '/clock', '/calendar')
 */
export function trackPageView(path) {
  if (!canTrack()) {
    return; // No consent or pixel not ready
  }

  // Only track if path provided (for SPA navigation)
  if (path) {
    window.fbq('track', 'PageView', {
      page_path: path,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track user sign-up
 * Call when new user completes registration
 * @param {string} email - User email
 * @param {string} method - Auth method (email, google, etc.)
 */
export function trackSignUp(email, method = 'email') {
  if (!canTrack()) {
    console.log('[Facebook Pixel] Sign-up not tracked - no consent');
    return;
  }

  window.fbq('track', 'CompleteRegistration', {
    content_name: 'New User Sign Up',
    email: email,
    method: method,
    timestamp: new Date().toISOString(),
  });

  console.log('[Facebook Pixel] Tracked CompleteRegistration:', email);
}

/**
 * Track user login
 * Call when user signs in
 * BEP: Uses trackCustom because 'Login' is a non-standard event
 * @param {string} email - User email
 * @param {string} method - Auth method (email, google, etc.)
 */
export function trackLogin(email, method = 'email') {
  if (!canTrack()) {
    console.log('[Facebook Pixel] Login not tracked - no consent');
    return;
  }

  // BEP: 'Login' is a custom event - must use trackCustom, not track
  // See: https://developers.facebook.com/docs/ads-for-websites/pixel-events/#events
  window.fbq('trackCustom', 'Login', {
    email: email,
    method: method,
    timestamp: new Date().toISOString(),
  });

  console.log('[Facebook Pixel] Tracked Login:', email);
}

/**
 * Track auth modal view
 * Call when user opens AuthModal
 */
export function trackAuthModalView() {
  if (!canTrack()) {
    return; // Silent - modal opens frequently
  }

  window.fbq('track', 'Lead', {
    content_name: 'Auth Modal Opened',
    content_category: 'engagement',
    timestamp: new Date().toISOString(),
  });

  console.log('[Facebook Pixel] Tracked Lead (Auth Modal)');
}

/**
 * Set user data for better tracking
 * Call when user is authenticated
 * @param {object} user - Firebase user object
 */
export function setUserData(user) {
  if (!canTrack()) {
    return; // No consent
  }

  if (user?.email) {
    window.fbq('setUserData', {
      em: user.email.toLowerCase(),
      external_id: user.uid,
    });

    console.log('[Facebook Pixel] Set user data for:', user.email);
  }
}

/**
 * Clear user data (on logout)
 */
export function clearUserData() {
  if (!window.fbq) {
    return;
  }

  window.fbq('clearUserData');
  console.log('[Facebook Pixel] Cleared user data');
}

/**
 * Track custom event
 * @param {string} eventName - Standard or custom event name
 * @param {object} eventData - Event parameters
 */
export function trackCustomEvent(eventName, eventData = {}) {
  if (!canTrack()) {
    console.log(`[Facebook Pixel] ${eventName} not tracked - no consent`);
    return;
  }

  window.fbq('track', eventName, {
    ...eventData,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Facebook Pixel] Tracked ${eventName}:`, eventData);
}
