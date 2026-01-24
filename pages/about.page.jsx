/**
 * pages/about.page.jsx
 *
 * Purpose: Prerendered About page for Time 2 Trade with semantic content,
 * structured data, and lean markup for SEO and accessibility.
 *
 * Changelog:
 * v1.2.0 - 2026-01-22 - Updated positioning to match BEP SEO: Session Clock + Forex Factory-powered economic calendar (NY time),
 *                       added custom events + notifications pillars, removed “overlaps/PWA install/JBlanked” claims, added /calendar CTAs,
 *                       expanded structured data (WebPage + WebApplication).
 * v1.1.0 - 2026-01-16 - Updated /clock CTAs and refreshed About meta title/description.
 * v1.0.0 - 2025-12-18 - Initial SSR About page implementation.
 */

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;

const aboutWebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'About Time 2 Trade',
    url: `${siteUrl}/about`,
    description:
        'Time 2 Trade is an intraday timing workspace for futures and forex day traders: a NY-time session clock with countdowns plus a Forex Factory-powered economic calendar, custom events, and notifications.',
    primaryImageOfPage: ogImage,
    isPartOf: { '@type': 'WebSite', name: 'Time 2 Trade', url: siteUrl },
    publisher: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
};

const aboutAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Time 2 Trade',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    url: siteUrl,
    image: ogImage,
    description:
        'A New York time-first intraday timing workspace for futures and forex day traders: session countdowns + a Forex Factory-powered economic calendar with impact/currency filters, custom events, and notifications. Built for awareness, not trading signals.',
    creator: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
    featureList: [
        'Session clock with New York time-first session awareness and countdowns',
        'Forex Factory-powered economic calendar for scheduled releases',
        'Fast filters for impact, currency, and search',
        'Custom events for personal timing windows and reminders',
        'Notifications for upcoming events (where supported)',
        'Favorites and personal notes for authenticated users',
        'Designed for intraday awareness and event-avoidance (not trading signals)',
    ],
    screenshot: ogImage,
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'About Time 2 Trade | Session Clock + Forex Factory Calendar (NY Time)',
    description:
        'Why Time 2 Trade exists: a NY-time-first session clock with countdowns plus a Forex Factory-powered economic calendar, custom events, and notifications for intraday futures and forex traders.',
    canonical: `${siteUrl}/about`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    structuredData: [aboutWebPageSchema, aboutAppSchema],
};

const pillars = [
    {
        title: 'Session clarity (NY time-first)',
        body:
            'A visual session clock makes New York, London, and Asia timing obvious, with clean countdowns to key transitions—so you stop doing timezone math mid-trade.',
    },
    {
        title: 'Forex Factory-powered event awareness',
        body:
            'Scheduled releases are surfaced in a familiar format. Filter by impact and currency to focus on what actually moves your instruments before you press buy or sell.',
    },
    {
        title: 'Custom events + notifications',
        body:
            'Add your own timing rules (no-trade windows, routine checkpoints, session reminders) and enable notifications (where supported) so your routine stays consistent under pressure.',
    },
    {
        title: 'Trustworthy, lightweight delivery',
        body:
            'Lean, crawlable marketing pages for SEO, and dedicated interactive workspaces (/clock and /calendar) for daily use—built to stay fast, readable, and mobile-first.',
    },
];

export default function Page() {
    return (
        <div className="page-shell__max">
            <header className="header" aria-label="Site navigation">
                <a className="logo" href="/" aria-label="Time 2 Trade home">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </a>

                <nav className="nav" aria-label="Primary">
                    <a href="/clock" aria-label="Open the session clock">
                        Open clock
                    </a>
                    <a href="/calendar" aria-label="Open the economic calendar">
                        Open calendar
                    </a>
                    <a href="/" aria-label="Return to landing page">
                        Home
                    </a>
                </nav>
            </header>

            <main>
                <section className="section" aria-labelledby="about-heading">
                    <h1 id="about-heading" className="heading-xl">
                        About Time 2 Trade
                    </h1>
                    <p className="text-lead">
                        Time 2 Trade is an intraday timing workspace for futures and forex day traders: a{' '}
                        <strong>Session Clock + Economic Calendar (NY Time)</strong>. It pairs session context and countdowns with a{' '}
                        <strong>Forex Factory-powered</strong> calendar, plus custom events and notifications, so you can make timing decisions
                        with clarity—not guesses.
                    </p>
                </section>

                <section className="section" aria-labelledby="mission-heading">
                    <h2 id="mission-heading" className="heading-lg">
                        Why we built it
                    </h2>
                    <p className="text-lead">
                        Intraday trading moves fast. But most traders still waste focus on the same friction: timezone confusion, missed session
                        transitions, and surprise volatility from scheduled releases. Time 2 Trade exists to remove that friction—so you can
                        execute a repeatable routine next to your charts.
                    </p>
                    <p className="text-lead" style={{ marginTop: 12 }}>
                        This is not a signal tool. It’s a timing layer built for awareness: sessions + scheduled catalysts + your personal rules.
                    </p>
                </section>

                <section className="section" aria-labelledby="pillar-heading">
                    <h2 id="pillar-heading" className="heading-lg">
                        What guides the product
                    </h2>
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

                <section className="section" aria-labelledby="founder-heading">
                    <h2 id="founder-heading" className="heading-lg">
                        Founder note (non-personal)
                    </h2>
                    <p className="text-lead">
                        Time 2 Trade is built by an independent founder with a product philosophy centered on enterprise-grade practices:
                        predictable UX, mobile-first performance, secure-by-default architecture, and copy that avoids hype. The goal is to ship a
                        tool traders can trust daily—clear, consistent, and focused on timing.
                    </p>
                    <p className="text-lead" style={{ marginTop: 12 }}>
                        The product is intentionally narrow: it aims to be the fastest way to answer “where are we in the trading day?” and “what’s
                        coming next?”—without turning into a noisy dashboard.
                    </p>
                </section>

                <section className="section" aria-labelledby="cta-heading">
                    <h2 id="cta-heading" className="heading-lg">
                        Start with the clock, then check the calendar
                    </h2>
                    <p className="text-lead">
                        Use guest mode for immediate value. Create a free account if you want to sync preferences and personalize your workflow
                        with favorites, notes, reminders, and custom events.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-primary" href="/clock" aria-label="Launch the session clock">
                            Open the clock
                        </a>
                        <a className="btn btn-secondary" href="/calendar" aria-label="Open the economic calendar">
                            Open the calendar
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label="Return to landing page">
                            Back to home
                        </a>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div
                    className="page-shell__max"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center',
                    }}
                >
                    <a className="logo" href="/" aria-label="Time 2 Trade footer home">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </a>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/clock" aria-label="Open the clock from footer">
                            Open clock
                        </a>
                        <a className="btn btn-secondary" href="/calendar" aria-label="Open the calendar from footer">
                            Open calendar
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label="Go to landing page">
                            Home
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
