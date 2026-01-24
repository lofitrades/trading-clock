/**
 * pages/terms.page.jsx
 *
 * Purpose: Terms & Conditions page describing acceptable use, disclaimers,
 * and AdSense disclosure required for Time 2 Trade.
 *
 * Changelog:
 * v1.1.0 - 2026-01-22 - BEP upgrade:
 *   - Align language with "Session Clock + Economic Calendar (NY Time)"
 *   - Expand acceptable use (anti-scrape, rate limits, automation)
 *   - Add IP/content/data accuracy disclaimers and third-party data notice
 *   - Clarify account responsibilities, content ownership (notes/custom events), termination
 *   - Tighten AdSense/cookie consent language and link to Privacy
 *   - Add governing law/jurisdiction wording without overclaiming
 * v1.0.1 - 2026-01-16 - Updated primary CTA to /clock.
 * v1.0.0 - 2026-01-07 - Added Terms & Conditions with trading and advertising disclaimers.
 */

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;
const lastUpdated = 'January 22, 2026';

const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions | Time 2 Trade',
    url: `${siteUrl}/terms`,
    description:
        'Terms & Conditions for Time 2 Trade, including acceptable use, disclaimers, third-party data notice, and advertising disclosure.',
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Terms & Conditions | Time 2 Trade',
    description:
        'Read the Time 2 Trade Terms & Conditions, acceptable use rules, disclaimers, and advertising disclosures.',
    canonical: `${siteUrl}/terms`,
    robots: 'index,follow',
    ogImage,
    structuredData: [termsSchema],
};

const items = [
    {
        title: '1) Acceptance of terms',
        text:
            'By accessing or using Time 2 Trade, you agree to these Terms. If you do not agree, do not use the service.',
    },
    {
        title: '2) What the service is',
        text:
            'Time 2 Trade is a Session Clock + Economic Calendar (NY Time) workspace designed to help you visualize market sessions, overlaps, countdowns, and scheduled economic events. It is informational software only.',
    },
    {
        title: '3) No financial advice / no signals',
        text:
            'Time 2 Trade does not provide trading signals, investment recommendations, or financial advice. Any decisions you make based on the service are your responsibility.',
    },
    {
        title: '4) Third-party data and accuracy',
        text:
            'Economic events and related metadata may be retrieved from third-party sources. We aim for reliable sync and correct timezone math, but we do not guarantee completeness, accuracy, or uninterrupted availability of third-party data.',
    },
    {
        title: '5) Acceptable use',
        text:
            'You agree not to misuse the platform, including: attempting unauthorized access; interfering with service stability; reverse engineering where prohibited; scraping, crawling, or harvesting data without permission; bypassing rate limits; or using automated tools that materially degrade performance for others.',
    },
    {
        title: '6) Accounts and security',
        text:
            'If you create an account, you are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us if you suspect unauthorized access.',
    },
    {
        title: '7) Your content (notes, favorites, custom events)',
        text:
            'You may create personal content such as notes, favorites, and custom events. You retain ownership of your content. You grant us a limited license to store, process, and display it solely to provide and improve the service.',
    },
    {
        title: '8) Privacy and cookies',
        text:
            'Our data handling practices are described in the Privacy Policy. Cookie and local storage usage may include essential functionality and optional advertising cookies depending on your consent choices.',
    },
    {
        title: '9) Advertising disclosure (Google AdSense)',
        text:
            'We may display Google AdSense ads. Ads may use cookies and similar technologies when you opt in via the cookie banner. Essential-only mode disables optional ad cookies (where applicable).',
    },
    {
        title: '10) Availability and changes',
        text:
            'We may modify, suspend, or discontinue any part of the service at any time. We may also update these Terms as we ship changes, and will update the “Last updated” date on this page.',
    },
    {
        title: '11) Termination',
        text:
            'We may suspend or terminate access if we reasonably believe you violated these Terms, used the service in a way that risks security, or materially harms platform reliability. You can stop using the service at any time.',
    },
    {
        title: '12) Disclaimers',
        text:
            'The service is provided “as is” and “as available” without warranties of any kind, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement to the maximum extent permitted by law.',
    },
    {
        title: '13) Limitation of liability',
        text:
            'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for trading losses, data loss, or business interruption arising from your use of the service.',
    },
    {
        title: '14) Governing law',
        text:
            'These Terms are governed by applicable laws in the United States, without regard to conflict-of-law principles. Venue and jurisdiction will be determined based on our operating location and applicable law.',
    },
    {
        title: '15) Contact',
        text:
            'Questions about these Terms: compliance@time2.trade',
    },
];

export default function Page() {
    return (
        <div className="page-shell__max" role="main">
            <header className="header" aria-label="Terms navigation">
                <div className="logo" aria-label="Time 2 Trade">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <a href="/clock">Open clock</a>
                    <a href="/">Home</a>
                </nav>
            </header>

            <section className="section" aria-labelledby="terms-heading">
                <p className="badge" aria-hidden="true">Terms &amp; Conditions</p>
                <h1 id="terms-heading" className="heading-xl">Terms &amp; Conditions</h1>
                <p className="text-lead" style={{ marginBottom: '8px' }}>
                    Last updated: {lastUpdated}
                </p>
                <p className="text-lead">
                    Please read these terms before using Time 2 Trade. We focus on clarity, safety,
                    and compliance so you can decide whether our tools fit your workflow.
                </p>
            </section>

            <section className="section" aria-labelledby="terms-list">
                <h2 id="terms-list" className="heading-lg">Key terms</h2>
                <div className="feature-grid">
                    {items.map((item) => (
                        <div className="card" key={item.title} style={{ padding: '16px' }}>
                            <h3 className="heading-md">{item.title}</h3>
                            <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" aria-labelledby="cta">
                <h2 id="cta" className="heading-lg">Use the product</h2>
                <p className="text-lead">
                    If you agree with these terms, you can open the Session Clock + Economic Calendar now.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" href="/clock" aria-label="Open the trading clock">
                        Open clock
                    </a>
                    <a className="btn btn-secondary" href="/privacy" aria-label="Read the privacy policy">
                        Privacy policy
                    </a>
                </div>
            </section>

            <footer className="footer" aria-label="Footer">
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
                    <div className="logo" aria-label="Time 2 Trade footer">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/privacy">
                            Privacy
                        </a>
                        <a className="btn btn-secondary" href="/">
                            Home
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
