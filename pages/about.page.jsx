/**
 * pages/about.page.jsx
 * 
 * Purpose: Prerendered About page for Time 2 Trade with semantic content,
 * structured data, and lean markup for SEO and accessibility.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-16 - Updated /clock CTAs and refreshed About meta title/description.
 * v1.0.0 - 2025-12-18 - Initial SSR About page implementation.
 */


const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_3.PNG`;

const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'About Time 2 Trade',
    url: `${siteUrl}/about`,
    description:
        'Time 2 Trade helps futures and forex day traders track global sessions, overlay economic events, and stay aligned across timezones.',
    primaryImageOfPage: ogImage,
    publisher: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'About Time 2 Trade | Trading Clock for Futures & Forex',
    description:
        'Time 2 Trade: a lightweight trading clock + economic calendar for futures and forex day traders. Visualize sessions, overlaps, and economic events with timezone-aware countdowns and fast PWA install.',
    canonical: `${siteUrl}/about`,
    robots: 'index,follow',
    ogImage,
    structuredData: [aboutSchema],
};

const pillars = [
    {
        title: 'Session clarity',
        body: 'A dual-circle AM/PM clock keeps London, New York, and Asia rotations readable at a glance with midnight-safe math.',
    },
    {
        title: 'Events in your lane',
        body: 'Economic releases sync from JBlanked data and can be pinned on the clock or reviewed in a timeline, so catalysts never sneak up.',
    },
    {
        title: 'Timezone confidence',
        body: 'Switch timezones instantly without recalculating entries or overlaps. Countdown timers and labels stay accurate wherever you trade.',
    },
    {
        title: 'Performance-first delivery',
        body: 'Static marketing pages for SEO, a dedicated /clock workspace for the interactive clock, and lean bundles to keep LCP fast.',
    },
];

export default function Page() {
    return (
        <div className="page-shell__max">
            <header className="header" aria-label="Site navigation">
                <div className="logo" aria-label="Time 2 Trade home">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <a href="/clock" aria-label="Open the trading clock">Open clock</a>
                    <a href="/" aria-label="Return to landing page">Home</a>
                </nav>
            </header>

            <main>
                <section className="section" aria-labelledby="about-heading">
                    <h1 id="about-heading" className="heading-xl">Why we built Time 2 Trade</h1>
                    <p className="text-lead">
                        Time 2 Trade exists to make market sessions and catalysts obvious. Futures and forex traders move fast; we keep session timing, event risk, and timezone alignment frictionless so you can focus on execution.
                    </p>
                </section>

                <section className="section" aria-labelledby="pillar-heading">
                    <h2 id="pillar-heading" className="heading-lg">What guides the product</h2>
                    <div className="feature-grid">
                        {pillars.map((pillar) => (
                            <div className="card" key={pillar.title} style={{ padding: '18px' }}>
                                <h3 className="heading-md">{pillar.title}</h3>
                                <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>
                                    {pillar.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section" aria-labelledby="cta-heading">
                    <h2 id="cta-heading" className="heading-lg">Try the clock in under 10 seconds</h2>
                    <p className="text-lead">
                        No paywalls. Open the app, pick your timezone, and start tracking sessions and economic events. Sign in to sync settings; stay in guest mode if you prefer.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-primary" href="/clock" aria-label="Launch Time 2 Trade clock">Open the clock</a>
                        <a className="btn btn-secondary" href="/" aria-label="Return to landing page">Back to home</a>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="page-shell__max" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <div className="logo" aria-label="Time 2 Trade footer">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/clock" aria-label="Open the clock from footer">Open clock</a>
                        <a className="btn btn-secondary" href="/" aria-label="Go to landing page">Home</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
