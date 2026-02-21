/**
 * src/services/pushNotificationsService.js
 * 
 * Purpose: Firebase Cloud Messaging helpers for web/PWA push tokens.
 * Key responsibility and main functionality: Request notification permission, register
 * the service worker, obtain/store FCM tokens, and manage device notification preferences.
 * 
 * BEP Pattern (like WhatsApp/TradingView):
 * - Device tokens are PERSISTENT (not deleted when disabled)
 * - Each device has `enabled: true/false` to control notifications
 * - "Disable" toggles enabled=false, "Remove" deletes the token entirely
 * - Auto-register on load updates lastSeenAt but respects enabled flag
 * 
 * Changelog:
 * v2.0.0 - 2026-02-19 - BEP FIX: Call deleteToken() before getToken() in requestFcmTokenForUser.
 *                       After server-side token pruning (registration-token-not-registered FCM
 *                       response), the browser's push subscription may be in a stale/inconsistent
 *                       state. deleteToken() clears the cached FCM subscription from IndexedDB,
 *                       forcing getToken() to create a fresh push subscription. Fixes "Failed to
 *                       enable notifications" error after tokens are auto-pruned by the scheduler.
 * v1.9.0 - 2026-02-19 - BEP FIX: Replace getServiceWorkerRegistration() polling loop with
 *                       navigator.serviceWorker.ready as primary strategy. Old approach using
 *                       getRegistration() + manual retries failed when SW was in waiting/installing
 *                       state on Chrome Desktop — navigator.serviceWorker.ready is the canonical
 *                       Web API that handles all SW lifecycle states correctly.
 * v1.8.2 - 2026-02-10 - CRITICAL PROD FIX: Coerce errCode/errName to String() before calling
 *                       .includes(). err.code can be a number (e.g. 20) and Number.prototype
 *                       has no .includes(), causing "f.includes is not a function" in production.
 * v1.8.1 - 2026-02-10 - CRITICAL PROD FIX: Improved FCM transient error handling. Error code 20 and
 *                       other temporary Firebase issues (AbortError, registration-failed) now log at
 *                       debug level instead of warning/error. Prevents console spam from temporary
 *                       network/quota issues while still capturing real errors. Status: fcm-temp.
 * v1.8.0 - 2026-02-10 - CRITICAL PROD FIX: Handle FCM public key retrieval failures gracefully.
 *                       AbortError: "Registration failed - could not retrieve the public key"
 *                       now returns status='fcm-abort' instead of throwing unhandled error.
 *                       Prevents app crash when FCM service is temporarily unavailable.
 * v1.7.0 - 2026-02-03 - BEP: Use enabled flag pattern instead of deleting tokens.
 *                       Added setDeviceEnabled(), renamed unregister to removeDevice.
 *                       Auto-register respects existing enabled=false state.
 * v1.6.0 - 2026-02-03 - BEP: Add multi-device management with getAllDeviceTokens(), 
 *                       updateDeviceName(), unregisterDeviceByToken(), and getCurrentDeviceToken().
 *                       Generate friendly device names from user agent.
 * v1.5.0 - 2026-02-03 - BEP: Add checkDeviceToken() to check if current device has registered token.
 *                       Improved unregisterFcmTokenForUser() to return status object.
 * v1.4.0 - 2026-02-03 - BEP FIX: Improve mobile PWA token registration reliability.
 *                       - Increased service worker ready timeout to 5000ms for slower mobile connections
 *                       - Added retry logic for service worker registration
 *                       - Enhanced error logging with device info for debugging
 *                       - Store platform info (mobile/desktop, browser) with token
 * v1.3.0 - 2026-02-03 - BEP: Add refreshFcmTokenForUser() for token refresh on app load.
 *                       Tokens are always re-fetched and lastSeenAt is updated to keep tokens fresh.
 *                       FCM tokens don't expire but can be rotated by Firebase - this ensures we always
 *                       have the latest token and can track device activity for stale token cleanup.
 * v1.2.0 - 2026-02-03 - Remove temporary debug logs added for FCM token flow tracing.
 * v1.1.0 - 2026-01-23 - Add detailed token request statuses and resilient service worker readiness.
 * v1.0.0 - 2026-01-23 - Initial FCM token registration and persistence helpers.
 */

import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging';
import { db } from '../firebase';
import { collection, deleteDoc, doc, serverTimestamp, setDoc, getDocs, updateDoc, getDoc } from 'firebase/firestore';

const TOKENS_COLLECTION = 'deviceTokens';

/**
 * BEP: Generate a friendly device name from user agent
 * @param {string} userAgent - Browser user agent string
 * @returns {string} - Human-readable device name
 */
export const generateDeviceName = (userAgent = '') => {
  if (!userAgent) return 'Unknown Device';

  const ua = userAgent.toLowerCase();
  let device = '';
  let browser = '';

  // Detect device/OS
  if (ua.includes('iphone')) device = 'iPhone';
  else if (ua.includes('ipad')) device = 'iPad';
  else if (ua.includes('macintosh') || ua.includes('mac os')) device = 'Mac';
  else if (ua.includes('android')) {
    // Try to extract Android device model
    const match = userAgent.match(/;\s*([^;)]+)\s*Build\//i);
    if (match && match[1]) {
      device = match[1].trim();
      // Clean up common prefixes
      device = device.replace(/^(SM-|SAMSUNG|Pixel|OnePlus|Xiaomi|Redmi|POCO|Realme|OPPO|vivo)/i, '$1');
    } else {
      device = 'Android';
    }
  } else if (ua.includes('windows')) device = 'Windows';
  else if (ua.includes('linux')) device = 'Linux';
  else if (ua.includes('cros')) device = 'Chromebook';
  else device = 'Desktop';

  // Detect browser
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';
  else browser = 'Browser';

  return `${device} ${browser}`.trim();
};

/**
 * BEP: Detect platform info for token tracking
 */
const getPlatformInfo = () => {
  if (typeof navigator === 'undefined') return { platform: 'unknown', userAgent: '' };
  
  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches 
    || window.navigator?.standalone === true;
  const isPWA = isStandalone;
  
  return {
    platform: isMobile ? (isPWA ? 'mobile-pwa' : 'mobile-web') : (isPWA ? 'desktop-pwa' : 'desktop-web'),
    userAgent: ua.slice(0, 200), // Truncate for storage
    isMobile,
    isPWA,
  };
};

const isBrowserSupported = async () => {
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

const getServiceWorkerRegistration = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  // PRIMARY STRATEGY: navigator.serviceWorker.ready is the canonical Web API for this.
  // Resolves immediately when a SW is active+controlling, or waits until one activates.
  // More reliable than getRegistration() + polling — handles waiting/installing states correctly.
  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 10000)),
    ]);
    if (registration?.active) return registration;
  } catch {
    // Fall through to explicit registration attempt
  }

  // FALLBACK: Explicitly register /sw.js (handles: fresh install, crashed SW, or race conditions).
  const isSecure = typeof window !== 'undefined'
    && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  if (!isSecure) return null;

  try {
    await navigator.serviceWorker.register('/sw.js');
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    ]).catch(() => null);
    return registration || null;
  } catch {
    return null;
  }
};

const getMessagingInstance = async () => {
  const supported = await isBrowserSupported();
  if (!supported) return null;
  try {
    return getMessaging();
  } catch {
    return null;
  }
};

export const requestPushPermission = async () => {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
};

export const requestFcmTokenForUser = async (userId) => {
  const platformInfo = getPlatformInfo();

  if (!userId) return { token: null, status: 'auth-required' };
  if (typeof Notification === 'undefined') {
    console.warn('[pushNotificationsService] Notification API not available');
    return { token: null, status: 'unsupported' };
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    return { token: null, status: permission === 'default' ? 'permission-default' : permission };
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('[pushNotificationsService] Messaging instance not available');
    return { token: null, status: 'unsupported' };
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return { token: null, status: 'service-worker' };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error('[pushNotificationsService] VAPID key missing');
    return { token: null, status: 'missing-vapid' };
  }

  try {
    // BEP v2.0.0: Clear any stale FCM push subscription before requesting a fresh token.
    // After server-side pruning (registration-token-not-registered), the browser's push
    // subscription in IndexedDB may be inconsistent — deleteToken() forces a clean slate.
    try {
      await deleteToken(messaging);
    } catch {
      // No existing token to delete — safe to ignore, proceed with fresh getToken()
    }

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) {
      console.warn('[pushNotificationsService] getToken returned null');
      return { token: null, status: 'token-missing' };
    }

    const tokenRef = doc(collection(db, 'users', userId, TOKENS_COLLECTION), token);
    
    // BEP: Check if device already exists to preserve enabled flag
    const existingDoc = await getDoc(tokenRef);
    const isNewDevice = !existingDoc.exists();
    
    // Only set enabled=true for NEW devices, preserve existing enabled state
    const updateData = {
      token,
      platform: 'web',
      isMobile: platformInfo.isMobile,
      isPWA: platformInfo.isPWA,
      userAgent: platformInfo.userAgent?.slice(0, 200),
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    };
    
    if (isNewDevice) {
      // New device: set enabled=true and createdAt
      updateData.enabled = true;
      updateData.createdAt = serverTimestamp();
      updateData.name = generateDeviceName(platformInfo.userAgent);
    }
    
    await setDoc(tokenRef, updateData, { merge: true });

    return { token, status: 'granted', isNewDevice };
  } catch (err) {
    // BEP v1.8.2: Handle FCM public key retrieval failures gracefully
    // AbortError: "Registration failed - could not retrieve the public key"
    // Error code 20: Transient Firebase error (network, quota, or temp service issue)
    // These can happen due to network issues, service worker context issues, or temporary Firebase problems
    const errCode = String(err?.code || err?.message || 'unknown');
    const errName = String(err?.name || '');
    
    // Transient errors that should be logged as debug, not warning/error
    const transientErrors = ['20', 'AbortError', 'registration-failed', 'service-unavailable'];
    const isTransient = transientErrors.some(e => 
      errCode.includes(e) || errName.includes(e)
    );
    
    if (isTransient) {
      // Don't spam console with transient FCM errors - just debug level
      console.debug('[pushNotificationsService] FCM temporary unavailable:', errCode);
      return { token: null, status: 'fcm-temp' };
    }
    
    // Real errors - log as error
    console.error('[pushNotificationsService] FCM token error:', err);
    return { token: null, status: 'token-error' };
  }
};

export const registerFcmTokenForUser = async (userId) => {
  const result = await requestFcmTokenForUser(userId);
  return result?.token || null;
};

/**
 * BEP: Refresh FCM token on app load.
 * Always re-fetches the token and updates lastSeenAt timestamp.
 * This ensures:
 * 1. If Firebase rotated the token, we get the new one
 * 2. lastSeenAt is updated for stale device detection
 * 3. Token document is created if it doesn't exist (e.g., new device)
 * 
 * Unlike registerFcmTokenForUser, this is meant for silent background refresh
 * when the user already has push permission granted.
 * 
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<{token: string|null, status: string, refreshed: boolean}>}
 */
export const refreshFcmTokenForUser = async (userId) => {
  const platformInfo = getPlatformInfo();

  if (!userId) return { token: null, status: 'auth-required', refreshed: false };
  if (typeof Notification === 'undefined') {
    console.warn('[pushNotificationsService] Notification API not available (refresh)');
    return { token: null, status: 'unsupported', refreshed: false };
  }

  // Only refresh if permission already granted - don't prompt
  if (Notification.permission !== 'granted') {
    return { token: null, status: 'permission-not-granted', refreshed: false };
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('[pushNotificationsService] Messaging instance not available (refresh)');
    return { token: null, status: 'unsupported', refreshed: false };
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    console.warn('[pushNotificationsService] Service worker registration failed (refresh)');
    return { token: null, status: 'service-worker', refreshed: false };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error('[pushNotificationsService] VAPID key missing (refresh)');
    return { token: null, status: 'missing-vapid', refreshed: false };
  }

  try {
    // Always fetch fresh token - FCM may have rotated it
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) {
      console.warn('[pushNotificationsService] getToken returned null (refresh)');
      return { token: null, status: 'token-missing', refreshed: false };
    }

    // Update token document with fresh lastSeenAt and platform info
    const tokenRef = doc(collection(db, 'users', userId, TOKENS_COLLECTION), token);
    await setDoc(tokenRef, {
      token,
      platform: 'web',
      isMobile: platformInfo.isMobile,
      isPWA: platformInfo.isPWA,
      userAgent: platformInfo.userAgent?.slice(0, 200),
      enabled: true,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { token, status: 'refreshed', refreshed: true };
  } catch (err) {
    // BEP v1.8.2: Handle FCM public key retrieval failures gracefully
    // AbortError: "Registration failed - could not retrieve the public key"
    // Error code 20: Transient Firebase error (network, quota, or temp service issue)
    // These can happen due to network issues, service worker context issues, or temporary Firebase problems
    // Silently fail and let the app continue - no need to crash on token refresh
    const errCode = String(err?.code || err?.message || 'unknown');
    const errName = String(err?.name || '');
    
    // Transient errors that should be logged as debug, not warning/error
    const transientErrors = ['20', 'AbortError', 'registration-failed', 'service-unavailable'];
    const isTransient = transientErrors.some(e => 
      errCode.includes(e) || errName.includes(e)
    );
    
    if (isTransient) {
      // Don't spam console with transient FCM errors - just debug level
      console.debug('[pushNotificationsService] FCM temporary unavailable (will retry):', errCode);
      return { token: null, status: 'fcm-temp', refreshed: false };
    }
    
    // Real errors - log as warning
    console.error('[pushNotificationsService] FCM token refresh error:', err);
    return { token: null, status: 'token-error', refreshed: false };
  }
};

export const unregisterFcmTokenForUser = async (userId) => {
  if (!userId) return { success: false, error: 'auth-required' };
  const messaging = await getMessagingInstance();
  if (!messaging) return { success: false, error: 'unsupported' };

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return { success: false, error: 'service-worker' };

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { success: false, error: 'no-token' };
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    await deleteDoc(tokenRef);
    return { success: true, token };
  } catch (err) {
    console.error('[pushNotificationsService] Unregister error:', err);
    return { success: false, error: 'unregister-error' };
  }
};

/**
 * BEP: Check if the current device has a registered FCM token.
 * Used by NotificationPreferencesPanel to determine device registration status.
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<{hasToken: boolean, token: string|null, status: string}>}
 */
export const checkDeviceToken = async (userId) => {
  if (!userId) return { hasToken: false, token: null, status: 'auth-required' };
  if (typeof Notification === 'undefined') return { hasToken: false, token: null, status: 'unsupported' };
  if (Notification.permission !== 'granted') return { hasToken: false, token: null, status: 'permission-not-granted' };

  const messaging = await getMessagingInstance();
  if (!messaging) return { hasToken: false, token: null, status: 'unsupported' };

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return { hasToken: false, token: null, status: 'service-worker' };

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) return { hasToken: false, token: null, status: 'no-token' };

    // Check if this token exists in Firestore
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    const tokenDoc = await getDoc(tokenRef);

    return {
      hasToken: tokenDoc.exists(),
      token: tokenDoc.exists() ? token : null,
      status: tokenDoc.exists() ? 'registered' : 'not-registered',
    };
  } catch (err) {
    console.error('[pushNotificationsService] Check device token error:', err);
    return { hasToken: false, token: null, status: 'error' };
  }
};

/**
 * BEP: Get current device's FCM token (without registering).
 * @returns {Promise<string|null>} - The current device's token or null
 */
export const getCurrentDeviceToken = async () => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;

    return await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch {
    return null;
  }
};

/**
 * BEP: Get all registered device tokens for a user.
 * Returns array of device objects with token, name, platform, lastSeenAt, etc.
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<{devices: Array, currentToken: string|null, error: string|null}>}
 */
export const getAllDeviceTokens = async (userId) => {
  if (!userId) return { devices: [], currentToken: null, error: 'auth-required' };

  try {
    const tokensRef = collection(db, 'users', userId, TOKENS_COLLECTION);
    const snapshot = await getDocs(tokensRef);
    
    const devices = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        token: docSnap.id,
        name: data.name || generateDeviceName(data.userAgent),
        userAgent: data.userAgent || '',
        platform: data.platform || 'web',
        isMobile: data.isMobile || false,
        isPWA: data.isPWA || false,
        enabled: data.enabled !== false,
        createdAt: data.createdAt?.toDate?.() || null,
        lastSeenAt: data.lastSeenAt?.toDate?.() || data.updatedAt?.toDate?.() || null,
      };
    });

    // Sort by lastSeenAt descending (most recent first)
    devices.sort((a, b) => {
      if (!a.lastSeenAt && !b.lastSeenAt) return 0;
      if (!a.lastSeenAt) return 1;
      if (!b.lastSeenAt) return -1;
      return b.lastSeenAt - a.lastSeenAt;
    });

    // Get current device token for highlighting
    const currentToken = await getCurrentDeviceToken();

    return { devices, currentToken, error: null };
  } catch (err) {
    console.error('[pushNotificationsService] getAllDeviceTokens error:', err);
    return { devices: [], currentToken: null, error: 'fetch-error' };
  }
};

/**
 * BEP: Update a device's custom name.
 * @param {string} userId - The authenticated user's UID
 * @param {string} token - The device token to update
 * @param {string} name - The new custom name
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateDeviceName = async (userId, token, name) => {
  if (!userId || !token) return { success: false, error: 'invalid-params' };

  try {
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    await updateDoc(tokenRef, {
      name: name.trim(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (err) {
    console.error('[pushNotificationsService] updateDeviceName error:', err);
    return { success: false, error: 'update-error' };
  }
};

/**
 * BEP: Toggle device enabled status (like WhatsApp/TradingView).
 * Does NOT delete the token - just sets enabled flag.
 * @param {string} userId - The authenticated user's UID
 * @param {string} token - The device token to toggle
 * @param {boolean} enabled - Whether notifications should be enabled
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const setDeviceEnabled = async (userId, token, enabled) => {
  if (!userId || !token) return { success: false, error: 'invalid-params' };

  try {
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    await updateDoc(tokenRef, {
      enabled: Boolean(enabled),
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (err) {
    console.error('[pushNotificationsService] setDeviceEnabled error:', err);
    return { success: false, error: 'update-error' };
  }
};

/**
 * BEP: Permanently remove a device (deletes token from Firestore).
 * Use this only when user explicitly wants to remove a device entirely.
 * For toggling notifications on/off, use setDeviceEnabled() instead.
 * @param {string} userId - The authenticated user's UID
 * @param {string} token - The device token to remove
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const removeDevice = async (userId, token) => {
  if (!userId || !token) return { success: false, error: 'invalid-params' };

  try {
    const tokenRef = doc(db, 'users', userId, TOKENS_COLLECTION, token);
    await deleteDoc(tokenRef);
    return { success: true, error: null };
  } catch (err) {
    console.error('[pushNotificationsService] removeDevice error:', err);
    return { success: false, error: 'remove-error' };
  }
};

// Legacy alias for backward compatibility
export const unregisterDeviceByToken = removeDevice;

/**
 * BEP: Get user's notification preferences (quiet hours settings)
 * @param {string} userId - The authenticated user's UID
 * @returns {Promise<{quietHours: {enabled: boolean, start: number, end: number}}>}
 */
export const getNotificationPreferences = async (userId) => {
  if (!userId) return { quietHours: { enabled: true, start: 21, end: 6 } };

  try {
    const prefsRef = doc(db, 'users', userId, 'preferences', 'notifications');
    const snapshot = await getDoc(prefsRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        quietHours: {
          enabled: data.quietHoursEnabled ?? true,
          start: data.quietHoursStart ?? 21,
          end: data.quietHoursEnd ?? 6,
        },
      };
    }

    // Return defaults if no preferences exist
    return { quietHours: { enabled: true, start: 21, end: 6 } };
  } catch (err) {
    console.error('[pushNotificationsService] getNotificationPreferences error:', err);
    return { quietHours: { enabled: true, start: 21, end: 6 } };
  }
};

/**
 * BEP: Save user's notification preferences (quiet hours settings)
 * @param {string} userId - The authenticated user's UID
 * @param {Object} prefs - Preferences object
 * @param {boolean} prefs.quietHoursEnabled - Whether quiet hours are enabled
 * @param {number} prefs.quietHoursStart - Start hour (0-23)
 * @param {number} prefs.quietHoursEnd - End hour (0-23)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const saveNotificationPreferences = async (userId, prefs) => {
  if (!userId) return { success: false, error: 'no-user' };

  try {
    const prefsRef = doc(db, 'users', userId, 'preferences', 'notifications');
    await setDoc(prefsRef, {
      quietHoursEnabled: prefs.quietHoursEnabled ?? true,
      quietHoursStart: prefs.quietHoursStart ?? 21,
      quietHoursEnd: prefs.quietHoursEnd ?? 6,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true, error: null };
  } catch (err) {
    console.error('[pushNotificationsService] saveNotificationPreferences error:', err);
    return { success: false, error: 'save-error' };
  }
};

export const initFcmForegroundListener = async (onMessageReceived) => {
  const messaging = await getMessagingInstance();
  if (!messaging || !onMessageReceived) return () => {};
  return onMessage(messaging, (payload) => {
    onMessageReceived(payload);
  });
};
