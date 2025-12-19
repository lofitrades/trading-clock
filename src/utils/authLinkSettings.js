/**
 * src/utils/authLinkSettings.js
 * 
 * Purpose: Centralized helper for passwordless email magic link settings.
 * Provides consistent actionCodeSettings for dev and production domains to avoid misrouted links.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-17 - Added helper returning actionCodeSettings with production https://time2.trade/ and dev localhost fallback.
 */

const PROD_CONTINUE_URL = 'https://time2.trade/';
const DEV_CONTINUE_URL = 'http://localhost:5173/';
const GH_PAGES_CONTINUE_URL = 'https://lofitrades.github.io/trading-clock/';

export function getMagicLinkActionCodeSettings() {
  const { hostname, origin } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProdHost = hostname === 'time2.trade' || hostname?.endsWith('.time2.trade');
  const isGithubHost = hostname?.includes('github.io');

  if (isLocalhost) {
    return {
      url: DEV_CONTINUE_URL,
      handleCodeInApp: true,
    };
  }

  if (isProdHost) {
    return {
      url: PROD_CONTINUE_URL,
      handleCodeInApp: true,
    };
  }

  if (isGithubHost) {
    return {
      url: GH_PAGES_CONTINUE_URL,
      handleCodeInApp: true,
    };
  }

  // Fallback to current origin for any staged/custom domains while avoiding localhost misuse
  return {
    url: `${origin}/`,
    handleCodeInApp: true,
  };
}
