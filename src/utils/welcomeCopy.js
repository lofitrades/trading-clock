/**
 * src/utils/welcomeCopy.js
 * 
 * Purpose: Centralized welcome/onboarding copy shared across authentication flows.
 * Ensures consistent messaging for new account creation regardless of provider.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-24 - Phase 2 i18n migration - Migrated 3 strings to welcome namespace (headline, confirmation, multiProvider). welcomeCopy now serves as reference mapping to i18n keys. Use t('welcome:key') in components instead of WELCOME_COPY direct access.
 * v1.0.0 - 2025-12-22 - Introduced shared welcome copy for email magic links, Google, and future X login.
 */

// Reference mapping - use t('welcome:key') in components instead of WELCOME_COPY direct access
export const WELCOME_COPY = {
  headline: 'welcome:headline',           // i18n key: "Welcome to Time 2 Trade!"
  confirmation: 'welcome:confirmation',   // i18n key: "Your account has been created successfully."
  multiProvider: 'welcome:multiProvider', // i18n key: "Use magic links, Google, or X (coming soon) to sign in..."
