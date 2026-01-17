/**
 * pages/privacy.page.jsx
 * 
 * Purpose: Enterprise-grade Privacy Policy for Time 2 Trade with comprehensive
 * data collection disclosure, legal basis, third-party sharing, user rights,
 * and GDPR/CCPA-style transparency following Google-level best practices.
 * 
 * Changelog:
 * v2.0.1 - 2026-01-16 - Updated primary CTA to /clock.
 * v2.0.0 - 2026-01-07 - Complete enterprise rewrite: specific data collection, legal basis, third-party disclosure, granular rights, retention timelines, international compliance.
 * v1.1.0 - 2026-01-07 - Rewrote privacy copy to enterprise-style, covering data use, AdSense, cookies, rights, and contact.
 * v1.0.0 - 2026-01-07 - Added privacy policy with AdSense disclosure and cookie details.
 */

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_3.PNG`;
const lastUpdated = 'January 7, 2026';

const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy | Time 2 Trade',
    url: `${siteUrl}/privacy`,
    description:
        'Comprehensive privacy policy for Time 2 Trade: data collection, legal basis, user rights, third-party sharing, and controls for consent, deletion, and ad personalization.',
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Privacy Policy | Time 2 Trade',
    description:
        'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, our legal basis for processing, and controls for consent, deletion, and ad personalization.',
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
                    'Timezone selection and display preferences',
                ],
            },
            {
                title: 'Information we collect automatically',
                items: [
                    'IP address and general location (country/region)',
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
                    'Economic calendar data from JBlanked API (publicly available market events)',
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
                    'Store your favorites, notes, and custom configurations',
                ],
            },
            {
                title: 'Improve and develop features',
                legalBasis: 'Legitimate interest',
                items: [
                    'Analyze usage patterns to optimize performance',
                    'Identify and fix bugs and technical issues',
                    'Develop new features based on user behavior',
                    'Ensure service reliability and uptime',
                ],
            },
            {
                title: 'Advertising',
                legalBasis: 'Consent (for personalized ads)',
                items: [
                    'Display Google AdSense advertisements',
                    'Measure ad performance and effectiveness',
                    'Deliver personalized ads when you allow them via cookie consent',
                    'Show non-personalized ads when you select essential-only cookies',
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
                    'Cloud Firestore (Google Cloud) - for data storage in us-central1 region',
                    'Firebase Hosting (Google Cloud) - for application delivery via global CDN',
                    'Firebase Cloud Functions (Google Cloud) - for scheduled data synchronization',
                    'JBlanked API - for economic calendar data retrieval (no personal data shared)',
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
                    'Delete your account in settings (removes all personal data and preferences)',
                    'Email compliance@time2.trade to request account deletion',
                    'We process deletion requests within 30 days',
                    'Some data may be retained in backup systems for up to 90 days',
                ],
            },
            {
                title: 'Cookie preferences',
                items: [
                    'Use the cookie banner to choose between personalized ads or essential-only mode',
                    'Change consent at any time by clearing browser data to reset the banner',
                    'Essential cookies are always active to maintain authentication and settings',
                ],
            },
            {
                title: 'Ad personalization',
                items: [
                    'Control Google ad personalization at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>',
                    'Choose essential-only cookies to receive non-personalized ads only',
                    'Ad choices do not affect Time 2 Trade functionality',
                ],
            },
            {
                title: 'Data portability',
                items: [
                    'Request export of your settings and favorites in JSON format',
                    'Email compliance@time2.trade with your request',
                    'We provide data exports within 30 days',
                ],
            },
        ],
    },
    {
        id: 'retention',
        heading: 'Data retention and deletion',
        items: [
            '<strong>Account data:</strong> Stored while your account is active, plus 30 days after deletion request',
            '<strong>Settings and preferences:</strong> Deleted immediately upon account deletion',
            '<strong>Usage logs:</strong> Retained for 90 days for debugging and security monitoring',
            '<strong>Error logs:</strong> Retained for 180 days for system stability analysis',
            '<strong>Backup systems:</strong> Data may persist in backups for up to 90 days after deletion',
            '<strong>Legal holds:</strong> Data subject to legal preservation requirements may be retained longer',
        ],
    },
    {
        id: 'security',
        heading: 'Security measures',
        items: [
            '<strong>Encryption:</strong> All data transmitted using TLS 1.2+ encryption',
            '<strong>Storage:</strong> Data encrypted at rest using Google Cloud encryption standards',
            '<strong>Access control:</strong> Role-based permissions with least-privilege principle',
            '<strong>Authentication:</strong> Secure session management with token-based authentication',
            '<strong>Monitoring:</strong> Continuous security monitoring and automated threat detection',
            '<strong>Service accounts:</strong> Minimal permissions for Cloud Functions and backend services',
            '<strong>No client-side secrets:</strong> API keys and credentials stored securely in environment variables',
        ],
    },
    {
        id: 'international',
        heading: 'International data transfers',
        items: [
            'Time 2 Trade is operated from the United States',
            'Data is stored in Google Cloud (Firebase) us-central1 region',
            'For users in the European Economic Area (EEA) and UK: data transfers comply with GDPR via Google Cloud\'s Standard Contractual Clauses',
            'Firebase services are certified under ISO 27001, SOC 2, and SOC 3',
            'You have the rights outlined in the "Your privacy rights" section above',
        ],
    },
    {
        id: 'children',
        heading: 'Children\'s privacy',
        items: [
            '<strong>United States:</strong> Time 2 Trade is not intended for children under 13 (COPPA compliance)',
            '<strong>European Union:</strong> Not intended for children under 16 without parental consent (GDPR Article 8)',
            '<strong>Age verification:</strong> We do not knowingly collect data from children below applicable age limits',
            '<strong>Parental requests:</strong> If you believe a child has provided data, contact compliance@time2.trade for immediate deletion',
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
                    'Session data to maintain app state',
                    'Cookie consent preferences',
                    'Timezone and language settings',
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
            'We may update this policy to reflect service changes or legal requirements',
            'Last updated date appears at the top of this page',
            'Material changes will be communicated via email to registered users',
            'Continued use after changes constitutes acceptance of the updated policy',
            'Previous versions available upon request at compliance@time2.trade',
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
                    Time 2 Trade is committed to transparency about how we collect, use, and protect your data. This policy explains what information we gather, why we need it, how we use it, and the choices you have.
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
                <section key={section.id} id={section.id} className="section" aria-labelledby={`${section.id}-heading`}>
                    <h2 id={`${section.id}-heading`} className="heading-lg">{section.heading}</h2>

                    {section.subsections ? (
                        section.subsections.map((sub, idx) => (
                            <div key={idx} style={{ marginBottom: '24px' }}>
                                <h3 className="heading-md" style={{ marginBottom: '8px' }}>{sub.title}</h3>
                                {sub.legalBasis && (
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px', fontStyle: 'italic' }}>
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

            <section className="section" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '32px' }}>
                <h2 className="heading-lg">Summary of your rights</h2>
                <div className="feature-grid">
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Access & Update</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>View and edit your data in account settings or request a full copy via email.</p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Delete</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>Remove your account and all data in settings or by emailing us. Processed within 30 days.</p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Control Cookies</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>Choose between personalized ads or essential-only mode via the cookie banner.</p>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                        <h3 className="heading-md">Export Data</h3>
                        <p style={{ margin: 0, fontSize: '1rem' }}>Request a portable copy of your settings and favorites in JSON format.</p>
                    </div>
                </div>
            </section>

            <footer className="footer" aria-label="Footer">
                <div className="page-shell__max" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    <div className="logo" aria-label="Time 2 Trade footer">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/terms">Terms</a>
                        <a className="btn btn-secondary" href="/">Home</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
