/**
 * src/contexts/AuthContext.jsx
 * 
 * Purpose: Enhanced authentication context with user profile, roles, and subscription data.
 * Provides authentication state management with Firestore user profile integration.
 * Automatically creates user documents with role and subscription on account creation.
 * 
 * Changelog:
 * v2.5.0 - 2026-02-07 - BEP CRITICAL: Wired initFcmForegroundListener() to show push notifications
 *                       when the app is in the foreground. FCM's onMessage fires instead of SW's
 *                       onBackgroundMessage when the app is open — without this listener, foreground
 *                       pushes are silently dropped. Uses ServiceWorkerRegistration.showNotification()
 *                       with the same tag/options as the SW background handler for OS-level dedup.
 *                       Combined with v4.0.0 browser channel suppression (when push is enabled),
 *                       ensures exactly 1 push + 1 in-app notification regardless of app state.
 * v2.4.0 - 2026-02-03 - BEP FIX: Mobile PWA token refresh - add 2s delay before attempting
 *                       FCM token refresh on mobile PWAs to ensure service worker is ready.
 * v2.3.0 - 2026-02-03 - BEP: Use refreshFcmTokenForUser on every app load to keep tokens fresh.
 *                       Ensures FCM tokens are always up-to-date and lastSeenAt is tracked.
 * v2.2.0 - 2026-01-23 - Add FCM token registration on login when permission is granted.
 * v2.1.2 - 2026-01-15 - Resilience: provide a safe default context to prevent HMR/context mismatch crashes.
 * v2.1.1 - 2025-12-01 - Documentation: Clarified that selectedTimezone in default settings is for new user creation only, SettingsContext is source of truth
 * v2.1.0 - 2025-11-30 - Added automatic user profile creation with role & subscription documents
 * v2.0.0 - 2025-11-30 - Enhanced with user profile, roles, and subscription support
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { USER_ROLES, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, PLAN_FEATURES } from '../types/userTypes';
import WelcomeModal from '../components/WelcomeModal';
import { createUserProfileSafely, updateLastLoginSafely } from '../utils/userProfileUtils';
import { refreshFcmTokenForUser, initFcmForegroundListener } from '../services/pushNotificationsService';

const defaultAuthContext = {
  user: null,
  userProfile: null,
  loading: true,
  profileLoading: false,
  hasRole: () => false,
  hasPlan: () => false,
  hasFeature: () => false,
  isAdmin: () => false,
  isAuthenticated: () => false,
};

const AuthContext = createContext(defaultAuthContext);

/**
 * Enhanced AuthProvider with user profile and role management
 * 
 * Provides:
 * - Firebase auth state
 * - User profile from Firestore
 * - Role-based access control (RBAC) preparation
 * - Subscription/plan management preparation
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * Create or retrieve user profile safely (prevents duplicates)
   * Uses transaction-based utility to handle race conditions
   * 
   * @param {Object} user - Firebase auth user object
   * @returns {Promise<Object>} User profile
   */
  const createUserProfile = async (user) => {
    try {
      const profile = await createUserProfileSafely(user);

      // Check if we should show welcome modal (only for genuinely new users)
      const shouldShowWelcome = window.localStorage.getItem('showWelcomeModal');
      if (shouldShowWelcome === 'true') {
        window.localStorage.removeItem('showWelcomeModal');
        // Show welcome modal; user dismisses it manually
        setShowWelcomeModal(true);
      }

      return profile;
    } catch (error) {
      console.error('[Auth] Error creating/retrieving user profile:', error.code, error.message);
      throw error;
    }
  };

  /**
   * Update user's last login timestamp
   * Uses safe utility to prevent data overwrites
   * 
   * @param {string} userId - User ID
   */
  const updateLastLogin = async (userId) => {
    await updateLastLoginSafely(userId);
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // User is authenticated - fetch their profile from Firestore
        setProfileLoading(true);

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);

          // First, check if profile exists
          const userDocSnapshot = await getDoc(userDocRef);

          if (!userDocSnapshot.exists()) {
            // Profile doesn't exist - create it for new user
            try {
              const newProfile = await createUserProfile(currentUser);
              setUserProfile(newProfile);
              setProfileLoading(false);
              setLoading(false);
            } catch (createError) {
              console.error('❌ Failed to create user profile:', createError);
              // Set minimal fallback profile
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email,
                emailVerified: currentUser.emailVerified,
                role: USER_ROLES.USER,
                subscription: {
                  plan: SUBSCRIPTION_PLANS.FREE,
                  status: SUBSCRIPTION_STATUS.ACTIVE,
                  features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
                },
              });
              setProfileLoading(false);
              setLoading(false);
            }
            return;
          }

          // Profile exists - update last login and set up real-time listener
          await updateLastLogin(currentUser.uid);

          // Real-time listener for user profile changes
          const unsubscribeProfile = onSnapshot(
            userDocRef,
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                const profileData = docSnapshot.data();
                setUserProfile({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  emailVerified: currentUser.emailVerified,
                  ...profileData,
                  // Ensure role exists (default to 'user')
                  role: profileData.role || USER_ROLES.USER,
                  // Ensure subscription exists (default to 'free')
                  subscription: profileData.subscription || {
                    plan: SUBSCRIPTION_PLANS.FREE,
                    status: SUBSCRIPTION_STATUS.ACTIVE,
                    features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
                  },
                });
              } else {
                // Document was deleted - recreate it
                createUserProfile(currentUser).then(newProfile => {
                  setUserProfile(newProfile);
                });
              }
              setProfileLoading(false);
              setLoading(false);
            },
            (error) => {
              console.error('❌ Error fetching user profile:', error);
              // Set minimal profile on error
              setUserProfile({
                uid: currentUser.uid,
                email: currentUser.email,
                emailVerified: currentUser.emailVerified,
                role: USER_ROLES.USER,
                subscription: {
                  plan: SUBSCRIPTION_PLANS.FREE,
                  status: SUBSCRIPTION_STATUS.ACTIVE,
                  features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
                },
              });
              setProfileLoading(false);
              setLoading(false);
            }
          );

          // Store unsubscribe function for cleanup
          return () => unsubscribeProfile();
        } catch (error) {
          console.error('❌ Error setting up profile listener:', error);
          setProfileLoading(false);
          setLoading(false);
        }
      } else {
        // User is not authenticated
        setUserProfile(null);
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // BEP: Refresh FCM token on every app load when user is authenticated
  // This keeps tokens up-to-date (handles Firebase token rotation) and updates lastSeenAt
  // for stale device tracking. Only runs if permission already granted - no prompts.
  // Mobile PWAs may need a delay before Notification API is fully ready after reload.
  useEffect(() => {
    if (!user?.uid) return;
    if (typeof Notification === 'undefined') return;

    // Function to attempt token refresh
    const attemptRefresh = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      refreshFcmTokenForUser(user.uid).catch((err) => {
        console.warn('[AuthContext] FCM refresh failed:', err?.message || err);
      });
    };

    // For mobile PWAs, add a delay to ensure service worker and Notification API are ready
    const isMobilePWA =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
      (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);

    if (isMobilePWA) {
      // Mobile PWA: Wait a bit for service worker initialization
      const timeout = setTimeout(attemptRefresh, 2000);
      return () => clearTimeout(timeout);
    } else {
      // Desktop: Attempt immediately
      attemptRefresh();
    }
  }, [user?.uid]);

  // BEP v4.1.0: Wire FCM foreground listener to SHOW push notifications when app is open.
  // When the app is in the foreground, FCM's onMessage fires (NOT the SW onBackgroundMessage).
  // Without this listener, foreground push messages are silently dropped. We explicitly call
  // ServiceWorkerRegistration.showNotification() to display the push notification with the
  // same tag/options as the SW background handler. The tag ensures OS-level dedup — if the
  // same notification somehow arrives via both paths, only one is shown.
  // The client-side browser channel is already suppressed when push is enabled (v4.0.0),
  // so the only visible notifications are: 1 push + 1 in-app (correct behavior).
  useEffect(() => {
    if (!user?.uid) return undefined;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return undefined;

    let cleanup = () => { };

    initFcmForegroundListener((payload) => {
      // BEP: Show push notification via SW registration even when app is in foreground.
      // Mirrors the exact same notification options from public/sw.js onBackgroundMessage.
      const notification = payload?.notification || {};
      const data = payload?.data || {};
      const title = notification.title || data.title || 'Reminder';
      const body = notification.body || data.body || '';
      const tag = notification.tag || data.tag || `t2t-${data.eventKey || 'reminder'}`;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag,
              vibrate: [200],
              data,
              requireInteraction: false,
              dir: 'auto',
            });
          })
          .catch(() => {
            // SW not ready — fall back to basic Notification API
            try {
              new Notification(title, { body, tag, icon: '/icons/icon-192.png' });
            } catch {
              // Notification API unavailable
            }
          });
      }
    })
      .then((unsub) => {
        cleanup = unsub;
      })
      .catch(() => {
        // FCM not available — no-op
      });

    return () => cleanup();
  }, [user?.uid]);

  /**
   * Check if user has a specific role
   * @param {string|string[]} roles - Role(s) to check
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!userProfile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userProfile.role);
  };

  /**
   * Check if user has a specific subscription plan
   * @param {string|string[]} plans - Plan(s) to check
   * @returns {boolean}
   */
  const hasPlan = (plans) => {
    if (!userProfile?.subscription) return false;
    const planArray = Array.isArray(plans) ? plans : [plans];
    return planArray.includes(userProfile.subscription.plan);
  };

  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature to check
   * @returns {boolean}
   */
  const hasFeature = (feature) => {
    if (!userProfile?.subscription?.features) return false;
    return userProfile.subscription.features.includes(feature);
  };

  /**
   * Check if user is an admin
   * @returns {boolean}
   */
  const isAdmin = () => hasRole(['admin', 'superadmin']);

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => !!user && !!userProfile;

  const value = {
    user,
    userProfile,
    loading,
    profileLoading,
    // Helper methods
    hasRole,
    hasPlan,
    hasFeature,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show WelcomeModal for new users; app renders underneath */}
      {showWelcomeModal && (
        <WelcomeModal
          onClose={() => {
            setShowWelcomeModal(false);
          }}
          userEmail={user?.email}
        />
      )}

      {/* Render app after loading; welcome modal overlays when present */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
