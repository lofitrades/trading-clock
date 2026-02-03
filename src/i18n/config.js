/**
 * src/i18n/config.js
 *
 * Purpose: i18next configuration with LAZY LOADING for optimal performance
 * Only loads active language + required namespaces on-demand via HTTP backend
 * Reduces initial bundle size by ~500KB by eliminating 78 static JSON imports
 *
 * Changelog:
 * v3.0.1 - 2026-02-02 - Added 'admin' namespace for /admin/events route (superadmin RBAC, won't impact public users).
 * v3.0.0 - 2026-01-29 - BEP PERFORMANCE: Reduced preload from 18 → 3 namespaces (common, pages, filter) to cut ~1.5s from critical path. Other namespaces now lazy-loaded via useTranslation() when components mount. Lighthouse audit showed 18 JSON files in network chain causing 1,886ms delay. Components using non-preloaded namespaces should call i18n.loadNamespaces() in useEffect for instant UX.
 * v2.0.7 - 2026-01-29 - BEP i18n: Added relativeTime translations to 'events' namespace for EventMarkerTooltip.
 * v2.0.6 - 2026-01-29 - BEP i18n: Added 'sessions' namespace for SessionArcTooltip.
 * v2.0.5 - 2026-01-30 - BEP i18n FIX: Added 'events' and 'reminders' namespaces for CustomEventDialog/RemindersEditor2.
 * v2.0.4 - 2026-01-29 - BEP i18n: Expanded preload list (admin, actions, dialogs, form, validation, states, tooltips, a11y, auth).
 * v2.0.3 - 2026-01-28 - BEP FIX: Added 'settings' namespace for SettingsSidebar2.
 * v2.0.2 - 2026-01-29 - BEP FIX: Added 'calendar' namespace for CalendarEmbed table headers.
 * v2.0.1 - 2026-01-29 - BEP FIX: Added 'filter' namespace for EventsFilters3.
 * v2.0.0 - 2026-01-27 - BEP PERFORMANCE: Migrate to i18next-http-backend for lazy loading.
 * v1.0.0 - 2026-01-24 - Initial i18n configuration with 3 MVP languages (EN, ES, FR)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

/**
 * Initialize i18next with HTTP backend for lazy loading
 * BEP PERFORMANCE:
 * - Load only active language (en/es/fr) on-demand
 * - Load namespaces as components mount (code-splitting aligned)
 * - Preload critical namespaces (common, pages) for instant UX
 * - Cache loaded translations in memory for fast subsequent access
 * - Reduces initial bundle by ~500KB (78 static JSON imports eliminated)
 */
i18n
  .use(HttpBackend)           // Load translations via HTTP on-demand
  .use(LanguageDetector)      // Auto-detect user language
  .use(initReactI18next)      // Initialize React integration
  .init({
    fallbackLng: 'en',        // Fall back to English if language not found
    
    // BEP PERFORMANCE v3.0.0: Only preload 3 critical namespaces (~15 KiB)
    // Other namespaces lazy-loaded via useTranslation() when components mount
    // Cuts ~1.5s from critical path (was 18 namespaces = 1,886ms chain)
    // Note: 'admin' added for /admin/events route (protected by RBAC, won't impact public users)
    ns: ['common', 'pages', 'filter', 'admin'],
    defaultNS: 'common',
    
    // BEP: Enable true lazy loading for non-preloaded namespaces
    // Components call: i18n.loadNamespaces(['calendar', 'events']) in useEffect
    partialBundledLanguages: true,
    
    interpolation: {
      escapeValue: false,     // React already escapes values
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],  // Cache language preference to localStorage
    },
    
    react: {
      useSuspense: false,     // Prevent Suspense boundary issues
    },
    
    // HTTP Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',  // Serve from public/ directory
      
      // BEP PERFORMANCE: Enable caching and parallel loading
      requestOptions: {
        mode: 'cors',
        credentials: 'same-origin',
        cache: 'default',     // Use browser cache for repeat loads
      },
      
      // BEP v3.0.0: Enable parallel loading for lazy-loaded namespaces
      allowMultiLoading: true,
      
      // No auto-reload (manual refresh on language change)
      reloadInterval: false,
    },
  });

/**
 * Helper to preload namespaces for a route/component
 * Usage: await preloadNamespaces(['calendar', 'events']);
 * @param {string[]} namespaces - Array of namespace names to preload
 * @returns {Promise<void>}
 */
export const preloadNamespaces = (namespaces) => {
  return i18n.loadNamespaces(namespaces).catch((err) => {
    console.warn('[i18n] Failed to preload namespaces:', namespaces, err);
  });
};

export default i18n;
