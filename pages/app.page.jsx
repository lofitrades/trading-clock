/**
 * pages/app.page.jsx
 * 
 * Purpose: /app entry that prerenders a lightweight shell and then loads the
 * interactive React SPA client-side to keep marketing bundles lean.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-18 - Initial client-loaded app route with prerendered shell.
 */

/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from 'react';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_2.PNG`;

export const route = /^\/app(\/.*)?$/;
export const prerender = () => ['/app'];

export const documentProps = {
    title: 'Time 2 Trade App | Live trading session clock and events overlay',
    description:
        'Launch the Time 2 Trade app to see live market sessions, economic events, and timezone-aware countdowns in one responsive clock.',
    canonical: `${siteUrl}/app`,
    robots: 'noindex,follow',
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
                    <p className="badge" aria-hidden="true">Interactive mode</p>
                    <h1 className="heading-lg">Loading the Time 2 Trade app…</h1>
                    <p className="text-lead">
                        The dual-circle clock, events overlay, and timezone controls will appear in a moment. This shell is prerendered so you get instant HTML while the client loads.
                    </p>
                    <div className="card" style={{ padding: '18px' }}>
                        <div className="hero-visual__grid">
                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Sessions</p>
                                <p className="hero-visual__stat">Loading…</p>
                                <p className="hero-visual__hint">Preparing your clock</p>
                            </div>
                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Events</p>
                                <p className="hero-visual__stat">Syncing…</p>
                                <p className="hero-visual__hint">Economic calendar overlay</p>
                            </div>
                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Timezone</p>
                                <p className="hero-visual__stat">Auto</p>
                                <p className="hero-visual__hint">Switch anytime</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return <AppClient />;
}
