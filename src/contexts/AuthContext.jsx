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
  const [profileLoading, setProfileLoading] = useState(false);

  /**
   * Create default user profile in Firestore
   * Called when a new user is created or profile doesn't exist
   * 
   * @param {Object} user - Firebase auth user object
   * @returns {Promise<Object>} Created user profile
   */
  const createUserProfile = async (user) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Default user profile structure
      const defaultProfile = {
        // Basic Info
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        
        // Role & Permissions
        role: USER_ROLES.USER, // Default to 'user' role
        
        // Subscription
        subscription: {
          plan: SUBSCRIPTION_PLANS.FREE, // Default to free plan
          status: SUBSCRIPTION_STATUS.ACTIVE,
          features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE], // Free tier features
          startDate: serverTimestamp(),
          endDate: null,
          trialEndsAt: null,
          customerId: null,
          subscriptionId: null,
        },
        
        // Default Settings (from existing structure)
        // NOTE: selectedTimezone managed by SettingsContext - included here for new user profile creation only
        settings: {
          clockStyle: 'normal',
          canvasSize: 100,
          clockSize: 375,
          selectedTimezone: 'America/New_York',  // Default timezone (SettingsContext is source of truth)
          backgroundColor: '#F9F9F9',
          backgroundBasedOnSession: false,
          showHandClock: true,
          showDigitalClock: true,
          showSessionLabel: true,
          showTimeToEnd: false,
          showTimeToStart: true,
          showSessionNamesInCanvas: false,
          emailNotifications: true,
          eventAlerts: false,
        },
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      };

      // Create the document in Firestore
      await setDoc(userDocRef, defaultProfile);
      
      console.log('✅ User profile created:', user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...defaultProfile,
      };
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  };

  /**
   * Update user's last login timestamp
   * 
   * @param {string} userId - User ID
   */
  const updateLastLogin = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        { 
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('✅ Last login updated for user:', userId);
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      // Don't throw - this is non-critical
    }
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
            console.log('📝 New user detected, creating profile...');
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
                console.log('⚠️ User profile missing, recreating...');
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
