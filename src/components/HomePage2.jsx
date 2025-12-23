/**
 * src/components/HomePage.jsx
 * 
 * Purpose: Home route wrapper for the /app experience that applies app-specific metadata before rendering the main SPA.
 * Keeps the trading experience intact while preventing duplicate marketing indexing (handled by SSR landing pages).
 * 
 * Changelog:
 * v1.0.2 - 2025-12-18 - Removed unused schema metadata after Helmet removal cleanup.
 * v1.0.1 - 2025-12-18 - Pointed canonical to /app and set robots to noindex after SSR landing migration.
 * v1.0.0 - 2025-12-17 - Added Helmet-based metadata and JSON-LD for the homepage route.
 */

import { useEffect } from 'react';
import App from '../App';
import { buildSeoMeta } from '../utils/seoMeta';

const HOME_DESCRIPTION = 'Time 2 Trade is a visual trading intelligence platform for futures and forex day traders. Track global market sessions, overlay high-impact economic events, and stay aligned with timezone-aware insights.';
const HOME_KEYWORDS = 'trading clock, market sessions, economic events, forex trading, futures trading, timezone converter, trading intelligence, ICT killzones, London session, New York session';

const homeMeta = buildSeoMeta({
  title: 'Time 2 Trade App | Visual Trading Intelligence for Sessions, Events & Timezones',
  description: HOME_DESCRIPTION,
  path: '/app',
  keywords: HOME_KEYWORDS,
});

export default function HomePage() {
  useEffect(() => {
    document.title = homeMeta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', homeMeta.description);
    }
  }, []);

  return (
    <>
      {/* SPA is noindex; minimal doc title/description handled in effect */}
      <App />
    </>
  );
}
