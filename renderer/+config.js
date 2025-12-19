/**
 * renderer/+config.js
 * 
 * Purpose: Global vite-plugin-ssr configuration for Time 2 Trade.
 * Enables prerendered marketing pages with explicit trailing-slash handling
 * while allowing client-side routing for the app shell when needed.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-18 - Initial SSR configuration with prerender support.
 */

export default {
  passToClient: ['pageProps', 'documentProps'],
  trailingSlash: 'never',
  prerender: true,
};
