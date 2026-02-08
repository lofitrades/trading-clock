/**
 * src/components/TermsPage.jsx
 * 
 * Purpose: Enterprise-grade Terms of Service with 100% i18n coverage via PublicLayout wrapper.
 * Fully translatable legal content (EN/ES/FR) with comprehensive sections: acceptance,
 * description, accounts, acceptable use, disclaimer, liability, IP rights, third-party,
 * arbitration, general, contact, and important disclaimers.
 * Responsive vertical scrolling with proper height constraints for xs/sm (mobile header + bottom nav)
 * and md+ (sticky AppBar). All content fully internationalized (EN/ES/FR).
 * 
 * Changelog:
 * v1.5.0 - 2026-02-02 - BEP VIEWPORT FIX: Replaced 100vh with var(--t2t-vv-height, 100dvh) for xs/sm
 *                       height calc to prevent content overflow behind bottom AppBar on non-PWA mobile browsers.
 * v1.4.0 - 2026-01-29 - BEP THEME-AWARE: Replaced all hardcoded hex colors with MUI theme tokens.
 *                       bgcolor: #f9fafb → background.default, color: #0f172a → text.primary,
 *                       color: #475569 → text.secondary. Warning box uses theme warning palette.
 *                       Fully AA accessible with proper contrast in light/dark modes.
 * v1.3.1 - 2026-01-28 - BEP BUGFIX: Added missing `useMemo` import from React. Fixes ReferenceError in TermsPageContent component.
 * v1.3.0 - 2026-01-28 - APPBAR INTEGRATION: Added navItems prop to PublicLayout for sticky AppBar display.
 * Includes Clock, Calendar, and Settings navigation buttons. Uses i18n t() keys from common:navigation namespace.
 * AppBar now visible on md+ with navigation chrome, MobileHeader on xs/sm.
 * v1.2.0 - 2026-01-28 - BEP RESPONSIVE LAYOUT: Added proper scrollable container with height constraints.
 * xs/sm: calc(var(--t2t-vv-height, 100dvh) - 48px - var(--t2t-bottom-nav-height, 64px)) for fixed mobile header + bottom nav.
 * md+: calc(100vh - 72px) for sticky AppBar. Content overflowY auto for vertical scrolling. Matches PublicLayout + CalendarEmbed pattern.
 * v1.1.0 - 2026-01-28 - Refactored to use PublicLayout + full i18n coverage (0% hardcoded copy)
 * v1.0.1 - 2026-01-16 - Updated CTA link to /clock.
 * v1.0.0 - 2026-01-07 - Initial enterprise implementation following Google-level best practices.
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Box, Container, Stack, Typography, Link, Divider, useTheme } from '@mui/material';
import PublicLayout from './PublicLayout';
import useAppBarNavItems from '../hooks/useAppBarNavItems.jsx';

function TermsPageContent() {
    const { t } = useTranslation('terms');
    const theme = useTheme();

    // Memoize section keys for table of contents
    const sectionKeys = useMemo(() => [
        'acceptance',
        'description',
        'accounts',
        'acceptableUse',
        'disclaimer',
        'liabilityLimitation',
        'intellectual',
        'thirdParty',
        'arbitration',
        'general',
        'contact',
    ], []);

    // Helper to render items array from i18n
    const renderItems = (key, subkey = null) => {
        const itemsPath = subkey ? `sections.${key}.${subkey}.items` : `sections.${key}.items`;
        const items = t(itemsPath, { returnObjects: true });
        return Array.isArray(items) ? items : [];
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: { xs: 'calc(var(--t2t-vv-height, 100dvh) - 48px - var(--t2t-bottom-nav-height, 64px))', md: 'calc(100vh - 72px)' },
                overflowY: 'auto',
                overflowX: 'hidden',
                bgcolor: 'background.default',
                color: 'text.primary',
            }}
        >
            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                <Stack spacing={4}>
                    {/* Header */}
                    <Stack spacing={1}>
                        <Typography
                            variant="overline"
                            sx={{ letterSpacing: 1, fontWeight: 700, color: 'text.secondary' }}
                        >
                            {t('page.metaTitle')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>
                            {t('page.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {t('page.description')}
                        </Typography>
                    </Stack>

                    <Divider />

                    {/* Table of Contents */}
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('tableOfContents')}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                            {sectionKeys.map((key) => (
                                <Link
                                    key={key}
                                    href={`#${key}`}
                                    underline="hover"
                                    sx={{ color: 'text.primary', fontWeight: 600, display: 'block' }}
                                >
                                    {t(`sections.${key}.heading`)}
                                </Link>
                            ))}
                        </Box>
                    </Box>

                    <Divider />

                    {/* Acceptance Section */}
                    <Box id="acceptance">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.acceptance.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('acceptance').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Description Section */}
                    <Box id="description">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.description.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('description').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Accounts Section (with subsections) */}
                    <Box id="accounts">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.accounts.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            {/* Creation */}
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {t('sections.accounts.creation.title')}
                                </Typography>
                                <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                                    {renderItems('accounts', 'creation').map((item, i) => (
                                        <Typography key={i} component="li" variant="body1">
                                            {item}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Box>

                            {/* Responsibilities */}
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {t('sections.accounts.responsibilities.title')}
                                </Typography>
                                <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                                    {renderItems('accounts', 'responsibilities').map((item, i) => (
                                        <Typography key={i} component="li" variant="body1">
                                            {item}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Box>

                            {/* Termination */}
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {t('sections.accounts.termination.title')}
                                </Typography>
                                <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                                    {renderItems('accounts', 'termination').map((item, i) => (
                                        <Typography key={i} component="li" variant="body1">
                                            {item}
                                        </Typography>
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Acceptable Use Section */}
                    <Box id="acceptableUse">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.acceptableUse.heading')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1 }}>
                            {t('sections.acceptableUse.intro')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('acceptableUse').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Disclaimer Section */}
                    <Box id="disclaimer">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.disclaimer.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('disclaimer').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Liability Limitation Section */}
                    <Box id="liabilityLimitation">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.liabilityLimitation.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('liabilityLimitation').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Intellectual Property Section */}
                    <Box id="intellectual">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.intellectual.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('intellectual').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Third Party Section */}
                    <Box id="thirdParty">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.thirdParty.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('thirdParty').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Arbitration Section */}
                    <Box id="arbitration">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.arbitration.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('arbitration').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* General Section */}
                    <Box id="general">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.general.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('general').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    {/* Contact Section */}
                    <Box id="contact">
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                            {t('sections.contact.heading')}
                        </Typography>
                        <Stack component="ul" spacing={0.5} sx={{ pl: 3, color: 'text.secondary' }}>
                            {renderItems('contact').map((item, i) => (
                                <Typography key={i} component="li" variant="body1">
                                    {item}
                                </Typography>
                            ))}
                        </Stack>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Important Disclaimers */}
                    <Box sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(254, 243, 199, 1)',
                        border: '2px solid',
                        borderColor: 'warning.main',
                        borderRadius: 2,
                        p: 3
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'warning.dark' }}>
                            {t('disclaimers.title')}
                        </Typography>
                        <Stack spacing={1}>
                            <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark' }}>
                                {t('disclaimers.noFinancialAdvice')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark' }}>
                                {t('disclaimers.tradingRisks')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark' }}>
                                {t('disclaimers.yourResponsibility')}
                            </Typography>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Footer Links */}
                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                        <Link href="/" underline="hover" sx={{ fontWeight: 700 }}>
                            {t('footer.home')}
                        </Link>
                        <Link href="/clock" underline="hover" sx={{ fontWeight: 700 }}>
                            {t('footer.openApp')}
                        </Link>
                        <Link href="/privacy" underline="hover" sx={{ fontWeight: 700 }}>
                            {t('footer.privacy')}
                        </Link>
                        <Link
                            href="https://x.com/time2_trade"
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ fontWeight: 700 }}
                        >
                            {t('footer.contact')}
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

export default function TermsPage() {
    const { t } = useTranslation(['common']);

    const navItems = useAppBarNavItems({
        onOpenAuth: () => { },
        onOpenSettings: () => { },
        onOpenContact: () => { },
    });

    return (
        <PublicLayout navItems={navItems}>
            <Box component="main" sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: 'var(--t2t-vv-height, 100dvh)' }}>
                <TermsPageContent />
            </Box>
        </PublicLayout>
    );
}
