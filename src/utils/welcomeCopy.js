/**
 * src/utils/welcomeCopy.js
 * 
 * Purpose: Centralized welcome/onboarding copy shared across authentication flows.
 * Ensures consistent messaging for new account creation regardless of provider.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-22 - Introduced shared welcome copy for email magic links, Google, and future X login.
 */

export const WELCOME_COPY = {
  headline: 'Welcome to Time 2 Trade!',
  confirmation: 'Your account has been created successfully.',
  multiProvider: 'Use magic links, Google, or X (coming soon) to sign in from any device.',
};
