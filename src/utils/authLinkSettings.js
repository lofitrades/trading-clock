/**
 * src/utils/authLinkSettings.js
 * 
 * Purpose: Centralized helper for passwordless email magic link settings.
 * Provides consistent actionCodeSettings for dev and production domains to avoid misrouted links.
 * 
 * Changelog:
 * v1.4.0 - 2026-02-04 - BEP SEO CRITICAL: Migrated from query params (?lang=xx) to subpath URLs (/es/, /fr/) for magic links. Aligns with Firebase hosting rewrites and SEO structure. Users clicking magic links land on correct language-specific URLs.
 * v1.3.0 - 2026-02-02 - BEP i18n: Added language parameter to getMagicLinkActionCodeSettings. Magic links now include ?lang={code} to preserve user's language preference. When user clicks the link, app detects and applies the language before rendering. Improves UX for ES/FR users receiving localized auth flow.
 * v1.2.0 - 2026-01-07 - Allow custom continue path (defaults to /app) so calendar embeds can keep users on /calendar after auth.
 * v1.1.0 - 2025-12-22 - Route magic link continue URLs to /app across environments so email links land on the authenticated app shell.
 * v1.0.0 - 2025-12-17 - Added helper returning actionCodeSettings with production https://time2.trade/ and dev localhost fallback.
 */
const PROD_BASE_URL = 'https://time2.trade';
const DEV_BASE_URL = 'http://localhost:5173';
const GH_PAGES_BASE_URL = 'https://lofitrades.github.io/trading-clock';
const ALLOWED_PATHS = ['/', '/calendar', '/app', '/about'];
const ALLOWED_LANGUAGES = ['en', 'es', 'fr'];

/**
 * Build URL with language subpath for non-English languages
 * BEP SEO: Uses subpath structure (/es/, /fr/) to match Firebase hosting rewrites
 * @param {string} base - Base URL (e.g., https://time2.trade)
 * @param {string} path - Path (e.g., /calendar)
 * @param {string|null} language - Language code (en, es, fr) or null
 * @returns {string} Full URL with optional language subpath
 */
const buildUrl = (base, path, language = null) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Use subpath prefix for non-default languages
  if (language && ALLOWED_LANGUAGES.includes(language) && language !== 'en') {
    return `${base}/${language}${normalizedPath}`;
  }
  
  return `${base}${normalizedPath}`;
};

/**
 * Get magic link action code settings with optional language preservation
 * @param {string} path - Redirect path after auth (default: /calendar)
 * @param {string|null} language - User's preferred language code (en, es, fr)
 * @returns {object} Firebase actionCodeSettings object
 */
export function getMagicLinkActionCodeSettings(path = '/calendar', language = null) {
  // Guard against open-redirect paths
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const safePath = ALLOWED_PATHS.includes(normalizedPath) ? normalizedPath : '/calendar';

  const { hostname, origin } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProdHost = hostname === 'time2.trade' || hostname?.endsWith('.time2.trade');
  const isGithubHost = hostname?.includes('github.io');

  if (isLocalhost) {
    return {
      url: buildUrl(DEV_BASE_URL, safePath, language),
      handleCodeInApp: true,
    };
  }

  if (isProdHost) {
    return {
      url: buildUrl(PROD_BASE_URL, safePath, language),
      handleCodeInApp: true,
    };
  }

  if (isGithubHost) {
    return {
      url: buildUrl(GH_PAGES_BASE_URL, safePath, language),
      handleCodeInApp: true,
    };
  }

  // Fallback to current origin for any staged/custom domains while avoiding localhost misuse
  return {
    url: buildUrl(origin, safePath, language),
    handleCodeInApp: true,
  };
}
