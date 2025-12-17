/**
 * src/types/userTypes.js
 * 
 * Purpose: Type definitions and constants for user roles, subscriptions, and features.
 * Provides centralized configuration for RBAC and subscription-based access control.
 * 
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

/**
 * USER ROLES
 * Hierarchical role system for application access control
 */
export const USER_ROLES = {
  USER: 'user',           // Default role - basic access
  ADMIN: 'admin',         // Administrator - manage users, settings, content
  SUPERADMIN: 'superadmin', // Super Administrator - full system access
};

/**
 * SUBSCRIPTION PLANS
 * Available subscription tiers with different feature sets
 */
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',           // Free tier - basic features
  PREMIUM: 'premium',     // Premium tier - advanced features
  PRO: 'pro',            // Professional tier - all features + API access
};

/**
 * SUBSCRIPTION STATUS
 * Current state of a user's subscription
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',       // Subscription is active and valid
  INACTIVE: 'inactive',   // Subscription expired or cancelled
  TRIALING: 'trialing',   // Free trial period
  PAST_DUE: 'past_due',   // Payment failed, grace period
  CANCELLED: 'cancelled', // Cancelled by user
};

/**
 * FEATURES
 * Individual features that can be enabled/disabled per subscription
 */
export const FEATURES = {
  // Basic Features (Free)
  BASIC_CLOCK: 'basic_clock',
  SESSION_TRACKING: 'session_tracking',
  TIMEZONE_SELECTION: 'timezone_selection',
  BASIC_EVENTS: 'basic_events',

  // Premium Features
  ADVANCED_CHARTS: 'advanced_charts',
  CUSTOM_ALERTS: 'custom_alerts',
  EVENT_NOTIFICATIONS: 'event_notifications',
  MULTIPLE_TIMEZONES: 'multiple_timezones',
  EXPORT_DATA: 'export_data',
  
  // Pro Features
  API_ACCESS: 'api_access',
  WEBHOOK_INTEGRATION: 'webhook_integration',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  PRIORITY_SUPPORT: 'priority_support',
  
  // Admin Features
  MANAGE_USERS: 'manage_users',
  MANAGE_CONTENT: 'manage_content',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_ALL_DATA: 'export_all_data',
};

/**
 * PLAN FEATURES MAPPING
 * Defines which features are included in each subscription plan
 */
export const PLAN_FEATURES = {
  [SUBSCRIPTION_PLANS.FREE]: [
    FEATURES.BASIC_CLOCK,
    FEATURES.SESSION_TRACKING,
    FEATURES.TIMEZONE_SELECTION,
    FEATURES.BASIC_EVENTS,
  ],
  [SUBSCRIPTION_PLANS.PREMIUM]: [
    FEATURES.BASIC_CLOCK,
    FEATURES.SESSION_TRACKING,
    FEATURES.TIMEZONE_SELECTION,
    FEATURES.BASIC_EVENTS,
    FEATURES.ADVANCED_CHARTS,
    FEATURES.CUSTOM_ALERTS,
    FEATURES.EVENT_NOTIFICATIONS,
    FEATURES.MULTIPLE_TIMEZONES,
    FEATURES.EXPORT_DATA,
  ],
  [SUBSCRIPTION_PLANS.PRO]: [
    FEATURES.BASIC_CLOCK,
    FEATURES.SESSION_TRACKING,
    FEATURES.TIMEZONE_SELECTION,
    FEATURES.BASIC_EVENTS,
    FEATURES.ADVANCED_CHARTS,
    FEATURES.CUSTOM_ALERTS,
    FEATURES.EVENT_NOTIFICATIONS,
    FEATURES.MULTIPLE_TIMEZONES,
    FEATURES.EXPORT_DATA,
    FEATURES.API_ACCESS,
    FEATURES.WEBHOOK_INTEGRATION,
    FEATURES.ADVANCED_ANALYTICS,
    FEATURES.CUSTOM_INTEGRATIONS,
    FEATURES.PRIORITY_SUPPORT,
  ],
};

/**
 * ROLE PERMISSIONS
 * Defines what roles can access what features
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: [], // Inherits from subscription plan
  [USER_ROLES.ADMIN]: [
    ...PLAN_FEATURES[SUBSCRIPTION_PLANS.PRO], // All pro features
    FEATURES.MANAGE_USERS,
    FEATURES.MANAGE_CONTENT,
    FEATURES.VIEW_ANALYTICS,
    FEATURES.EXPORT_ALL_DATA,
  ],
  [USER_ROLES.SUPERADMIN]: [
    ...PLAN_FEATURES[SUBSCRIPTION_PLANS.PRO], // All pro features
    FEATURES.MANAGE_USERS,
    FEATURES.MANAGE_CONTENT,
    FEATURES.SYSTEM_SETTINGS,
    FEATURES.VIEW_ANALYTICS,
    FEATURES.EXPORT_ALL_DATA,
  ],
};

/**
 * Get all features for a user based on role and subscription
 * @param {string} role - User role
 * @param {string} plan - Subscription plan
 * @returns {string[]} Array of feature keys
 */
export const getUserFeatures = (role, plan) => {
  const roleFeatures = ROLE_PERMISSIONS[role] || [];
  const planFeatures = PLAN_FEATURES[plan] || [];
  
  // Admins and superadmins get their role features
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.SUPERADMIN) {
    return roleFeatures;
  }
  
  // Regular users get features from their subscription plan
  return planFeatures;
};

/**
 * Check if a user has access to a specific feature
 * @param {string} role - User role
 * @param {string} plan - Subscription plan
 * @param {string} feature - Feature to check
 * @returns {boolean}
 */
export const hasFeatureAccess = (role, plan, feature) => {
  const features = getUserFeatures(role, plan);
  return features.includes(feature);
};

/**
 * DEFAULT USER PROFILE
 * Default values for new user profiles
 */
export const DEFAULT_USER_PROFILE = {
  role: USER_ROLES.USER,
  subscription: {
    plan: SUBSCRIPTION_PLANS.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    features: PLAN_FEATURES[SUBSCRIPTION_PLANS.FREE],
    startDate: null,
    endDate: null,
    trialEndsAt: null,
  },
  settings: {
    emailNotifications: true,
    eventAlerts: false,
    selectedTimezone: 'America/New_York',
    showTimezoneLabel: true,
  },
  createdAt: null,
  updatedAt: null,
  lastLoginAt: null,
};

/**
 * FIRESTORE USER DOCUMENT STRUCTURE
 * 
 * Collection: users
 * Document ID: {userId} (Firebase Auth UID)
 * 
 * Structure:
 * {
 *   // Basic Info
 *   email: string,
 *   displayName: string | null,
 *   photoURL: string | null,
 *   
 *   // Role & Permissions
 *   role: 'user' | 'admin' | 'superadmin',
 *   
 *   // Subscription
 *   subscription: {
 *     plan: 'free' | 'premium' | 'pro',
 *     status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'cancelled',
 *     features: string[],
 *     startDate: Timestamp | null,
 *     endDate: Timestamp | null,
 *     trialEndsAt: Timestamp | null,
 *     customerId: string | null,  // Stripe customer ID
 *     subscriptionId: string | null,  // Stripe subscription ID
 *   },
 *   
 *   // Settings (from existing structure)
 *   settings: {
 *     clockStyle: 'modern' | 'classic',
 *     canvasSize: number,
 *     clockSize: number,
 *     sessions: Array,
 *     selectedTimezone: string,
 *     backgroundColor: string,
 *     backgroundBasedOnSession: boolean,
 *     showHandClock: boolean,
 *     showDigitalClock: boolean,
 *     showSessionLabel: boolean,
 *     showTimezoneLabel: boolean,
 *     showTimeToEnd: boolean,
 *     showTimeToStart: boolean,
 *     showSessionNamesInCanvas: boolean,
 *     emailNotifications: boolean,
 *     eventAlerts: boolean,
 *   },
 *   
 *   // Timestamps
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   lastLoginAt: Timestamp,
 * }
 */

export default {
  USER_ROLES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  FEATURES,
  PLAN_FEATURES,
  ROLE_PERMISSIONS,
  DEFAULT_USER_PROFILE,
  getUserFeatures,
  hasFeatureAccess,
};
