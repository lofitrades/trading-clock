/**
 * pages/privacy.page.jsx
 *
 * Purpose: Enterprise-grade Privacy Policy for Time 2 Trade with comprehensive
 * data collection disclosure, legal basis, third-party sharing, user rights,
 * and GDPR/CCPA-style transparency following Google-level best practices.
 *
 * Changelog:
 * v2.1.0 - 2026-01-22 - BEP compliance refresh:
 *   - Align product language with "Session Clock + Economic Calendar (NY Time)"
 *   - Clarify Forex Factory-powered events feed (no personal data shared)
 *   - Add Custom Events + Reminders/Notifications data handling
 *   - Add explicit cookie reset UX and consent update guidance
 *   - Tighten retention language + security wording for accuracy
 * v2.0.1 - 2026-01-16 - Updated primary CTA to /clock.
 * v2.0.0 - 2026-01-07 - Complete enterprise rewrite: specific data collection, legal basis, third-party disclosure, granular rights, retention timelines, international compliance.
 * v1.1.0 - 2026-01-07 - Rewrote privacy copy to enterprise-style, covering data use, AdSense, cookies, rights, and contact.
 * v1.0.0 - 2026-01-07 - Added privacy policy with AdSense disclosure and cookie details.
 */

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;
const lastUpdated = 'January 22, 2026';

const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy | Time 2 Trade',
    url: `${siteUrl}/privacy`,
    description:
        'Privacy policy for Time 2 Trade: what data we collect, why we process it, how we share it, retention, security, and your rights and choices.',
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Privacy Policy | Time 2 Trade',
    description:
        'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, legal bases for processing, retention timelines, and controls for consent, deletion, and ad personalization.',
    canonical: `${siteUrl}/privacy`,
    robots: 'index,follow',
    ogImage,
    structuredData: [privacySchema],
};

const sections = [
    {
        id: 'collection',
        heading: 'Information we collect',
        subsections: [
            {
                title: 'Information you provide',
                items: [
                    'Email address (for authentication and account recovery)',
                    'Display name and profile photo (optional)',
                    'Trading session preferences and clock settings',
                    'Economic calendar favorites and personal notes',
                    'Custom events you create (titles, times, tags/notes you add)',
                    'Reminder preferences (e.g., notification toggles, lead time), when supported',
                    'Timezone selection and display preferences',
                ],
            },
            {
                title: 'Information we collect automatically',
                items: [
                    'IP address and general location (country/region) derived for security and fraud prevention',
                    'Device type, browser type, and operating system',
                    'Session data and authentication tokens',
                    'Usage statistics (pages viewed, features used, session duration)',
                    'Error logs and diagnostic information',
                ],
            },
            {
                title: 'Information from third parties',
                items: [
                    'OAuth profile data (name, email, profile photo) when you sign in with Google or Twitter',
                    'Economic calendar event data from a Forex Factory-powered feed (market events only; no personal data shared)',
                ],
            },
        ],
    },
    {
        id: 'usage',
        heading: 'How we use information',
        subsections: [
            {
                title: 'Provide and maintain services',
                legalBasis: 'Contractual necessity',
                items: [
                    'Authenticate your account and maintain secure sessions',
                    'Sync your preferences and settings across devices',
                    'Display economic calendar events in your selected timezone',
                    'Store your favorites, notes, and custom events',
                    'Trigger reminders and notifications (where supported) based on your settings',
                ],
            },
            {
                title: 'Improve and develop features',
                legalBasis: 'Legitimate interest',
                items: [
                    'Analyze usage patterns to optimize performance',
                    'Identify and fix bugs and technical issues',
                    'Develop new features based on aggregated usage signals',
                    'Ensure service reliability and uptime',
                ],
            },
            {
                title: 'Advertising',
                legalBasis: 'Consent (for personalized ads)',
                items: [
                    'Display Google AdSense advertisements (where shown)',
                    'Measure ad performance and effectiveness',
                    'Deliver personalized ads when you allow them via cookie consent',
                    'Show non-personalized ads when you select essential-only cookies',
                ],
            },
            {
                title: 'Security and fraud prevention',
                legalBasis: 'Legitimate interest',
                items: [
                    'Detect abuse, spam, and fraudulent access attempts',
                    'Protect accounts and enforce rate limits',
                    'Monitor service health and suspicious activity',
                ],
            },
        ],
    },
    {
        id: 'sharing',
        heading: 'Information we share',
        subsections: [
            {
                title: 'Service providers',
                items: [
                    'Firebase Authentication (Google Cloud) - for account management',
                    'Cloud Firestore (Google Cloud) - for user settings, notes, favorites, and custom events (region configured in our Firebase project)',
                    'Firebase Hosting (Google Cloud) - for application delivery via global CDN',
                    'Firebase Cloud Functions (Google Cloud) - for backend processing (e.g., scheduled syncs and reminders when supported)',
                    'Forex Factory-powered events feed provider - for retrieving public economic calendar events (no personal data shared)',
                ],
            },
            {
                title: 'Advertising partners',
                items: [
                    'Google AdSense - may collect and use data for ad delivery when you allow personalized ads',
                    'Manage ad preferences at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>',
                ],
            },
            {
                title: 'Legal requirements',
                items: [
                    'We may disclose information to comply with legal obligations, court orders, or government requests',
                    'We do not sell your personal data to third parties',
                ],
            },
        ],
    },
    {
        id: 'rights',
        heading: 'Your privacy rights',
        subsections: [
            {
                title: 'Access and update',
                items: [
                    'View and edit your profile information in account settings',
                    'Update display name, photo, and preferences at any time',
                    'Request a copy of your data by emailing compliance@time2.trade',
                ],
            },
            {
                title: 'Delete your data',
                items: [
                    'Delete your account in settings (removes personal data and preferences)',
                    'Email compliance@time2.trade to request account deletion',
                    'We process deletion requests within 30 days',
                    'Some data may be retained in backup systems for up to 90 days',
                ],
            },
            {
                title: 'Cookie preferences',
                items: [
                    'Use the cookie banner to choose between personalized ads or essential-only mode',
                    'Change consent at any time by using the consent controls (if provided) or by clearing browser site data to reset the banner',
                    'Essential cookies/storage are used to maintain authentication and core app settings',
                ],
            },
            {
                title: 'Ad personalization',
                items: [
                    'Control Google ad personalization at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>',
                    'Choose essential-only cookies to receive non-personalized ads only',
                    'Ad choices do not affect core Time 2 Trade functionality',
                ],
            },
            {
                title: 'Data portability',
                items: [
                    'Request export of your settings, favorites, notes, and custom events in a portable format',
                    'Email compliance@time2.trade with your request',
                    'We provide data exports within 30 days (subject to identity verification)',
                ],
            },
        ],
    },
    {
        id: 'retention',
        heading: 'Data retention and deletion',
        items: [
            '<strong>Account data:</strong> Stored while your account is active, plus up to 30 days after a deletion request is initiated (to complete processing and prevent abuse).',
            '<strong>Settings, favorites, notes, custom events:</strong> Deleted when your account is deleted, subject to backup retention.',
            '<strong>Usage logs:</strong> Typically retained up to 90 days for debugging and security monitoring.',
            '<strong>Error logs:</strong> Typically retained up to 180 days for stability analysis.',
            '<strong>Backup systems:</strong> Copies may persist in backups for up to 90 days after deletion.',
            '<strong>Legal holds:</strong> Data subject to legal preservation requirements may be retained longer.',
        ],
    },
    {
        id: 'security',
        heading: 'Security measures',
        items: [
            '<strong>Encryption in transit:</strong> Data is transmitted using HTTPS/TLS.',
            '<strong>Encryption at rest:</strong> Data stored on Google Cloud is encrypted at rest using Google-managed keys by default.',
            '<strong>Access control:</strong> Role-based permissions and least-privilege service accounts.',
            '<strong>Authentication:</strong> Secure session management with token-based authentication via Firebase Auth.',
            '<strong>Monitoring:</strong> Operational monitoring and logging to detect outages and suspicious activity.',
            '<strong>No client-side secrets:</strong> Backend credentials are stored in secure environment/config systems, not shipped to the client.',
        ],
    },
    {
        id: 'international',
        heading: 'International data transfers',
        items: [
            'Time 2 Trade is operated from the United States.',
            'We use Google Cloud / Firebase services which may process data in the United States and other countries depending on service configuration and delivery networks.',
            'For users in the EEA/UK: transfers rely on appropriate safeguards (such as Standard Contractual Clauses) made available by our providers.',
            'You have the rights outlined in the "Your privacy rights" section above.',
        ],
    },
    {
        id: 'children',
        heading: "Children's privacy",
        items: [
            '<strong>United States:</strong> Time 2 Trade is not intended for children under 13 (COPPA).',
            '<strong>European Union:</strong> Not intended for children under 16 without parental consent (GDPR Article 8).',
            '<strong>Age verification:</strong> We do not knowingly collect data from children below applicable age limits.',
            '<strong>Parental requests:</strong> If you believe a child has provided data, contact compliance@time2.trade for deletion.',
        ],
    },
    {
        id: 'cookies',
        heading: 'Cookies and local storage',
        subsections: [
            {
                title: 'Essential (always active)',
                items: [
                    'Authentication tokens to keep you signed in',
                    'Session/local state to maintain app behavior',
                    'Cookie consent preferences',
                    'Timezone and display preferences',
                ],
            },
            {
                title: 'Advertising (optional, requires consent)',
                items: [
                    'Google AdSense cookies for ad delivery and measurement',
                    'Ad personalization cookies (only when you allow personalized ads)',
                    'These are not set when you choose essential-only mode',
                ],
            },
        ],
    },
    {
        id: 'changes',
        heading: 'Changes to this policy',
        items: [
            'We may update this policy to reflect service changes or legal requirements.',
            'Last updated date appears at the top of this page.',
            'Material changes may be communicated via email to registered users or via an in-app notice.',
            'Continued use after changes constitutes acceptance of the updated policy.',
            'Previous versions are available upon request at compliance@time2.trade.',
        ],
    },
    {
        id: 'contact',
        heading: 'Contact us',
        items: [
            '<strong>General inquiries:</strong> compliance@time2.trade',
            '<strong>Data requests:</strong> Email compliance@time2.trade with "Data Request" in subject',
            '<strong>Response time:</strong> We respond to requests within 30 days',
            '<strong>Mailing address:</strong> Available upon request for formal legal correspondence',
        ],
    },
];

export default function Page() {
    return (
        <div className="page-shell__max" role="main">
            <header className="header" aria-label="Privacy navigation">
                <div className="logo" aria-label="Time 2 Trade">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <a href="/clock">Open clock</a>
                    <a href="/">Home</a>
                </nav>
            </header>

            <section className="section" aria-labelledby="privacy-heading">
                <p className="badge" aria-hidden="true">Privacy Policy</p>
                <h1 id="privacy-heading" className="heading-xl">Privacy Policy</h1>
                <p className="text-lead" style={{ marginBottom: '8px' }}>
                    Last updated: {lastUpdated}
                </p>
                <p className="text-lead">
                    Time 2 Trade is committed to transparency about how we collect, use, and protect your data.
                    This policy explains what information we gather, why we need it, how we use it, and the choices you have.
                </p>
            </section>

            <section className="section" aria-labelledby="toc-heading">
                <h2 id="toc-heading" className="heading-lg">Table of contents</h2>
                <nav aria-label="Privacy policy sections">
                    <ul className="list" style={{ columns: '2', columnGap: '24px' }}>
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} style={{ textDecoration: 'underline' }}>
                                    {section.heading}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </section>

            {sections.map((section) => (
                <section
                    key={section.id}
                    id={section.id}
                    className="section"
                    aria-labelledby={`${section.id}-heading`}
                >
                    <h2 id={`${section.id}-heading`} className="heading-lg">
                        {section.heading}
                    </h2>

                    {section.subsections ? (
                        section.subsections.map((sub, idx) => (
                            <div key={idx} style={{ marginBottom: '24px' }}>
                                <h3 className="heading-md" style={{ marginBottom: '8px' }}>
                                    {sub.title}
                                </h3>
                                {sub.legalBasis && (
                                    <p
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#666',
                                            marginBottom: '8px',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        Legal basis: {sub.legalBasis}
                                    </p>
                                )}
                                <ul className="list">
                                    {sub.items.map((item, i) => (
                                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <ul className="list">
                            {section.items.map((item, i) => (
                                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                            ))}
                        </ul>
                    )}
                </section>
            ))}

            <section
                className="section"
                style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}
            >
                <h2 className="heading-lg">Summary of your rights</h2>
                <div className="feature-grid">
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Access & Update</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>
                            View and edit your data in account settings or request a copy via email.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Delete</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>
                            Remove your account and associated data in settings or by emailing us. Processed within 30 days.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Control Cookies</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>
                            Choose between personalized ads or essential-only mode via the cookie banner and related controls.
                        </p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Portability</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>
                            Request an export of your settings, favorites, notes, and custom events in a portable format.
                        </p>
                    </div>
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
                        <a className="btn btn-secondary" href="/terms">
                            Terms
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
