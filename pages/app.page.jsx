/**
 * pages/app.page.jsx
 *
 * Purpose: /app entry that prerenders a lightweight shell and then loads the
 * interactive React SPA client-side to keep marketing bundles lean.
 *
 * Changelog:
 * v1.2.0 - 2026-01-22 - Updated copy to match BEP positioning (Session Clock + Economic Calendar (NY Time)),
 *                       reinforced /app as a non-indexed UI shell, and refreshed loader placeholders to
 *                       reflect custom events + notifications + Forex Factory-powered calendar.
 * v1.1.0 - 2026-01-16 - Marked /app as noindex,nofollow with canonical to / to avoid SEO duplication with /clock.
 * v1.0.0 - 2025-12-18 - Initial client-loaded app route with prerendered shell.
 */

/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from 'react';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;

export const route = /^\/app(\/.*)?$/;
export const prerender = () => ['/app'];

// SEO decision: /app is an authenticated/interactive UI shell. Keep it accessible for users,
// but block indexing to prevent duplication with indexable public routes like / and /clock.
export const documentProps = {
    title: 'Time 2 Trade App | Interactive workspace',
    description:
        'Interactive workspace for the Time 2 Trade session clock and economic calendar experience (NY time), including custom events, reminders, and account-synced preferences. Not indexed to avoid SEO duplication.',
    canonical: `${siteUrl}/`,
    robots: 'noindex,nofollow',
    ogImage,
    ogType: 'website',
};

export default function Page() {
    const [AppClient, setAppClient] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const module = await import('../src/app/AppBootstrap');
            if (!cancelled) {
                setAppClient(() => module.default);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!AppClient) {
        return (
            <div className="page-shell__max" role="main">
                <section className="section" aria-label="Loading app">
                    <p className="badge" aria-hidden="true">
                        Interactive workspace
                    </p>

                    <h1 className="heading-lg">Loading Time 2 Trade…</h1>

                    <p className="text-lead">
                        Your <strong>Session Clock + Economic Calendar (NY Time)</strong> is loading now. This page ships a lightweight HTML
                        shell first, then loads the full interactive workspace client-side for a fast, clean experience.
                    </p>

                    <div className="card" style={{ padding: '18px' }}>
                        <div className="hero-visual__grid">
                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Session clock</p>
                                <p className="hero-visual__stat">Loading…</p>
                                <p className="hero-visual__hint">Preparing session timing + countdowns</p>
                            </div>

                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Economic calendar</p>
                                <p className="hero-visual__stat">Syncing…</p>
                                <p className="hero-visual__hint">Forex Factory-powered events</p>
                            </div>

                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Custom events</p>
                                <p className="hero-visual__stat">Initializing…</p>
                                <p className="hero-visual__hint">Your reminders and timing rules</p>
                            </div>

                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Notifications</p>
                                <p className="hero-visual__stat">Checking…</p>
                                <p className="hero-visual__hint">Event and reminder alerts (where supported)</p>
                            </div>

                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Timezone</p>
                                <p className="hero-visual__stat">Auto</p>
                                <p className="hero-visual__hint">NY time-first, switch anytime</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 14 }}>
                        <a className="btn btn-secondary" href="/clock" aria-label="Open the clock (public route)">
                            Open clock
                        </a>
                        <a className="btn btn-secondary" href="/calendar" aria-label="Open the calendar (public route)">
                            Open calendar
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label="Back to home">
                            Home
                        </a>
                    </div>
                </section>
            </div>
        );
    }

    return <AppClient />;
}
