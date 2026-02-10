/**
 * pages/calendar.page.jsx
 *
 * Purpose: SEO-forward /calendar route that prerenders semantic copy then hydrates the
 * interactive Calendar2Page (fast table + clock sidebar) on the client.
 *
 * Changelog:
 * v1.4.0 - 2026-02-07 - MIGRATION: Updated to hydrate Calendar2Page. Prerender shell, meta tags,
 *                       structured data, and SEO metadata unchanged. Module import updated.
 * v1.3.0 - 2026-02-02 - BEP SEO FIX: Added BreadcrumbList schema to help Google understand site
 *                       hierarchy and prioritize crawling. Addresses "Discovered - currently not indexed" GSC status.
 * v1.2.0 - 2026-01-22 - BEP SEO/copy refresh: align with "Trading Clock + Economic Calendar (NY Time)",
 *                       emphasize Forex Factory-powered events, custom events + notifications, remove "exports" from primary claims,
 *                       improve FAQ for trust + non-advice positioning, and add /clock + /calendar CTA parity.
 * v1.1.1 - 2026-01-16 - Updated calendar CTAs to point to /clock.
 * v1.1.0 - 2026-01-11 - Prefetch Calendar2Page module to reduce TTI and reuse a shared loader for hydration.
 * v1.0.2 - 2026-01-07 - Added sticky back-to-top control for the prerendered calendar route fallback.
 * v1.0.1 - 2026-01-07 - Added dynamic copyright year to prerendered calendar content.
 * v1.0.0 - 2026-01-06 - Added calendar route with structured data and client-loaded calendar workspace.
 */

import { useEffect, useMemo, useState } from 'react';

let calendarPageModulePromise;

const loadCalendarPageModule = () => {
    if (!calendarPageModulePromise) {
        calendarPageModulePromise = import('../src/pages/Calendar2Page');
    }
    return calendarPageModulePromise;
};

const siteUrl = 'https://time2.trade';
const currentYear = new Date().getFullYear();
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;

export const route = '/calendar';
export const prerender = true;

const faqEntries = [
    {
        question: 'Is this calendar powered by the Forex Factory data traders trust?',
        answer:
            'Yes. Time 2 Trade uses a Forex Factory-powered economic events feed and presents it in a modern, fast UI built for intraday workflows.',
    },
    {
        question: 'What timezone are events shown in?',
        answer:
            'Time 2 Trade is New York time-first by default, because most intraday education references NY time. You can switch timezones anytime and the calendar stays consistent.',
    },
    {
        question: 'Can I filter to only the events I care about (like USD high-impact)?',
        answer:
            'Yes. Use impact and currency filters (plus search) to quickly narrow to what matters for your instruments and your routine.',
    },
    {
        question: 'Can I add my own custom events and reminders?',
        answer:
            'Yes. Create custom events to define personal timing rules (no-trade windows, session reminders, prep checkpoints). Notifications are supported where available.',
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

const calendarSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Economic Calendar | Time 2 Trade',
    url: `${siteUrl}/calendar`,
    description:
        "Forex Factory-powered economic calendar with New York time-first session context, impact/currency filters, custom events, and reminders for intraday futures and forex traders.",
    primaryImageOfPage: ogImage,
    publisher: { '@type': 'Organization', name: 'Lofi Trades', url: siteUrl },
};

// BEP SEO: BreadcrumbList helps Google understand site hierarchy and prioritize crawling
const calendarBreadcrumbSchema = {
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
            name: 'Economic Calendar',
            item: `${siteUrl}/calendar`,
        },
    ],
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Free Economic Calendar | Forex Factory-Powered (NY Time)',
    description:
        'Free economic calendar for forex and futures day traders. Forex Factory-powered events with NY time-first context, fast impact/currency filters, custom events, and reminders.',
    canonical: `${siteUrl}/calendar`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    ogType: 'website',
    structuredData: [calendarSchema, faqSchema, calendarBreadcrumbSchema],
};

export default function Page() {
    const [ClientPage, setClientPage] = useState(null);
    const [showBackToTop, setShowBackToTop] = useState(false);

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const module = await loadCalendarPageModule();
            if (!cancelled) {
                setClientPage(() => module.default);
            }
        };

        // Kick off a prefetch as soon as possible without blocking paint
        if (typeof window !== 'undefined') {
            const prefetch = () => loadCalendarPageModule().catch(() => null);
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(prefetch, { timeout: 1200 });
            } else {
                window.setTimeout(prefetch, 120);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (ClientPage) return undefined;

        const handleScroll = () => {
            const viewportHeight = document.documentElement?.clientHeight || window.innerHeight || 0;
            const threshold = viewportHeight * 0.3;
            const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
            setShowBackToTop(scrolled > threshold);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [ClientPage]);

    if (!ClientPage) {
        return (
            <>
                <div className="page-shell__max" role="main">
                    <section className="section" aria-labelledby="calendar-hero-heading">
                        <p className="badge" aria-hidden="true">
                            Economic Calendar
                        </p>

                        <h1 id="calendar-hero-heading" className="heading-lg">
                            Forex Factory-powered economic calendar with NY time-first clarity
                        </h1>

                        <p className="text-lead">
                            Built for intraday futures and forex traders who need fast answers: what’s coming next, how important is it, and how
                            close are we to the next catalyst? Filter by impact and currency, add your own custom events, and set reminders to keep a
                            consistent routine.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <a className="btn btn-primary" href="#calendar" aria-label="Skip to calendar filters">
                                Jump to calendar
                            </a>
                            <a className="btn btn-secondary" href="/clock" aria-label="Open the session clock">
                                Open the clock
                            </a>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="muted-chip">NY time-first</span>
                            <span className="muted-chip">Impact & currency filters</span>
                            <span className="muted-chip">Custom events</span>
                            <span className="muted-chip">Reminders / notifications</span>
                            <span className="muted-chip">Day-grouped view</span>
                        </div>

                        <p className="text-muted" style={{ marginTop: 14 }}>
                            Not financial advice. Time 2 Trade provides timing and awareness for sessions and scheduled events.
                        </p>
                    </section>

                    <section className="section" aria-labelledby="calendar-faq-heading">
                        <h2 id="calendar-faq-heading" className="heading-md">
                            Economic calendar FAQs
                        </h2>

                        {faqEntries.map((faq) => (
                            <article className="faq" key={faq.question}>
                                <h3 className="heading-sm">{faq.question}</h3>
                                <p>{faq.answer}</p>
                            </article>
                        ))}
                    </section>

                    <footer className="section" aria-label="Legal">
                        <p className="text-muted">© {currentYear} Time 2 Trade. All rights reserved.</p>
                        <p className="text-muted">Not financial advice. Trading involves risk and may not be suitable for all investors.</p>
                    </footer>
                </div>

                {showBackToTop && (
                    <button
                        type="button"
                        aria-label="Back to top"
                        onClick={() => {
                            const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                            window.scrollTo({ top: 0, behavior });
                        }}
                        style={{
                            position: 'fixed',
                            right: '16px',
                            bottom: '18px',
                            width: '48px',
                            height: '48px',
                            borderRadius: '999px',
                            border: '1px solid var(--t2t-divider, rgba(255,255,255,0.18))',
                            backgroundColor: 'var(--t2t-text-primary, #0F172A)',
                            color: 'var(--t2t-bg-paper, #ffffff)',
                            boxShadow: '0 12px 32px var(--t2t-action-hover, rgba(15,23,42,0.26))',
                            cursor: 'pointer',
                        }}
                    >
                        <span aria-hidden="true" style={{ fontSize: '20px', lineHeight: 1 }}>
                            ↑
                        </span>
                    </button>
                )}
            </>
        );
    }

    return <ClientPage />;
}
