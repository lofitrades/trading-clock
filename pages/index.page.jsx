/**
 * pages/index.page.jsx
 *
 * Purpose: SEO-first landing page for Time 2 Trade. Delivers fully
 * prerendered HTML with semantic copy, FAQ schema, and clear CTAs for
 * launching the market clock or learning more.
 *
 * Changelog:
 * v2.4.0 - 2026-02-21 - BEP: Changed primary CTA and SoftwareApplication schema URL from /clock to /calendar.
 *                       Calendar is now the primary app destination. Nav and footer links updated.
 * v2.3.0 - 2026-02-02 - BEP SEO FIX: Added SiteNavigationElement schema to explicitly declare site
 *                       navigation structure. Helps Google prioritize crawling of pages flagged as
 *                       "Discovered - currently not indexed" (/clock, /calendar, /terms).
 * v2.2.0 - 2026-02-02 - BEP SEO FIX: Removed SearchAction schema from WebSite structured data.
 *                       Google was indexing /?q={search_term_string} as an alternate page because
 *                       the schema declared search support that doesn't exist. Fixes GSC error:
 *                       "Alternate page with proper canonical tag" for search URL template.
 * v2.1.0 - 2026-01-24 - BEP optimizations: Removed unused hardcoded constants (features/highlights), 
 *                       added defensive null-coalescing for i18n data hydration, added sync warnings 
 *                       for faqEntries duplication, improved error resilience with .filter(Boolean).
 * v2.0.0 - 2026-01-24 - Migrated to i18n: Replaced 100+ hardcoded strings with t() calls from pages namespace.
 *                       Supports EN/ES/FR languages with full translations for hero, features, benefits, FAQ, and navigation.
 * v1.2.0 - 2026-01-22 - BEP copy + schema refresh: align hero with "Market Clock + Economic Calendar",
 *                       prioritize Forex Factory-powered events, custom events, and reminders/notifications.
 *                       Removed overlaps/PWA/export from "main feature" positioning (kept secondary where helpful).
 * v1.1.0 - 2026-01-16 - Updated /clock CTAs and refreshed home meta/title lengths.
 * v1.0.0 - 2025-12-18 - Initial SSR landing page implementation.
 */

import { useTranslation } from 'react-i18next';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;
// FAQ entries for schema.org FAQPage schema generation
// ⚠️ SYNC ALERT: Keep in sync with i18n translations in src/i18n/locales/*/pages.json → landing.faq.entries
// Currently used for: faqSchema (structural data) + rendered FAQ section in component (uses i18n)
// TODO: SSR optimization - consider fetching from i18n context to eliminate duplication
const faqEntries = [
    {
        question: 'What is Time 2 Trade?',
        answer:
            'Time 2 Trade is a Market Clock + Economic Calendar for intraday futures and forex traders. It combines session timing, countdowns, and Forex Factory-powered economic events in one fast workspace.',
    },
    {
        question: 'Is the economic calendar powered by Forex Factory?',
        answer:
            'Yes. Time 2 Trade uses a Forex Factory-powered events feed and presents it with modern filtering and session context so you can spot high-impact releases without tab-hopping.',
    },
    {
        question: 'Can I create custom events and reminders?',
        answer:
            'Yes. You can add custom events (prep checkpoints, no-trade windows, session reminders) and use reminders/notifications where available to stay aligned with your routine.',
    },
    {
        question: 'Does it adapt to my timezone automatically?',
        answer:
            'The app detects your local timezone on first load and lets you switch at any time. All session windows, countdowns, and event timestamps update instantly.',
    },
    {
        question: 'Are my settings saved?',
        answer:
            'Yes. When signed in, preferences can sync to the cloud; guests fall back to local storage so your layout, sessions, and filters persist between visits.',
    },
];

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
};

const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Time 2 Trade',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
        'Market Clock + Economic Calendar for futures and forex day traders: session timing and countdowns, Forex Factory-powered events, custom events, reminders, timezone switching, and synced settings.',
    url: `${siteUrl}/calendar`,
    creator: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
    featureList: [
        'Market Clock (NY Time-first) with real-time countdowns',
        'Forex Factory-powered economic calendar with impact and currency filtering',
        'Custom events (prep checkpoints, reminders, no-trade windows)',
        'Reminders/notifications where available',
        'Timezone auto-detect and instant switching',
        'Saved preferences (cloud sync for accounts, local persistence for guests)',
        'Responsive UI for mobile and desktop',
    ],
    image: ogImage,
    screenshot: ogImage,
};

const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Time 2 Trade',
    url: siteUrl,
    // BEP SEO: Removed SearchAction - site doesn't have search functionality
    // Having SearchAction without actual search causes Google to index /?q={search_term_string}
    // as an alternate page, triggering "Alternate page with proper canonical tag" GSC error
};

// BEP SEO: SiteNavigationElement explicitly declares main navigation for Google
// Helps prioritize crawling of key pages marked as "Discovered - currently not indexed"
const siteNavigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
        {
            '@type': 'SiteNavigationElement',
            position: 1,
            name: 'Market Clock',
            description: 'Live market session clock with real-time countdowns and economic events',
            url: `${siteUrl}/clock`,
        },
        {
            '@type': 'SiteNavigationElement',
            position: 2,
            name: 'Economic Calendar',
            description: 'Forex Factory-powered economic calendar with filters and custom events',
            url: `${siteUrl}/calendar`,
        },
        {
            '@type': 'SiteNavigationElement',
            position: 3,
            name: 'About',
            description: 'Learn about Time 2 Trade and our mission for day traders',
            url: `${siteUrl}/about`,
        },
        {
            '@type': 'SiteNavigationElement',
            position: 4,
            name: 'Privacy Policy',
            description: 'How Time 2 Trade handles your data and privacy',
            url: `${siteUrl}/privacy`,
        },
        {
            '@type': 'SiteNavigationElement',
            position: 5,
            name: 'Terms & Conditions',
            description: 'Terms of use for Time 2 Trade market clock and calendar',
            url: `${siteUrl}/terms`,
        },
        {
            '@type': 'SiteNavigationElement',
            position: 6,
            name: 'Contact',
            description: 'Get in touch with Time 2 Trade for support or feedback',
            url: `${siteUrl}/contact`,
        },
    ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Time 2 Trade | Market Clock + Economic Calendar',
    description:
        'Market Clock + Economic Calendar for futures and forex day traders. Track session timing and countdowns, Forex Factory-powered events, custom events, and reminders in one fast workspace.',
    canonical: `${siteUrl}/`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    ogType: 'website',
    structuredData: [webSiteSchema, softwareSchema, faqSchema, siteNavigationSchema],
};

// This ensures single source of truth and enables multi-language support

export default function Page() {
    const { t } = useTranslation('pages');

    // Hydrate data from i18n with defensive null-coalescing
    const features = t('landing.features', { returnObjects: true }) ?? [];
    const faqEntries = t('landing.faq.entries', { returnObjects: true }) ?? [];
    const highlights = [
        { ...t('landing.highlights.product', { returnObjects: true }) },
        { ...t('landing.highlights.events', { returnObjects: true }) },
        { ...t('landing.highlights.custom', { returnObjects: true }) },
        { ...t('landing.highlights.form', { returnObjects: true }) }
    ].filter(Boolean); // Remove any undefined entries

    return (
        <div className="page-shell__max">
            <header className="header" aria-label="Site navigation">
                <div className="logo" aria-label="Time 2 Trade home">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <a href="/calendar" aria-label="Open the economic calendar">{t('landing.nav.openClock')}</a>
                    <a href="/calendar" aria-label="Open the economic calendar">{t('landing.nav.calendar')}</a>
                    <a href="/about" aria-label="Learn about Time 2 Trade">{t('landing.nav.about')}</a>
                    <a href="#faq" aria-label="Read frequently asked questions">{t('landing.nav.faq')}</a>
                </nav>
            </header>

            <main>
                <section className="section" aria-labelledby="hero-heading">
                    <div className="hero-grid">
                        <div>
                            <div className="badge" aria-label="Product focus">
                                <span aria-hidden="true">●</span>
                                {t('landing.badge')}
                            </div>

                            <h1 id="hero-heading" className="heading-xl">
                                {t('landing.hero.heading')}
                            </h1>

                            <p className="text-lead">
                                {t('landing.hero.subheading')}
                            </p>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <a className="btn btn-primary" href="/calendar" aria-label="Open the Time 2 Trade calendar">
                                    {t('landing.hero.cta1')}
                                </a>
                                <a className="btn btn-secondary" href="/calendar" aria-label="Open the economic calendar">
                                    {t('landing.hero.cta2')}
                                </a>
                                <a className="btn btn-secondary" href="/about" aria-label="Learn more about Time 2 Trade">
                                    {t('landing.hero.cta3')}
                                </a>
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {Array.isArray(t('landing.hero.chips', { returnObjects: true })) &&
                                    t('landing.hero.chips', { returnObjects: true }).map((chip, i) => (
                                        <span key={i} className="muted-chip">{chip}</span>
                                    ))}
                            </div>
                        </div>

                        <div className="hero-visual" aria-label="Key capabilities">
                            <div className="hero-visual__grid">
                                {highlights.map((item) => (
                                    <div className="hero-visual__item" key={item.label}>
                                        <p className="hero-visual__title">{item.label}</p>
                                        <p className="hero-visual__stat">{item.value}</p>
                                        <p className="hero-visual__hint">{item.hint}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" aria-labelledby="benefits-heading">
                    <h2 id="benefits-heading" className="heading-lg">
                        {t('landing.benefits.heading')}
                    </h2>
                    <p className="text-lead">
                        {t('landing.benefits.subheading')}
                    </p>

                    <div className="feature-grid">
                        {features && Array.isArray(features) && features.map((feature) => (
                            <div className="card" key={feature.title} style={{ padding: '18px' }}>
                                <h3 className="heading-md">{feature.title}</h3>
                                <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section" aria-labelledby="faq-heading" id="faq">
                    <h2 id="faq-heading" className="heading-lg">{t('landing.faq.heading')}</h2>
                    {faqEntries && Array.isArray(faqEntries) && faqEntries.map((faq) => (
                        <article className="faq" key={faq.question}>
                            <h3 className="heading-md" style={{ marginBottom: 6 }}>{faq.question}</h3>
                            <p>{faq.answer}</p>
                        </article>
                    ))}
                </section>
            </main>

            <footer className="footer">
                <div className="page-shell__max">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="logo" aria-label="Time 2 Trade footer">
                            <span className="logo__dot" aria-hidden="true" />
                            <span>Time 2 Trade</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <a href="/calendar" aria-label="Open the calendar from footer" className="btn btn-secondary">{t('landing.nav.openClock')}</a>
                            <a href="/calendar" aria-label="Open the calendar from footer" className="btn btn-secondary">{t('landing.nav.calendar')}</a>
                            <a href="/about" aria-label="Read about Time 2 Trade" className="btn btn-secondary">{t('landing.nav.about')}</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
