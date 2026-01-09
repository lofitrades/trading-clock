/**
 * src/contexts/AuthContext.jsx
 * 
 * Purpose: Enhanced authentication context with user profile, roles, and subscription data.
 * Provides authentication state management with Firestore user profile integration.
 * Automatically creates user documents with role and subscription on account creation.
 * 
 * Changelog:
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

const AuthContext = createContext();

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
