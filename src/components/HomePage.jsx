/**
 * src/components/HomePage.jsx
 * 
 * Purpose: Home route wrapper for the /app experience that applies app-specific metadata before rendering the main SPA.
 * Keeps the trading experience intact while preventing duplicate marketing indexing (handled by SSR landing pages).
 * 
 * Changelog:
 * v1.0.3 - 2026-01-07 - Updated meta copy to emphasize Forex Factory economic calendar + session clock workspace.
 * v1.0.2 - 2025-12-18 - Removed unused schema metadata after Helmet removal cleanup.
 * v1.0.1 - 2025-12-18 - Pointed canonical to /app and set robots to noindex after SSR landing migration.
 * v1.0.0 - 2025-12-17 - Added Helmet-based metadata and JSON-LD for the homepage route.
 */

import { useEffect } from 'react';
import App from '../App';
import { buildSeoMeta } from '../utils/seoMeta';

const HOME_DESCRIPTION = 'Time 2 Trade combines a Forex Factory-powered economic calendar with a live market session clock for futures and forex day traders. Track New York / London / Asia sessions, overlaps, and today\'s events with impact and currency filters, favorites, notes, and exports.';
const HOME_KEYWORDS = 'economic calendar, forex factory calendar, trading session clock, market session overlaps, futures economic calendar, forex news calendar, impact filters, currency filters, session timing, ICT killzones, London session, New York session';

const homeMeta = buildSeoMeta({
  title: 'Time 2 Trade | Economic Calendar + Session Clock (Forex Factory Data)',
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
