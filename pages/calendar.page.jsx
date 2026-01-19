/**
 * pages/calendar.page.jsx
 * 
 * Purpose: SEO-forward /calendar route that prerenders semantic copy then hydrates the
 * interactive CalendarPage (EventsFilters3 + day-grouped table) on the client.
 * 
 * Changelog:
 * v1.1.1 - 2026-01-16 - Updated calendar CTAs to point to /clock.
 * v1.1.0 - 2026-01-11 - Prefetch CalendarPage module to reduce TTI and reuse a shared loader for hydration.
 * v1.0.2 - 2026-01-07 - Added sticky back-to-top control for the prerendered calendar route fallback.
 * v1.0.1 - 2026-01-07 - Added dynamic copyright year to prerendered calendar content.
 * v1.0.0 - 2026-01-06 - Added calendar route with structured data and client-loaded calendar workspace.
 */

import { useEffect, useMemo, useState } from 'react';

let calendarPageModulePromise;

const loadCalendarPageModule = () => {
    if (!calendarPageModulePromise) {
        calendarPageModulePromise = import('../src/components/CalendarPage');
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
        question: 'Does the calendar use the trusted Forex Factory data source?',
        answer: 'Yes. Time 2 Trade consumes the same high-confidence data traders rely on, with faster filters and modern UI.',
    },
    {
        question: 'Is the default range really This Week?',
        answer: 'Yes. The calendar seeds to This Week on first load, then remembers your last preset and filters.',
    },
    {
        question: 'Can I embed the calendar elsewhere in the app?',
        answer: 'The calendar surface is embeddable; reuse the CalendarEmbed component to drop it into other pages.',
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
    description: 'Forex Factory-powered economic calendar with today\'s session clock context, impact and currency filters, favorites, notes, and exports.',
    primaryImageOfPage: ogImage,
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Free Economic Calendar | Forex Factory + Session Clock',
    description:
        'Free economic calendar for forex and futures traders. Forex Factory data with session clock context, impact/currency filters, favorites, notes, and exports. This Week default preset.',
    canonical: `${siteUrl}/calendar`,
    robots: 'index,follow',
    ogImage,
    ogType: 'website',
    structuredData: [calendarSchema, faqSchema],
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
                        <p className="badge" aria-hidden="true">Economic Calendar</p>
                        <h1 id="calendar-hero-heading" className="heading-lg">Modern Forex Factory-style calendar for day traders</h1>
                        <p className="text-lead">
                            Time 2 Trade keeps the trusted data source traders expect and wraps it in a fast, two-panel layout with impact and currency filters, search, and a This Week default.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <a className="btn btn-primary" href="#calendar" aria-label="Skip to calendar filters">Jump to calendar</a>
                            <a className="btn btn-secondary" href="/clock" aria-label="Open the trading clock">Open the clock</a>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="muted-chip">This Week default preset</span>
                            <span className="muted-chip">Impact & currency filters</span>
                            <span className="muted-chip">Day grouping with empty state</span>
                        </div>
                    </section>

                    <section className="section" aria-labelledby="calendar-faq-heading">
                        <h2 id="calendar-faq-heading" className="heading-md">Economic calendar FAQs</h2>
                        {faqEntries.map((faq) => (
                            <article className="faq" key={faq.question}>
                                <h3 className="heading-sm">{faq.question}</h3>
                                <p>{faq.answer}</p>
                            </article>
                        ))}
                    </section>

                    <footer className="section" aria-label="Legal">
                        <p className="text-muted">© {currentYear} Time 2 Trade. All rights reserved.</p>
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
                            border: '1px solid rgba(255,255,255,0.18)',
                            backgroundColor: '#0F172A',
                            color: '#ffffff',
                            boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
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
