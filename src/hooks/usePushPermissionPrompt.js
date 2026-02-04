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
 * - Browser: Needs Notification.permission, works when tab is open
 * - Push: Needs Notification.permission + FCM token, works even when app is closed
 * 
 * Both Browser and Push channels require the same browser permission, so we prompt
 * if either is enabled on any reminder AND permission hasn't been granted yet.
 * 
 * Changelog:
 * v1.1.0 - 2026-02-03 - BEP: Check for BOTH browser and push channels (not just push).
 *                       Both require Notification.permission. Renamed internal helpers.
 * v1.0.1 - 2026-02-03 - Fixed race condition with sessionStorage dismissal check.
 * v1.0.0 - 2026-02-03 - Initial implementation for mobile PWA push permission flow.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToReminders } from '../services/remindersService';
import { requestFcmTokenForUser, getAllDeviceTokens } from '../services/pushNotificationsService';

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
 * Check if running as installed PWA
 * @returns {boolean}
 */
const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
};

/**
 * Check if running on mobile device
 * @returns {boolean}
 */
const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if user has any enabled device tokens for push notifications
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
const hasEnabledDeviceToken = async (userId) => {
  try {
    const devices = await getAllDeviceTokens(userId);
    return devices.some((d) => d.enabled);
  } catch {
    return false;
  }
};

/**
 * Hook to manage notification permission prompting for users with browser/push reminders
 * @returns {Object} - { shouldShowModal, dismissModal, requestPermission, isRequesting }
 */
export const usePushPermissionPrompt = () => {
  const { user } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const checkTimeoutRef = useRef(null);

  // Check if we should show the permission prompt
  useEffect(() => {
    // Only run once per session
    if (hasChecked) return;
    if (!user?.uid) return;

    // Check if already dismissed this session (prevent race condition)
    try {
      if (sessionStorage.getItem('t2t_push_prompt_dismissed') === 'true') {
        setHasChecked(true);
        return;
      }
    } catch {
      // Ignore storage errors
    }

    // Only prompt on PWA or mobile web
    const shouldPrompt = isPWA() || isMobile();
    if (!shouldPrompt) {
      setHasChecked(true);
      return;
    }

    // Check notification permission status
    if (typeof Notification === 'undefined') {
      setHasChecked(true);
      return;
    }

    // Already granted - no need to prompt (but ensure device is registered for push)
    if (Notification.permission === 'granted') {
      // Auto-register this device for push if not already
      // This is handled by NotificationPreferencesPanel, so just skip prompt
      setHasChecked(true);
      return;
    }

    // Already denied - don't annoy the user
    if (Notification.permission === 'denied') {
      setHasChecked(true);
      return;
    }

    // Permission is 'default' - check if user has browser/push reminders
    // Add delay to let the app fully initialize and avoid blocking initial render
    checkTimeoutRef.current = setTimeout(() => {
      const unsubscribe = subscribeToReminders(
        user.uid,
        (reminders) => {
          if (hasPermissionRequiredReminders(reminders)) {
            setShouldShowModal(true);
          }
          setHasChecked(true);
          unsubscribe();
        },
        (error) => {
          console.warn('[useNotificationPermissionPrompt] Error checking reminders:', error);
          setHasChecked(true);
          unsubscribe();
        }
      );
    }, 3000); // Wait 3s after load to check

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [user?.uid, hasChecked]);

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
