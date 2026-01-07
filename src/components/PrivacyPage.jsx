/**
 * src/components/PrivacyPage.jsx
 * 
 * Purpose: Enterprise-grade Privacy Policy for Time 2 Trade with comprehensive
 * data collection disclosure, legal basis, third-party sharing, user rights,
 * and GDPR/CCPA-style transparency following Google-level best practices.
 * 
 * Changelog:
 * v2.0.0 - 2026-01-07 - Complete enterprise rewrite with MUI: specific data collection, legal basis, third-party disclosure, granular rights, retention timelines, international compliance.
 * v1.0.0 - 2026-01-07 - Added privacy page with best-practice copy and structured sections.
 */

import { Box, Container, Stack, Typography, Link, Divider, Grid } from '@mui/material';

const lastUpdated = 'January 7, 2026';

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
                    <span key="ad-settings">
                        Manage ad preferences at{' '}
                        <Link href="https://adssettings.google.com" target="_blank" rel="noopener" underline="hover">
                            Google Ad Settings
                        </Link>
                    </span>,
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
                    <span key="data-request-x">Request a copy of your data via <Link href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer" underline="hover">@time2_trade</Link></span>,
                ],
            },
            {
                title: 'Delete your data',
                items: [
                    'Delete your account in settings (removes all personal data and preferences)',
                    <span key="delete-x">Via <Link href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer" underline="hover">@time2_trade</Link> to request account deletion</span>,
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
                    <span key="ad-control">
                        Control Google ad personalization at{' '}
                        <Link href="https://adssettings.google.com" target="_blank" rel="noopener" underline="hover">
                            Google Ad Settings
                        </Link>
                    </span>,
                    'Choose essential-only cookies to receive non-personalized ads only',
                    'Ad choices do not affect Time 2 Trade functionality',
                ],
            },
            {
                title: 'Data portability',
                items: [
                    'Request export of your settings and favorites in JSON format',
                    <span key="export-x">Via <Link href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer" underline="hover">@time2_trade</Link> with your request</span>,
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
            '<strong>Parental requests:</strong> If you believe a child has provided data, contact <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a> for immediate deletion',
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
            'Previous versions available upon request at <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a>',
        ],
    },
    {
        id: 'contact',
        heading: 'Contact us',
        items: [
            '<strong>General inquiries:</strong> <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a>',
            '<strong>Data requests:</strong> DM <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a> with "Data Request" in message',
            '<strong>Response time:</strong> We respond to requests within 30 days',
            '<strong>Mailing address:</strong> Available upon request for formal legal correspondence',
        ],
    },
];

export default function PrivacyPage() {
    return (
        <Box component="main" sx={{ bgcolor: '#f9fafb', color: '#0f172a', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                <Stack spacing={4}>
                    {/* Logo Header */}
                    <Box
                        component="a"
                        href="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1.5, sm: 2 },
                            textDecoration: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            width: 'fit-content',
                            '&:hover': {
                                opacity: 0.8,
                            },
                            transition: 'opacity 0.2s ease',
                        }}
                        aria-label="Time 2 Trade - Return to home"
                    >
                        <Box
                            component="img"
                            src="/logos/svg/Time2Trade_Logo_Main_Multicolor_Transparent_1080.svg"
                            alt="Time 2 Trade logo"
                            sx={{
                                height: { xs: 32, sm: 40, md: 48 },
                                width: 'auto',
                                display: 'block',
                            }}
                        />
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Time 2 Trade
                        </Typography>
                    </Box>

                    {/* Header */}
                    <Stack spacing={1}>
                        <Typography variant="overline" sx={{ letterSpacing: 1, fontWeight: 700, color: '#475569' }}>
                            Privacy Policy
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            Privacy Policy
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            Last updated: {lastUpdated}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', mt: 1 }}>
                            Time 2 Trade is committed to transparency about how we collect, use, and protect your data. This policy explains what information we gather, why we need it, how we use it, and the choices you have.
                        </Typography>
                    </Stack>

                    <Divider />

                    {/* Table of Contents */}
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            Table of contents
                        </Typography>
                        <Grid container spacing={1}>
                            {sections.map((section) => (
                                <Grid item xs={12} sm={6} key={section.id}>
                                    <Link
                                        href={`#${section.id}`}
                                        underline="hover"
                                        sx={{ color: '#0f172a', fontWeight: 600, display: 'block' }}
                                    >
                                        {section.heading}
                                    </Link>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Sections */}
                    {sections.map((section) => (
                        <Box key={section.id} id={section.id}>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                                {section.heading}
                            </Typography>

                            {section.subsections ? (
                                <Stack spacing={3}>
                                    {section.subsections.map((sub, idx) => (
                                        <Box key={idx}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                                {sub.title}
                                            </Typography>
                                            {sub.legalBasis && (
                                                <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', mb: 1 }}>
                                                    Legal basis: {sub.legalBasis}
                                                </Typography>
                                            )}
                                            <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: '#475569' }}>
                                                {sub.items.map((item, i) => (
                                                    <Typography key={i} component="li" variant="body1">
                                                        {item}
                                                    </Typography>
                                                ))}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: '#475569' }}>
                                    {section.items.map((item, i) => (
                                        <Typography key={i} component="li" variant="body1" dangerouslySetInnerHTML={{ __html: item }} />
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    ))}

                    <Divider sx={{ my: 4 }} />

                    {/* Summary Cards */}
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            Summary of your rights
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                        Access & Update
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569' }}>
                                        View and edit your data in account settings or request a full copy via email.
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                        Delete
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569' }}>
                                        Remove your account and all data in settings or by emailing us. Processed within 30 days.
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                        Control Cookies
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569' }}>
                                        Choose between personalized ads or essential-only mode via the cookie banner.
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                                        Export Data
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475569' }}>
                                        Request a portable copy of your settings and favorites in JSON format.
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider />

                    {/* Footer Links */}
                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                        <Link href="/" underline="hover" sx={{ fontWeight: 700 }}>
                            Home
                        </Link>
                        <Link href="/app" underline="hover" sx={{ fontWeight: 700 }}>
                            Open app
                        </Link>
                        <Link href="/terms" underline="hover" sx={{ fontWeight: 700 }}>
                            Terms
                        </Link>
                        <Link href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: 700 }}>
                            @time2_trade
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}
