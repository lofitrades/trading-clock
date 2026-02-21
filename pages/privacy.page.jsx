/**
 * pages/privacy.page.jsx
 *
 * Purpose: Enterprise-grade Privacy Policy for Time 2 Trade with comprehensive
 * data collection disclosure, legal basis, third-party sharing, user rights,
 * and GDPR/CCPA-style transparency following Google-level best practices.
 * Phase 2 i18n migration: all strings now sourced from i18n pages.legal.privacy.*
 *
 * Changelog:
 * v2.4.0 - 2026-02-21 - BEP: Changed CTA link from /clock to /calendar.
 * v2.3.0 - 2026-02-02 - BEP SEO FIX: Added BreadcrumbList schema to help Google understand site
 *                       hierarchy and prioritize crawling. Addresses "Discovered - currently not indexed" GSC status.
 * v2.2.0 - 2026-01-24 - Phase 2 i18n migration: all 280+ strings moved to pages.legal.privacy namespace (EN/ES/FR)
 * v2.1.0 - 2026-01-22 - BEP compliance refresh:
 *   - Align product language with "Market Clock + Economic Calendar"
 *   - Clarify Forex Factory-powered events feed (no personal data shared)
 *   - Add Custom Events + Reminders/Notifications data handling
 *   - Add explicit cookie reset UX and consent update guidance
 *   - Tighten retention language + security wording for accuracy
 * v2.0.1 - 2026-01-16 - Updated primary CTA to /clock.
 * v2.0.0 - 2026-01-07 - Complete enterprise rewrite: specific data collection, legal basis, third-party disclosure, granular rights, retention timelines, international compliance.
 * v1.1.0 - 2026-01-07 - Rewrote privacy copy to enterprise-style, covering data use, AdSense, cookies, rights, and contact.
 * v1.0.0 - 2026-01-07 - Added privacy policy with AdSense disclosure and cookie details.
 */

import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Link,
    Card,
    CardContent,
    Divider,
} from '@mui/material';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;

// BEP SEO: BreadcrumbList helps Google understand site hierarchy and prioritize crawling
const privacyBreadcrumbSchema = {
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
            name: 'Privacy Policy',
            item: `${siteUrl}/privacy`,
        },
    ],
};

const privacyWebPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy | Time 2 Trade',
    url: `${siteUrl}/privacy`,
    description: 'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, legal bases for processing, retention timelines, and controls for consent, deletion, and ad personalization.',
};

const PrivacyPage = () => {
    const { t } = useTranslation('pages');

    return (
        <Box sx={{ py: 6, backgroundColor: '#f9f9f9' }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ mb: 6 }}>
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2rem', md: '2.5rem' },
                            fontWeight: 700,
                            mb: 2,
                        }}
                    >
                        {t('legal.privacy.heading')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('legal.privacy.lastUpdated')}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 3, lineHeight: 1.8 }}>
                        {t('legal.privacy.introduction')}
                    </Typography>
                </Box>

                {/* Table of Contents */}
                <Paper sx={{ p: 3, mb: 4, backgroundColor: '#fff' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        {t('legal.privacy.tableOfContents')}
                    </Typography>
                    <Stack component="ol" spacing={1} sx={{ pl: 2 }}>
                        {[
                            'collection',
                            'usage',
                            'sharing',
                            'rights',
                            'retention',
                            'security',
                            'international',
                            'children',
                            'cookies',
                            'changes',
                            'contact',
                        ].map((sectionId) => (
                            <Typography component="li" key={sectionId} variant="body2">
                                <Link href={`#${sectionId}`} sx={{ textDecoration: 'none', color: 'primary.main' }}>
                                    {t(`legal.privacy.sections.${sectionId}.heading`)}
                                </Link>
                            </Typography>
                        ))}
                    </Stack>
                </Paper>

                {/* Sections */}
                <Stack spacing={4} sx={{ mb: 6 }}>
                    {/* Information Collection */}
                    <Box id="collection">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.collection.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            <PrivacySubsection
                                title={t('legal.privacy.sections.collection.provider.title')}
                                items={t('legal.privacy.sections.collection.provider.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.collection.automatic.title')}
                                items={t('legal.privacy.sections.collection.automatic.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.collection.thirdParty.title')}
                                items={t('legal.privacy.sections.collection.thirdParty.items', { returnObjects: true })}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Usage */}
                    <Box id="usage">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.usage.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            <PrivacyUsageSubsection
                                title={t('legal.privacy.sections.usage.services.title')}
                                basis={t('legal.privacy.sections.usage.services.basis')}
                                items={t('legal.privacy.sections.usage.services.items', { returnObjects: true })}
                            />
                            <PrivacyUsageSubsection
                                title={t('legal.privacy.sections.usage.improve.title')}
                                basis={t('legal.privacy.sections.usage.improve.basis')}
                                items={t('legal.privacy.sections.usage.improve.items', { returnObjects: true })}
                            />
                            <PrivacyUsageSubsection
                                title={t('legal.privacy.sections.usage.advertising.title')}
                                basis={t('legal.privacy.sections.usage.advertising.basis')}
                                items={t('legal.privacy.sections.usage.advertising.items', { returnObjects: true })}
                            />
                            <PrivacyUsageSubsection
                                title={t('legal.privacy.sections.usage.security.title')}
                                basis={t('legal.privacy.sections.usage.security.basis')}
                                items={t('legal.privacy.sections.usage.security.items', { returnObjects: true })}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Sharing */}
                    <Box id="sharing">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.sharing.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            <PrivacySubsection
                                title={t('legal.privacy.sections.sharing.providers.title')}
                                items={t('legal.privacy.sections.sharing.providers.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.sharing.advertising.title')}
                                items={t('legal.privacy.sections.sharing.advertising.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.sharing.legal.title')}
                                items={t('legal.privacy.sections.sharing.legal.items', { returnObjects: true })}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Rights */}
                    <Box id="rights">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.rights.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            <PrivacySubsection
                                title={t('legal.privacy.sections.rights.access.title')}
                                items={t('legal.privacy.sections.rights.access.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.rights.delete.title')}
                                items={t('legal.privacy.sections.rights.delete.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.rights.cookies.title')}
                                items={t('legal.privacy.sections.rights.cookies.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.rights.adPersonalization.title')}
                                items={t('legal.privacy.sections.rights.adPersonalization.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.rights.portability.title')}
                                items={t('legal.privacy.sections.rights.portability.items', { returnObjects: true })}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Retention */}
                    <Box id="retention">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.retention.heading')}
                        </Typography>
                        <Stack component="ul" spacing={1.5} sx={{ pl: 2 }}>
                            {t('legal.privacy.sections.retention.items', { returnObjects: true }).map((item, idx) => (
                                <Typography
                                    component="li"
                                    key={idx}
                                    variant="body2"
                                    sx={{ lineHeight: 1.8 }}
                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Security */}
                    <Box id="security">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.security.heading')}
                        </Typography>
                        <Stack component="ul" spacing={1.5} sx={{ pl: 2 }}>
                            {t('legal.privacy.sections.security.items', { returnObjects: true }).map((item, idx) => (
                                <Typography
                                    component="li"
                                    key={idx}
                                    variant="body2"
                                    sx={{ lineHeight: 1.8 }}
                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* International */}
                    <Box id="international">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.international.heading')}
                        </Typography>
                        <PrivacySubsection items={t('legal.privacy.sections.international.items', { returnObjects: true })} />
                    </Box>

                    <Divider />

                    {/* Children */}
                    <Box id="children">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.children.heading')}
                        </Typography>
                        <Stack component="ul" spacing={1.5} sx={{ pl: 2 }}>
                            {t('legal.privacy.sections.children.items', { returnObjects: true }).map((item, idx) => (
                                <Typography
                                    component="li"
                                    key={idx}
                                    variant="body2"
                                    sx={{ lineHeight: 1.8 }}
                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Cookies */}
                    <Box id="cookies">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.cookies.heading')}
                        </Typography>
                        <Stack spacing={3}>
                            <PrivacySubsection
                                title={t('legal.privacy.sections.cookies.essential.title')}
                                items={t('legal.privacy.sections.cookies.essential.items', { returnObjects: true })}
                            />
                            <PrivacySubsection
                                title={t('legal.privacy.sections.cookies.advertising.title')}
                                items={t('legal.privacy.sections.cookies.advertising.items', { returnObjects: true })}
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Changes */}
                    <Box id="changes">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.changes.heading')}
                        </Typography>
                        <PrivacySubsection items={t('legal.privacy.sections.changes.items', { returnObjects: true })} />
                    </Box>

                    <Divider />

                    {/* Contact */}
                    <Box id="contact">
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                            {t('legal.privacy.sections.contact.heading')}
                        </Typography>
                        <Stack component="ul" spacing={1.5} sx={{ pl: 2 }}>
                            {t('legal.privacy.sections.contact.items', { returnObjects: true }).map((item, idx) => (
                                <Typography
                                    component="li"
                                    key={idx}
                                    variant="body2"
                                    sx={{ lineHeight: 1.8 }}
                                    dangerouslySetInnerHTML={{ __html: item }}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Stack>

                {/* Rights Summary Cards */}
                <Box sx={{ my: 6 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        {t('legal.privacy.rightsCardsHeading')}
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', md: 'grid' }}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                            gap: 2,
                        }}
                    >
                        {['access', 'delete', 'cookies', 'portability'].map((key) => (
                            <Card key={key} sx={{ boxShadow: 1 }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {t(`legal.privacy.rightsCards.${key}.title`)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                        {t(`legal.privacy.rightsCards.${key}.description`)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Box>

                {/* CTA */}
                <Paper sx={{ p: 4, backgroundColor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Ready to get started?
                    </Typography>
                    <Link href="/calendar" sx={{ textDecoration: 'none' }}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'primary.main',
                                fontWeight: 600,
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            {t('legal.privacy.navLinks.openClock')} →
                        </Typography>
                    </Link>
                </Paper>
            </Container>

            {/* Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }} />
        </Box>
    );
};

// Helper Components
const PrivacySubsection = ({ title, items }) => (
    <Box>
        {title && (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {title}
            </Typography>
        )}
        <Stack component="ul" spacing={1} sx={{ pl: 2 }}>
            {items.map((item, idx) => (
                <Typography component="li" key={idx} variant="body2" sx={{ lineHeight: 1.8 }}>
                    {item}
                </Typography>
            ))}
        </Stack>
    </Box>
);

const PrivacyUsageSubsection = ({ title, basis, items }) => (
    <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            <strong>Legal basis:</strong> {basis}
        </Typography>
        <Stack component="ul" spacing={1} sx={{ pl: 2 }}>
            {items.map((item, idx) => (
                <Typography component="li" key={idx} variant="body2" sx={{ lineHeight: 1.8 }}>
                    {item}
                </Typography>
            ))}
        </Stack>
    </Box>
);

// Document props for SSR
export const documentProps = {
    title: 'Privacy Policy | Time 2 Trade',
    description: 'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, legal bases for processing, retention timelines, and controls for consent, deletion, and ad personalization.',
    canonical: `${siteUrl}/privacy`,
    robots: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    ogImage,
    structuredData: [privacyWebPageSchema, privacyBreadcrumbSchema],
};

export default PrivacyPage;
