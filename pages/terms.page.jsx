/**
 * pages/terms.page.jsx
 * 
 * Purpose: Terms & Conditions page describing acceptable use, disclaimers,
 * and AdSense disclosure required for Time 2 Trade.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-07 - Added Terms & Conditions with trading and advertising disclaimers.
 */

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_3.PNG`;

const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions | Time 2 Trade',
    url: `${siteUrl}/terms`,
    description: 'Terms & Conditions for Time 2 Trade, including acceptable use, disclaimers, and ad disclosures.',
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Terms & Conditions | Time 2 Trade',
    description: 'Read the Time 2 Trade Terms & Conditions, disclaimers, and acceptable use policies.',
    canonical: `${siteUrl}/terms`,
    robots: 'index,follow',
    ogImage,
    structuredData: [termsSchema],
};

const items = [
    {
        title: 'Use of the service',
        text: 'Time 2 Trade is for informational use only. You agree not to misuse the platform, scrape data, or attempt unauthorized access.',
    },
    {
        title: 'No financial advice',
        text: 'We provide timing and awareness tools (sessions and economic events). We do not provide trading signals or financial advice.',
    },
    {
        title: 'Accounts and data',
        text: 'If you create an account, keep your credentials secure. You can delete your account at any time, and we will remove associated settings/notes.',
    },
    {
        title: 'Advertising disclosure',
        text: 'We use Google AdSense. Ads may use cookies when you opt in via the cookie banner. Essential-only mode disables ad cookies.',
    },
    {
        title: 'Liability',
        text: 'We are not liable for trading losses or interruptions. The service is provided “as is” without warranties.',
    },
    {
        title: 'Contact',
        text: 'Contact compliance@time2.trade with questions about these terms.',
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
                    <a href="/app">Open app</a>
                    <a href="/">Home</a>
                </nav>
            </header>

            <section className="section" aria-labelledby="terms-heading">
                <p className="badge" aria-hidden="true">Terms & Conditions</p>
                <h1 id="terms-heading" className="heading-xl">Know the rules and disclosures</h1>
                <p className="text-lead">
                    Please read these terms before using Time 2 Trade. We focus on clarity, safety, and compliance so you can decide whether our tools fit your workflow.
                </p>
            </section>

            <section className="section" aria-labelledby="terms-list">
                <h2 id="terms-list" className="heading-lg">Key terms</h2>
                <div className="feature-grid">
                    {items.map((item) => (
                        <div className="card" key={item.title} style={{ padding: '16px' }}>
                            <h3 className="heading-md">{item.title}</h3>
                            <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>{item.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" aria-labelledby="jurisdiction">
                <h2 id="jurisdiction" className="heading-lg">Jurisdiction & updates</h2>
                <p className="text-lead">
                    These terms are governed by U.S. law. We may update them as we ship new features. We will note material changes in the changelog and on this page.
                </p>
            </section>

            <footer className="footer" aria-label="Footer">
                <div className="page-shell__max" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <div className="logo" aria-label="Time 2 Trade footer">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/privacy">Privacy</a>
                        <a className="btn btn-secondary" href="/">Home</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
