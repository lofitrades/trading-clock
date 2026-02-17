/**
 * src/hooks/usePushPermissionPrompt.js
 * 
 * Purpose: BEP hook to prompt users for notification permission on app load.
 * Key responsibility: Detect when user has reminders with browser/push channels
 * but hasn't granted notification permission, show a friendly modal, and
 * request permission + register FCM token for push delivery.
 * 
 * BEP Notification Architecture:
 * - In-App: No permission needed, always works when app is open
 * - Browser: Needs Notification.permission, works when tab is open (non-PWA only)
 * - Push: Needs Notification.permission + FCM token, works even when app is closed (PWA only)
 * 
 * Both Browser and Push channels require the same browser permission, so we prompt
 * if either is enabled on any reminder AND permission hasn't been granted yet.
 * 
 * Universal: Prompts on ALL platforms (desktop, mobile, PWA) when conditions are met.
 * New user flow: Listens for t2t:welcome-complete event to prompt after WelcomeModal closes.
 * New device: Detected automatically — any device with permission='default' and active reminders.
 * 
 * Changelog:
 * v2.1.0 - 2026-02-13 - BEP PERFORMANCE: Dynamic import remindersService + pushNotificationsService.
 *                       Removes ~30-50KB from critical parse path — only loaded when needed.
 * v2.0.0 - 2026-02-09 - BEP UNIVERSAL: Removed mobile/PWA gate — prompts on all platforms
 *                       (desktop Chrome, mobile Safari, PWA, etc.). Added welcome-complete
 *                       event listener for post-signup flow (new users get default reminders,
 *                       then see permission prompt after dismissing WelcomeModal). New-device
 *                       detection is automatic (permission='default' + active reminders).
 * v1.1.0 - 2026-02-03 - BEP: Check for BOTH browser and push channels (not just push).
 *                       Both require Notification.permission. Renamed internal helpers.
 * v1.0.1 - 2026-02-03 - Fixed race condition with sessionStorage dismissal check.
 * v1.0.0 - 2026-02-03 - Initial implementation for mobile PWA push permission flow.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
// BEP PERFORMANCE v2.1.0: remindersService + pushNotificationsService dynamically imported.
// Only loaded when user is auth'd, permission is 'default', and conditions are met.

/**
 * Check if any reminder has browser OR push channel enabled
 * Both channels require Notification.permission to work
 * @param {Array} reminders - Array of reminder objects
 * @returns {boolean}
 */
const hasPermissionRequiredReminders = (reminders = []) => {
  return reminders.some((r) => {
    // Check channels at reminder level
    if (r.channels?.push || r.channels?.browser) return true;
    // Check individual reminder offsets
    if (Array.isArray(r.reminders)) {
      return r.reminders.some((offset) => offset?.channels?.push || offset?.channels?.browser);
    }
    return false;
  });
};

/**
 * Hook to manage notification permission prompting for users with browser/push reminders.
 * BEP v2.0.0: Universal — prompts on ALL platforms (desktop, mobile, PWA).
 * Also listens for t2t:welcome-complete event to trigger post-signup prompt.
 * @returns {Object} - { shouldShowModal, dismissModal, requestPermission, isRequesting }
 */
export const usePushPermissionPrompt = () => {
  const { user } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const checkTimeoutRef = useRef(null);

  /**
   * Core check: subscribe to reminders and show modal if conditions are met.
   * Extracted so both the initial check and the welcome-complete listener can call it.
   */
  const performCheck = useCallback(async (userId) => {
    if (!userId) return;

    // Already dismissed this session
    try {
      if (sessionStorage.getItem('t2t_push_prompt_dismissed') === 'true') return;
    } catch { /* Ignore */ }

    // Notification API not available
    if (typeof Notification === 'undefined') return;

    // Already granted or denied — don't prompt
    if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

    // BEP PERFORMANCE v2.1.0: Dynamic import — only loaded when conditions are met
    try {
      const { subscribeToReminders } = await import('../services/remindersService');
      // Permission is 'default' — check if user has browser/push reminders
      const unsubscribe = subscribeToReminders(
        userId,
        (reminders) => {
          if (hasPermissionRequiredReminders(reminders)) {
            setShouldShowModal(true);
          }
          setHasChecked(true);
          unsubscribe();
        },
        (error) => {
          console.warn('[usePushPermissionPrompt] Error checking reminders:', error);
          setHasChecked(true);
          unsubscribe();
        }
      );
    } catch (err) {
      console.warn('[usePushPermissionPrompt] Failed to load reminders service:', err);
      setHasChecked(true);
    }
  }, []);

  // Initial check on mount (after 3s delay to let app initialize)
  useEffect(() => {
    if (hasChecked) return;
    if (!user?.uid) return;

    // Check if already dismissed this session
    try {
      if (sessionStorage.getItem('t2t_push_prompt_dismissed') === 'true') {
        setHasChecked(true);
        return;
      }
    } catch { /* Ignore */ }

    // BEP v2.0.0: Universal — no mobile/PWA gate. All platforms are prompted.

    // Notification API checks
    if (typeof Notification === 'undefined') {
      setHasChecked(true);
      return;
    }

    if (Notification.permission === 'granted') {
      setHasChecked(true);
      return;
    }

    if (Notification.permission === 'denied') {
      setHasChecked(true);
      return;
    }

    // Delay to let app fully initialize and avoid blocking initial render
    checkTimeoutRef.current = setTimeout(() => {
      performCheck(user.uid);
    }, 3000);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user?.uid, hasChecked, performCheck]);

  // BEP v2.0.0: Listen for welcome-complete event to trigger post-signup prompt.
  // When a new user dismisses WelcomeModal, AuthContext dispatches t2t:welcome-complete.
  // This gives time for default custom events + reminders to be created in Firestore,
  // then we re-check for permission-requiring reminders and show the prompt.
  useEffect(() => {
    if (!user?.uid) return;

    const handleWelcomeComplete = () => {
      // Small delay to ensure Firestore writes for default custom events have settled
      setTimeout(() => {
        performCheck(user.uid);
      }, 2000);
    };

    window.addEventListener('t2t:welcome-complete', handleWelcomeComplete);
    return () => window.removeEventListener('t2t:welcome-complete', handleWelcomeComplete);
  }, [user?.uid, performCheck]);

  // Dismiss the modal
  const dismissModal = useCallback(() => {
    setShouldShowModal(false);
    // Store dismissal in session storage so we don't prompt again this session
    try {
      sessionStorage.setItem('t2t_push_prompt_dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Request permission and register token for push delivery
  const requestPermission = useCallback(async () => {
    if (!user?.uid) return { success: false, status: 'auth-required' };

    setIsRequesting(true);
    try {
      const { requestFcmTokenForUser } = await import('../services/pushNotificationsService');
      const result = await requestFcmTokenForUser(user.uid);

      if (result.status === 'granted') {
        setShouldShowModal(false);
        return { success: true, status: 'granted', token: result.token };
      }

      return { success: false, status: result.status };
    } catch (error) {
      console.error('[useNotificationPermissionPrompt] Error requesting permission:', error);
      return { success: false, status: 'error' };
    } finally {
      setIsRequesting(false);
    }
  }, [user?.uid]);

  return {
    shouldShowModal,
    dismissModal,
    requestPermission,
    isRequesting,
  };
};

export default usePushPermissionPrompt;
