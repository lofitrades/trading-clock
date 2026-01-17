/**
 * src/components/ClockPage.jsx
 * 
 * Purpose: Public trading clock route wrapper for /clock.
 * Applies indexable SEO metadata and renders the exact clock UI provided by App.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-16 - Added public /clock wrapper with SEO metadata and App UI.
 */

import App from '../App';
import SEO from './SEO';
import { buildSeoMeta } from '../utils/seoMeta';

const clockMeta = buildSeoMeta({
    title: 'Trading Clock & Sessions | Time 2 Trade',
    description:
        'Public trading clock for futures and forex: live session arcs, overlaps, countdowns, and economic events in one clean view.',
    path: '/clock',
});

export default function ClockPage() {
    return (
        <>
            <SEO {...clockMeta} />
            <App />
        </>
    );
}
