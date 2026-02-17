/**
 * pages/clock.page.jsx
 *
 * Purpose: Prerendered /clock entry that loads the interactive clock workspace
 * while providing indexable metadata for the public market clock route.
 *
 * Changelog:
 * v1.2.0 - 2026-02-02 - BEP SEO FIX: Added BreadcrumbList schema to help Google understand site
 *                       hierarchy and prioritize crawling. Addresses "Discovered - currently not indexed" GSC status.
 * v1.1.0 - 2026-01-22 - BEP SEO/copy refresh: align with "Market Clock + Economic Calendar",
 *                       emphasize Forex Factory-powered events, custom events + notifications, and remove "overlaps"
 *                       from primary positioning (kept optional/secondary).
 * v1.0.0 - 2026-01-16 - Added /clock SSR page with SEO metadata and app hydration.
 */

/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from 'react';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;

export const prerender = () => ['/clock'];

const clockSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Market Clock | Time 2 Trade',
    url: `${siteUrl}/clock`,
    description:
        'Market Clock + Economic Calendar for futures and forex day traders. Real-time market sessions, countdowns, Forex Factory-powered events, custom events, and reminders.',
    primaryImageOfPage: ogImage,
    publisher: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
};

const clockFaqEntries = [
    {
        q: 'What does the Market Clock show?',
        a: 'It shows the current session context for the trading day with real-time countdowns and clear time boundaries. The default workflow is New York time-first, with timezone switching available.',
    },
    {
        q: 'Is the economic calendar powered by Forex Factory?',
        a: 'Yes. Time 2 Trade uses a Forex Factory-powered economic events feed and places events in the same workspace as your session timing so you can avoid trading blind into releases.',
    },
    {
        q: 'Can I add my own custom events and reminders?',
        a: 'Yes. You can create custom events (prep checkpoints, no-trade windows, session reminders). Notifications/reminders are supported where available.',
    },
    {
        q: 'Is this a signal tool?',
        a: 'No. Time 2 Trade provides timing and awareness for sessions and scheduled events. It does not provide buy/sell signals or execute trades.',
    },
];

const clockFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: clockFaqEntries.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
        },
    })),
};

// BEP SEO: BreadcrumbList helps Google understand site hierarchy and prioritize crawling
const clockBreadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: 'Market Clock',
            item: `${siteUrl}/clock`,
        },
    ],
};

export const documentProps = {
    title: 'Market Clock + Economic Calendar | Time 2 Trade',
    description:
        'Free Market Clock + Economic Calendar for futures and forex day traders. Real-time session timing and countdowns, Forex Factory-powered events, custom events, and reminders.',
    canonical: `${siteUrl}/clock`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    ogType: 'website',
    structuredData: [clockSchema, clockFaqSchema, clockBreadcrumbSchema],
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
                <section className="section" aria-label="Loading session clock">
                    <p className="badge" aria-hidden="true">
                        Interactive workspace
                    </p>

                    <h1 className="heading-lg">Loading Time 2 Trade…</h1>

                    <p className="text-lead">
                        Your <strong>Market Clock + Economic Calendar</strong> is loading now. This route is prerendered so you get fast,
                        crawlable HTML first, then the full interactive workspace hydrates client-side.
                    </p>

                    <div className="card" style={{ padding: '18px' }}>
                        <div className="hero-visual__grid">
                            <div className="hero-visual__item">
                                <p className="hero-visual__title">Session clock</p>
                                <p className="hero-visual__stat">Loading…</p>
                                <p className="hero-visual__hint">Session timing + countdowns</p>
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
                                <p className="hero-visual__title">Timezone</p>
                                <p className="hero-visual__stat">Auto</p>
                                <p className="hero-visual__hint">NY time-first, switch anytime</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 14 }}>
                        <a className="btn btn-secondary" href="/calendar" aria-label="Open the economic calendar">
                            Open calendar
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label="Back to home">
                            Home
                        </a>
                    </div>

                    <p className="text-muted" style={{ marginTop: 14 }}>
                        Not financial advice. Trading involves risk.
                    </p>
                </section>
            </div>
        );
    }

    return <AppClient />;
}
