/**
 * src/utils/authLinkSettings.js
 * 
 * Purpose: Centralized helper for passwordless email magic link settings.
 * Provides consistent actionCodeSettings for dev and production domains to avoid misrouted links.
 * 
 * Changelog:
 * v1.2.0 - 2026-01-07 - Allow custom continue path (defaults to /app) so calendar embeds can keep users on /calendar after auth.
 * v1.1.0 - 2025-12-22 - Route magic link continue URLs to /app across environments so email links land on the authenticated app shell.
 * v1.0.0 - 2025-12-17 - Added helper returning actionCodeSettings with production https://time2.trade/ and dev localhost fallback.
 */
const PROD_BASE_URL = 'https://time2.trade';
const DEV_BASE_URL = 'http://localhost:5173';
const GH_PAGES_BASE_URL = 'https://lofitrades.github.io/trading-clock';
const ALLOWED_PATHS = ['/', '/calendar', '/app', '/events', '/about'];

const buildUrl = (base, path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export function getMagicLinkActionCodeSettings(path = '/calendar') {
  // Guard against open-redirect paths
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const safePath = ALLOWED_PATHS.includes(normalizedPath) ? normalizedPath : '/calendar';

  const { hostname, origin } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProdHost = hostname === 'time2.trade' || hostname?.endsWith('.time2.trade');
  const isGithubHost = hostname?.includes('github.io');

  if (isLocalhost) {
    return {
      url: buildUrl(DEV_BASE_URL, safePath),
      handleCodeInApp: true,
    };
  }

  if (isProdHost) {
    return {
      url: buildUrl(PROD_BASE_URL, safePath),
      handleCodeInApp: true,
    };
  }

  if (isGithubHost) {
    return {
      url: buildUrl(GH_PAGES_BASE_URL, safePath),
      handleCodeInApp: true,
    };
  }

  // Fallback to current origin for any staged/custom domains while avoiding localhost misuse
  return {
    url: buildUrl(origin, safePath),
    handleCodeInApp: true,
  };
}
