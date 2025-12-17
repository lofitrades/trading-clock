/**
 * src/utils/userProfileUtils.js
 * 
 * Purpose: Utilities for safe user profile creation and management.
 * Prevents duplicate user documents and handles race conditions.
 * 
 * Changelog:
 * v1.0.1 - 2025-12-16 - Added showTimezoneLabel default setting for new user profiles.
 * v1.0.0 - 2025-12-16 - Initial implementation with duplicate prevention
 */

import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { USER_ROLES, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, PLAN_FEATURES } from '../types/userTypes';

/**
 * Safely create or retrieve user profile with duplicate prevention
 * Uses Firestore transaction to prevent race conditions
 * 
 * @param {Object} user - Firebase auth user object
 * @returns {Promise<Object>} User profile (created or existing)
 */
export async function createUserProfileSafely(user) {
  if (!user || !user.uid) {
    throw new Error('Invalid user object - missing uid');
  }

  const userDocRef = doc(db, 'users', user.uid);

  try {
    // Use transaction to prevent race condition
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);

      // If document already exists, return existing profile
      if (userDoc.exists()) {
        console.log('[UserProfile] Document already exists for uid:', user.uid);
        
        // Update last login timestamp
        transaction.update(userDocRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return {
          uid: user.uid,
          ...userDoc.data(),
        };
      }

      // Document doesn't exist - create new profile
      console.log('[UserProfile] Creating new profile for uid:', user.uid);
      
      const defaultProfile = {
        // Basic Info
        email: user.email,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        
        // Role & Permissions
        role: USER_ROLES.USER,
        
        // Subscription
        subscription: {
          plan: SUBSCRIPTION_PLANS.FREE,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
          startDate: serverTimestamp(),
          endDate: null,
          trialEndsAt: null,
          customerId: null,
          subscriptionId: null,
        },
        
        // Default Settings
        settings: {
          clockStyle: 'normal',
          canvasSize: 100,
          clockSize: 375,
          selectedTimezone: 'America/New_York',
          backgroundColor: '#F9F9F9',
          backgroundBasedOnSession: false,
          showHandClock: true,
          showDigitalClock: true,
          showSessionLabel: true,
          showTimezoneLabel: true,
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

      // Create the document within transaction
      transaction.set(userDocRef, defaultProfile);

      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        ...defaultProfile,
      };
    });

    return result;
  } catch (error) {
    console.error('[UserProfile] Transaction failed:', error.code, error.message);
    throw error;
  }
}

/**
 * Check if user profile exists in Firestore
 * 
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if profile exists
 */
export async function userProfileExists(userId) {
  if (!userId) {
    return false;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists();
  } catch (error) {
    console.error('[UserProfile] Error checking existence:', error.code, error.message);
    return false;
  }
}

/**
 * Safely update last login timestamp
 * Uses merge to avoid overwriting existing data
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function updateLastLoginSafely(userId) {
  if (!userId) {
    throw new Error('Invalid userId');
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    
    // Use merge to only update specified fields
    await setDoc(
      userDocRef,
      {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('[UserProfile] Error updating last login:', error.code, error.message);
    // Don't throw - this is non-critical
  }
}

/**
 * Validate user profile data structure
 * Ensures all required fields are present
 * 
 * @param {Object} profile - User profile to validate
 * @returns {boolean} True if valid
 */
export function validateUserProfile(profile) {
  if (!profile) return false;
  
  const requiredFields = ['uid', 'email', 'role', 'subscription'];
  const hasRequiredFields = requiredFields.every(field => field in profile);
  
  if (!hasRequiredFields) {
    console.warn('[UserProfile] Missing required fields:', 
      requiredFields.filter(field => !(field in profile))
    );
    return false;
  }

  // Validate subscription structure
  if (!profile.subscription || !profile.subscription.plan) {
    console.warn('[UserProfile] Invalid subscription structure');
    return false;
  }

  return true;
}
