/**
 * src/utils/messages.js
 * 
 * Purpose: Error and success message utilities for authentication and user operations
 * Provides friendly, user-facing messages for various application states
 * 
 * Changelog:
 * v1.1.0 - 2026-01-24 - Phase 2 i18n migration - Migrated 14 strings (8 errors + 7 success) to messages namespace (errors: wrongPassword, userNotFound, emailAlreadyInUse, invalidEmail, userDisabled, tooManyRequests, networkRequestFailed, default; success: login, signup, verifyEmail, passwordReset, profileUpdated, changePassword, default). Functions now accept i18n instance as parameter or use lazy-loaded i18n singleton for backward compatibility.
 * v1.0.0 - Initial implementation with hardcoded English messages
 */

import i18n from '../i18n/config.js';

export function getFriendlyErrorMessage(errorCode, tInstance = null) {
    const t = tInstance || i18n.t;
    
    const errorMap = {
      'auth/wrong-password': () => t('messages:errors.wrongPassword'),
      'auth/user-not-found': () => t('messages:errors.userNotFound'),
      'auth/email-already-in-use': () => t('messages:errors.emailAlreadyInUse'),
      'auth/invalid-email': () => t('messages:errors.invalidEmail'),
      'auth/user-disabled': () => t('messages:errors.userDisabled'),
      'auth/too-many-requests': () => t('messages:errors.tooManyRequests'),
      'auth/network-request-failed': () => t('messages:errors.networkRequestFailed'),
    };

    return (errorMap[errorCode]?.() || t('messages:errors.default'));
  }
  
export function getSuccessMessage(type, tInstance = null) {
    const t = tInstance || i18n.t;
    
    const successMap = {
      'login': () => t('messages:success.login'),
      'signup': () => t('messages:success.signup'),
      'verify-email': () => t('messages:success.verifyEmail'),
      'password-reset': () => t('messages:success.passwordReset'),
      'profile-updated': () => t('messages:success.profileUpdated'),
      'change-password': () => t('messages:success.changePassword'),
    };

    return (successMap[type]?.() || t('messages:success.default'));
  }
