/**
 * pages/about.page.jsx
 *
 * Purpose: Prerendered About page for Time 2 Trade with semantic content,
 * structured data, and lean markup for SEO and accessibility.
 *
 * Changelog:
 * v1.5.0 - 2026-02-03 - BEP I18N: Converted all hardcoded strings to i18n translation keys.
 *                       Added useTranslation hook with 'pages' namespace. All pillars, headings, nav items,
 *                       and body copy now use t() calls. Supports full EN/ES/FR localization per BEP standards.
 * v1.4.0 - 2026-02-02 - BEP: Added Privacy & Advertising section with Meta Pixel + AdSense disclosure.
 *                       Updated pillar copy to mention consent-based tracking approach.
 * v1.3.0 - 2026-02-02 - BEP SEO FIX: Added BreadcrumbList schema to help Google understand site
 *                       hierarchy and prioritize crawling. Addresses "Discovered - currently not indexed" GSC status.
 * v1.2.0 - 2026-01-22 - Updated positioning to match BEP SEO: Trading Clock + Forex Factory-powered economic calendar (NY time),
 *                       added custom events + notifications pillars, removed “overlaps/PWA install/JBlanked” claims, added /calendar CTAs,
 *                       expanded structured data (WebPage + WebApplication).
 * v1.1.0 - 2026-01-16 - Updated /clock CTAs and refreshed About meta title/description.
 * v1.0.0 - 2025-12-18 - Initial SSR About page implementation.
 */

import { useTranslation } from 'react-i18next';

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

// BEP SEO: BreadcrumbList helps Google understand site hierarchy and prioritize crawling
const aboutBreadcrumbSchema = {
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
            name: 'About',
            item: `${siteUrl}/about`,
        },
    ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'About Time 2 Trade | Trading Clock + Forex Factory Calendar (NY Time)',
    description:
        'Why Time 2 Trade exists: a NY-time-first session clock with countdowns plus a Forex Factory-powered economic calendar, custom events, and notifications for intraday futures and forex traders.',
    canonical: `${siteUrl}/about`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    structuredData: [aboutWebPageSchema, aboutAppSchema, aboutBreadcrumbSchema],
};

export default function Page() {
    const { t } = useTranslation('pages');

    // Get pillar data from i18n
    const pillars = [
        {
            key: 'session-clarity',
            title: t('about.pillars.sessionClarity.title'),
            body: t('about.pillars.sessionClarity.body'),
        },
        {
            key: 'event-awareness',
            title: t('about.pillars.eventAwareness.title'),
            body: t('about.pillars.eventAwareness.body'),
        },
        {
            key: 'custom-events',
            title: t('about.pillars.customEvents.title'),
            body: t('about.pillars.customEvents.body'),
        },
        {
            key: 'privacy-first',
            title: t('about.pillars.privacyFirst.title'),
            body: t('about.pillars.privacyFirst.body'),
        },
    ];

    return (
        <div className="page-shell__max">
            <header className="header" aria-label={t('common:navigation.siteNavigation')}>
                <a className="logo" href="/" aria-label={t('about.header.logoAlt')}>
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </a>

                <nav className="nav" aria-label={t('common:navigation.primary')}>
                    <a href="/clock" aria-label={t('about.header.clockAlt')}>
                        {t('about.header.openClock')}
                    </a>
                    <a href="/calendar" aria-label={t('about.header.calendarAlt')}>
                        {t('about.header.openCalendar')}
                    </a>
                    <a href="/" aria-label={t('about.header.homeAlt')}>
                        {t('about.header.home')}
                    </a>
                </nav>
            </header>

            <main>
                <section className="section" aria-labelledby="about-heading">
                    <h1 id="about-heading" className="heading-xl">
                        {t('about.hero.heading')}
                    </h1>
                    <p className="text-lead">
                        {t('about.hero.description')}
                    </p>
                </section>

                <section className="section" aria-labelledby="mission-heading">
                    <h2 id="mission-heading" className="heading-lg">
                        {t('about.mission.heading')}
                    </h2>
                    <p className="text-lead">
                        {t('about.mission.description')}
                    </p>
                    <p className="text-lead" style={{ marginTop: 12 }}>
                        {t('about.mission.descriptionContinued')}
                    </p>
                </section>

                <section className="section" aria-labelledby="pillar-heading">
                    <h2 id="pillar-heading" className="heading-lg">
                        {t('about.pillars.heading')}
                    </h2>
                    <div className="feature-grid">
                        {pillars.map((pillar) => (
                            <div className="card" key={pillar.key} style={{ padding: '18px' }}>
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
                        {t('about.founder.heading')}
                    </h2>
                    <p className="text-lead">
                        {t('about.founder.description')}
                    </p>
                    <p className="text-lead" style={{ marginTop: 12 }}>
                        {t('about.founder.descriptionContinued')}
                    </p>
                </section>

                <section className="section" aria-labelledby="cta-heading">
                    <h2 id="cta-heading" className="heading-lg">
                        {t('about.cta.heading')}
                    </h2>
                    <p className="text-lead">
                        {t('about.cta.description')}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-primary" href="/clock" aria-label={t('about.cta.clockAlt')}>
                            {t('about.cta.openClock')}
                        </a>
                        <a className="btn btn-secondary" href="/calendar" aria-label={t('about.cta.calendarAlt')}>
                            {t('about.cta.openCalendar')}
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label={t('about.cta.homeAlt')}>
                            {t('about.cta.backHome')}
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
                    <a className="logo" href="/" aria-label={t('about.footer.logoAlt')}>
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </a>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/clock" aria-label={t('about.footer.clockAlt')}>
                            {t('about.footer.openClock')}
                        </a>
                        <a className="btn btn-secondary" href="/calendar" aria-label={t('about.footer.calendarAlt')}>
                            {t('about.footer.openCalendar')}
                        </a>
                        <a className="btn btn-secondary" href="/" aria-label={t('about.footer.homeAlt')}>
                            {t('about.footer.home')}
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

