/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: SEO-optimized marketing landing page for Time 2 Trade.
 * Converted from SSR page with semantic HTML, FAQ schema, and clear CTAs.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-18 - Converted from pages/index.page.jsx for SPA routing.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const faqEntries = [
    {
        question: 'How does Time 2 Trade handle overlapping sessions and midnight crossovers?',
        answer:
            'Sessions are plotted on a dual-circle 24h clock with strict timezone math, so overlapping ranges and midnight crossovers stay accurate whether you trade NY, London, or Asia rotations.',
    },
    {
        question: 'Can I overlay high-impact economic events on the clock?',
        answer:
            'Yes. The app pulls the latest economic calendar events and can pin them as markers on the analog clock and timeline, so you see session context and catalysts together.',
    },
    {
        question: 'Does it adapt to my timezone automatically?',
        answer:
            'The app detects your local timezone on first load and lets you override it at any time. All session arcs, countdowns, and event timestamps adjust instantly.',
    },
    {
        question: 'Is this mobile-friendly for deskless trading?',
        answer:
            'The UI scales from phones to ultrawide monitors with viewport-aware sizing, safe-area spacing, and responsive controls for quick session checks on the go.',
    },
    {
        question: 'Are my settings saved to the cloud?',
        answer:
            'Yes. When signed in, preferences sync to Firestore; guests fall back to local storage so your layout, sessions, and filters persist between visits.',
    },
];

const features = [
    {
        title: 'Sessions that stay honest',
        body: 'Dual-circle AM/PM clock with midnight-safe logic keeps London, New York, and Asia windows accurate in every timezone.',
    },
    {
        title: 'Events in context',
        body: 'Overlay economic releases directly on the clock and timeline so you can see catalysts without leaving your layout.',
    },
    {
        title: 'Timezones without friction',
        body: 'Auto-detect your location, switch instantly, and keep countdowns aligned when you travel or shift schedules.',
    },
    {
        title: 'Your layout, saved',
        body: 'Cloud sync for signed-in users, local persistence for guests, so session presets and filters stick every session.',
    },
];

const highlights = [
    { label: 'Session presets', value: '8 slots', hint: 'NY, London, Asia + customs' },
    { label: 'Economic events', value: '12,966+', hint: 'JBlanked source with impacts' },
    { label: 'Refresh cadence', value: '1s', hint: 'Clock ticks without jitter' },
    { label: 'Form factor', value: 'Mobile → Desk', hint: 'Viewport-aware sizing' },
];

export default function LandingPage() {
    useEffect(() => {
        document.title = 'Time 2 Trade | Visual trading workspace for futures and forex day traders';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'Time 2 Trade is a visual trading workspace for futures and forex day traders: dual-circle session clock, economic events overlay, timezone-aware countdowns, and synced settings.');
        }
    }, []);

    return (
        <div className="page-shell__max">
            <header className="header" aria-label="Site navigation">
                <div className="logo" aria-label="Time 2 Trade home">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <Link to="/app" aria-label="Open the trading clock app">Open app</Link>
                    <Link to="/about" aria-label="Learn about Time 2 Trade">About</Link>
                    <a href="#faq" aria-label="Read frequently asked questions">FAQ</a>
                </nav>
            </header>

            <main>
                <section className="section" aria-labelledby="hero-heading">
                    <div className="hero-grid">
                        <div>
                            <div className="badge" aria-label="Product focus">
                                <span aria-hidden="true">●</span>
                                Sessions • Events • Timezones
                            </div>
                            <h1 id="hero-heading" className="heading-xl">
                                Visual trading clock for futures & forex sessions
                            </h1>
                            <p className="text-lead">
                                See market sessions, high-impact economic events, and timezone-aware countdowns in one view. Built for day traders who need a fast, honest read on what is active right now.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <Link className="btn btn-primary" to="/app" aria-label="Open the Time 2 Trade app">
                                    Open the app
                                </Link>
                                <Link className="btn btn-secondary" to="/about" aria-label="Learn more about Time 2 Trade">
                                    Learn more
                                </Link>
                            </div>
                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span className="muted-chip">Dual-circle AM/PM clock</span>
                                <span className="muted-chip">Economic events overlay</span>
                                <span className="muted-chip">Timezone-smart timers</span>
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
                    <h2 id="benefits-heading" className="heading-lg">Built for intraday futures and forex workflows</h2>
                    <p className="text-lead">
                        Track overlapping sessions, stay ahead of catalysts, and keep your timezone consistent whether you are trading from New York, London, or on the move.
                    </p>
                    <div className="feature-grid">
                        {features.map((feature) => (
                            <div className="card" key={feature.title} style={{ padding: '18px' }}>
                                <h3 className="heading-md">{feature.title}</h3>
                                <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>
                                    {feature.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="section" aria-labelledby="faq-heading" id="faq">
                    <h2 id="faq-heading" className="heading-lg">FAQs</h2>
                    {faqEntries.map((faq) => (
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
                            <Link to="/app" aria-label="Launch the app from footer" className="btn btn-secondary">Open app</Link>
                            <Link to="/about" aria-label="Read about Time 2 Trade" className="btn btn-secondary">About</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
