/**
 * pages/clock.page.jsx
 * 
 * Purpose: Prerendered /clock entry that loads the interactive clock workspace
 * while providing indexable metadata for the public trading clock route.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-16 - Added /clock SSR page with SEO metadata and app hydration.
 */

/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState } from 'react';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_3.PNG`;

export const prerender = () => ['/clock'];

const clockSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Trading Clock | Time 2 Trade',
    url: `${siteUrl}/clock`,
    description:
        'Live trading clock with market sessions (NY, London, Asia), overlaps, countdowns, and economic events overlay for futures and forex day traders.',
    primaryImageOfPage: ogImage,
    publisher: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
};

const clockFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What market sessions does the trading clock display?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'The clock shows New York, London, Asia, and other customizable trading sessions with real-time status, overlaps, and time-to-next-session countdowns.',
            },
        },
        {
            '@type': 'Question',
            name: 'Can I see economic events on the trading clock?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Economic events from the Forex Factory calendar can overlay on the clock and timeline, so you see session context and catalysts together.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is the trading clock timezone-aware?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. The clock auto-detects your timezone and adjusts all session windows and countdowns instantly when you change timezones.',
            },
        },
    ],
};

export const documentProps = {
    title: 'Trading Clock | Live Market Sessions for Forex & Futures',
    description:
        'Free live trading clock for futures and forex day traders. Real-time market sessions (NY, London, Asia), overlaps, countdowns, economic events overlay, and timezone-aware insights.',
    canonical: `${siteUrl}/clock`,
    robots: 'index,follow',
    ogImage,
    ogType: 'website',
    structuredData: [clockSchema, clockFaqSchema],
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
                <section className="section" aria-label="Loading trading clock">
                    <p className="badge" aria-hidden="true">Interactive mode</p>
                    <h1 className="heading-lg">Loading the trading clock…</h1>
                    <p className="text-lead">
                        The dual-circle clock, events overlay, and timezone controls will appear in a moment. This shell is prerendered so you get instant HTML while the client loads.
                    </p>
                </section>
            </div>
        );
    }

    return <AppClient />;
}
