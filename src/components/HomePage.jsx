/**
 * src/components/HomePage.jsx
 * 
 * Purpose: Home route wrapper for the /app experience that applies app-specific metadata before rendering the main SPA.
 * Keeps the trading experience intact while preventing duplicate marketing indexing (handled by SSR landing pages).
 * 
 * Changelog:
 * v1.1.0 - 2026-01-16 - Set /app to noindex,nofollow with canonical to / and minimal metadata to avoid SEO competition with /clock.
 * v1.0.3 - 2026-01-07 - Updated meta copy to emphasize Forex Factory economic calendar + session clock workspace.
 * v1.0.2 - 2025-12-18 - Removed unused schema metadata after Helmet removal cleanup.
 * v1.0.1 - 2025-12-18 - Pointed canonical to /app and set robots to noindex after SSR landing migration.
 * v1.0.0 - 2025-12-17 - Added Helmet-based metadata and JSON-LD for the homepage route.
 */

import App from '../App';
import { buildSeoMeta } from '../utils/seoMeta';
import SEO from './SEO';

const homeMeta = buildSeoMeta({
  title: 'Time 2 Trade App | Private trading workspace',
  description:
    'Private app workspace for the Time 2 Trade clock and events experience. Not indexed for search to avoid duplicate marketing listings.',
  canonical: 'https://time2.trade/',
  path: '/app',
  robots: 'noindex,nofollow',
});

export default function HomePage() {
  return (
    <>
      <SEO {...homeMeta} />
      <App />
    </>
  );
}
