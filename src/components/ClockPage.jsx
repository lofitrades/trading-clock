/**
 * src/components/ClockPage.jsx
 * 
 * Purpose: Public trading clock route wrapper for /clock.
 * Applies indexable SEO metadata and renders the exact clock UI provided by App.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-29 - BEP PERFORMANCE: Added preloadNamespaces() for route-aware i18n loading. Preloads events, sessions, tooltips, settings, a11y namespaces on mount.
 * v1.0.1 - 2026-01-22 - BEP REFACTOR: App now renders via PublicLayout which uses standalone MobileHeader component. Mobile header consistency integrated transparently across /clock and all pages.
 * v1.0.0 - 2026-01-16 - Added public /clock wrapper with SEO metadata and App UI.
 */

import { useEffect } from 'react';
import App from '../App';
import SEO from './SEO';
import { buildSeoMeta } from '../utils/seoMeta';
import { preloadNamespaces } from '../i18n/config';

const clockMeta = buildSeoMeta({
    title: 'Trading Clock & Sessions | Time 2 Trade',
    description:
        'Public trading clock for futures and forex: live session arcs, overlaps, countdowns, and economic events in one clean view.',
    path: '/clock',
});

export default function ClockPage() {
    useEffect(() => {
        // BEP PERFORMANCE v1.1.0: Preload route-specific i18n namespaces
        preloadNamespaces([
            'events',     // Event markers on clock
            'sessions',   // Session tooltips
            'tooltips',   // Clock tooltips
            'settings',   // SettingsSidebar2
            'a11y',       // Accessibility labels
            'auth',       // Auth modal
            'dialogs',    // Confirm modals
            'reminders',  // Custom reminders
        ]);
    }, []);

    return (
        <>
            <SEO {...clockMeta} />
            <App />
        </>
    );
}
