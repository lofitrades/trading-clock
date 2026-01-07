/**
 * src/components/TermsPage.jsx
 * 
 * Purpose: Enterprise-grade Terms of Service for Time 2 Trade with comprehensive
 * legal coverage including acceptable use, disclaimers, liability limitations,
 * IP rights, arbitration, and third-party service disclosures.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-07 - Initial enterprise implementation following Google-level best practices.
 */

import { Box, Container, Stack, Typography, Link, Divider, Grid } from '@mui/material';

const lastUpdated = 'January 7, 2026';
const effectiveDate = 'January 7, 2026';

const sections = [
    {
        id: 'acceptance',
        heading: 'Acceptance of Terms',
        items: [
            'By accessing or using Time 2 Trade ("Service"), you agree to be bound by these Terms of Service ("Terms")',
            'If you do not agree to these Terms, you may not access or use the Service',
            'We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance',
            'If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization',
        ],
    },
    {
        id: 'description',
        heading: 'Service Description',
        items: [
            '<strong>Time 2 Trade</strong> is a web-based application providing trading session visualization and economic calendar tools',
            '<strong>Core features:</strong> Market session clock, economic event calendar, timezone management, user preferences synchronization',
            '<strong>Data sources:</strong> Economic events from JBlanked API (MQL5/Forex Factory equivalent data)',
            '<strong>Free access:</strong> All features are available with free account creation',
            '<strong>No premium tiers:</strong> We do not charge subscription fees for service access',
        ],
    },
    {
        id: 'accounts',
        heading: 'User Accounts',
        subsections: [
            {
                title: 'Account creation',
                items: [
                    'You may create an account using email or OAuth providers (Google, Twitter)',
                    'You must provide accurate and complete information',
                    'You are responsible for maintaining the security of your account credentials',
                    'You must notify us immediately of any unauthorized access',
                ],
            },
            {
                title: 'Account responsibilities',
                items: [
                    'You are responsible for all activities under your account',
                    'You may not share your account with others',
                    'You may not create multiple accounts to circumvent restrictions',
                    'You may not impersonate others or provide false information',
                ],
            },
            {
                title: 'Account termination',
                items: [
                    'You may delete your account at any time via account settings',
                    'We may suspend or terminate accounts that violate these Terms',
                    'Upon termination, your data will be deleted according to our Privacy Policy',
                    'Some data may be retained in backups for up to 90 days',
                ],
            },
        ],
    },
    {
        id: 'acceptable-use',
        heading: 'Acceptable Use Policy',
        items: [
            '<strong>Prohibited activities:</strong>',
            '• Automated scraping, crawling, or data harvesting without permission',
            '• Attempting to gain unauthorized access to systems or other user accounts',
            '• Interfering with or disrupting the Service or servers',
            '• Transmitting viruses, malware, or malicious code',
            '• Using the Service for illegal activities or to violate others\' rights',
            '• Reverse engineering, decompiling, or disassembling the Service',
            '• Removing or modifying copyright, trademark, or proprietary notices',
            '• Reselling or commercially exploiting the Service without authorization',
        ],
    },
    {
        id: 'disclaimer',
        heading: 'No Financial Advice Disclaimer',
        items: [
            '<strong>Critical Notice:</strong> Time 2 Trade is an informational tool only',
            '<strong>Not financial advice:</strong> We do not provide trading signals, recommendations, or investment advice',
            '<strong>No guarantees:</strong> Past performance data and event information do not guarantee future results',
            '<strong>Your responsibility:</strong> All trading decisions are your own. Consult licensed financial advisors before making investment decisions',
            '<strong>Market risks:</strong> Trading futures, forex, and other financial instruments involves substantial risk of loss',
            '<strong>Educational purpose:</strong> The Service helps you track market sessions and events; it does not predict market movements',
            '<strong>No liability for losses:</strong> We are not responsible for trading losses or investment decisions made using the Service',
        ],
    },
    {
        id: 'intellectual-property',
        heading: 'Intellectual Property Rights',
        subsections: [
            {
                title: 'Our ownership',
                items: [
                    'Time 2 Trade owns all rights to the Service, including software, design, logos, trademarks, and content',
                    'The Time 2 Trade name, logo, and branding are our trademarks',
                    'You may not use our trademarks without written permission',
                    'Third-party trademarks (Google, Firebase, etc.) are owned by their respective owners',
                ],
            },
            {
                title: 'Your license',
                items: [
                    'We grant you a limited, non-exclusive, non-transferable license to access and use the Service',
                    'This license is for personal, non-commercial use only',
                    'You may not copy, modify, distribute, sell, or lease any part of the Service',
                    'This license terminates when your account is closed or these Terms are breached',
                ],
            },
            {
                title: 'User content',
                items: [
                    'You retain ownership of data you create (favorites, notes, custom settings)',
                    'You grant us a license to store and display your data to provide the Service',
                    'We do not claim ownership of your personal trading notes or configurations',
                    'You can export or delete your data at any time',
                ],
            },
        ],
    },
    {
        id: 'third-party',
        heading: 'Third-Party Services',
        items: [
            '<strong>Firebase (Google Cloud):</strong> Authentication, data storage, and hosting infrastructure',
            '<strong>Google AdSense:</strong> Advertising services subject to Google\'s terms and privacy policies',
            '<strong>JBlanked API:</strong> Economic calendar data source (publicly available market information)',
            '<strong>OAuth providers:</strong> Google and Twitter for account authentication',
            '<strong>Third-party terms:</strong> Your use of these services is subject to their respective terms and policies',
            '<strong>No endorsement:</strong> We do not endorse or control third-party services',
            '<strong>Availability:</strong> Third-party service interruptions may affect Time 2 Trade functionality',
        ],
    },
    {
        id: 'advertising',
        heading: 'Advertising and Cookies',
        items: [
            'We display advertisements via Google AdSense to support free access',
            'Ad personalization requires your consent via the cookie banner',
            'You can choose "essential-only" mode for non-personalized ads',
            'Advertisers do not have direct access to your account data',
            'Ad revenue helps us maintain and improve the Service',
            'You can manage ad preferences at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>',
            'See our <a href="/privacy">Privacy Policy</a> for detailed cookie information',
        ],
    },
    {
        id: 'liability',
        heading: 'Limitation of Liability',
        items: [
            '<strong>"AS IS" provision:</strong> The Service is provided "as is" and "as available" without warranties of any kind',
            '<strong>No warranties:</strong> We disclaim all warranties, express or implied, including merchantability, fitness for purpose, and non-infringement',
            '<strong>Data accuracy:</strong> We do not guarantee accuracy, completeness, or timeliness of economic event data',
            '<strong>Service availability:</strong> We do not guarantee uninterrupted, secure, or error-free service',
            '<strong>Damage limitations:</strong> To the maximum extent permitted by law, we are not liable for:',
            '• Trading losses or investment damages',
            '• Loss of profits, data, or business opportunities',
            '• Indirect, incidental, consequential, or punitive damages',
            '• Service interruptions, bugs, or data loss',
            '<strong>Maximum liability:</strong> Our total liability shall not exceed $100 USD or the amount you paid us in the past 12 months (whichever is greater)',
            '<strong>Jurisdictional limits:</strong> Some jurisdictions do not allow limitation of liability; in such cases, our liability is limited to the fullest extent permitted by law',
        ],
    },
    {
        id: 'indemnification',
        heading: 'Indemnification',
        items: [
            'You agree to indemnify, defend, and hold harmless Time 2 Trade and its affiliates from any claims, damages, losses, or expenses arising from:',
            '• Your use or misuse of the Service',
            '• Your violation of these Terms',
            '• Your violation of any third-party rights',
            '• Trading losses or investment decisions you make',
            '• Your user content or account activity',
            'This indemnification obligation survives termination of your account and these Terms',
        ],
    },
    {
        id: 'dispute-resolution',
        heading: 'Dispute Resolution',
        subsections: [
            {
                title: 'Governing law',
                items: [
                    'These Terms are governed by the laws of the United States',
                    'Specifically, the laws of [Your State] apply, excluding conflict of law provisions',
                    'You consent to jurisdiction in [Your State] courts for disputes',
                ],
            },
            {
                title: 'Informal resolution',
                items: [
                    'Before filing a legal claim, contact us at <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a> to resolve disputes informally',
                    'We will attempt good-faith resolution within 30 days',
                    'Most disputes can be resolved through communication',
                ],
            },
            {
                title: 'Arbitration (optional)',
                items: [
                    'For disputes that cannot be resolved informally, both parties may agree to binding arbitration',
                    'Arbitration would be conducted by a mutually agreed arbitrator',
                    'Arbitration costs would be shared equally unless otherwise required by law',
                    'Small claims court remains available for qualifying disputes',
                ],
            },
        ],
    },
    {
        id: 'termination',
        heading: 'Termination',
        items: [
            '<strong>Your right to terminate:</strong> You may stop using the Service and delete your account at any time',
            '<strong>Our right to terminate:</strong> We may suspend or terminate your access immediately if you:',
            '• Violate these Terms or our Acceptable Use Policy',
            '• Engage in fraudulent or illegal activity',
            '• Pose a security or legal risk',
            '• Have not used the Service for an extended period',
            '<strong>Effect of termination:</strong>',
            '• Your account access will be revoked',
            '• Your data will be deleted according to our Privacy Policy',
            '• Provisions regarding liability, indemnification, and intellectual property survive termination',
            '<strong>No refunds:</strong> Since the Service is free, no refunds apply',
        ],
    },
    {
        id: 'changes',
        heading: 'Changes to These Terms',
        items: [
            'We may update these Terms to reflect new features, legal requirements, or business practices',
            'Material changes will be communicated via email to registered users',
            'The "Last Updated" date at the top of this page will be revised',
            'Continued use after changes constitutes acceptance of the updated Terms',
            'If you disagree with changes, you must stop using the Service and delete your account',
            'Previous versions of these Terms are available upon request',
        ],
    },
    {
        id: 'general',
        heading: 'General Provisions',
        items: [
            '<strong>Entire agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement between you and Time 2 Trade',
            '<strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions continue in effect',
            '<strong>No waiver:</strong> Our failure to enforce any provision does not waive our right to do so later',
            '<strong>Assignment:</strong> You may not assign these Terms; we may assign them to affiliates or successors',
            '<strong>Force majeure:</strong> We are not liable for delays or failures due to circumstances beyond our control',
            '<strong>Export compliance:</strong> You agree to comply with all export control laws when using the Service',
            '<strong>Contact:</strong> For questions about these Terms, contact <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a>',
        ],
    },
    {
        id: 'contact',
        heading: 'Contact Information',
        items: [
            '<strong>General inquiries:</strong> <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a>',
            '<strong>Legal notices:</strong> DM <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a> with "Legal Notice" in message',
            '<strong>Terms questions:</strong> <a href="https://x.com/time2_trade" target="_blank" rel="noopener noreferrer">@time2_trade</a>',
            '<strong>Response time:</strong> We respond to inquiries within 5-7 business days',
        ],
    },
];

export default function TermsPage() {
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
                            Terms of Service
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            Terms of Service
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            Last updated: {lastUpdated} | Effective: {effectiveDate}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', mt: 1 }}>
                            These Terms of Service govern your use of Time 2 Trade. By accessing or using the Service, you agree to be bound by these Terms. Please read them carefully.
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
                                            <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: '#475569' }}>
                                                {sub.items.map((item, i) => (
                                                    <Typography key={i} component="li" variant="body1" dangerouslySetInnerHTML={{ __html: item }} />
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

                    {/* Important Notices */}
                    <Box sx={{ bgcolor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: 2, p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#92400e' }}>
                            ⚠️ Important Disclaimers
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2" sx={{ color: '#78350f' }}>
                                <strong>No Financial Advice:</strong> Time 2 Trade is informational only. We do not provide trading signals or investment advice.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#78350f' }}>
                                <strong>Trading Risks:</strong> Trading involves substantial risk of loss. Past performance does not guarantee future results.
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#78350f' }}>
                                <strong>Your Responsibility:</strong> All trading decisions are yours. Consult licensed financial advisors before investing.
                            </Typography>
                        </Stack>
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
                        <Link href="/privacy" underline="hover" sx={{ fontWeight: 700 }}>
                            Privacy Policy
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
