/**
 * src/components/CookiesBanner.tsx
 * 
 * Purpose: Reusable cookie/consent banner aligned bottom-right for marketing and calendar pages.
 * Presents a light, mobile-first surface with a primary CTA to allow ads or keep essential-only cookies.
 * 
 * Changelog:
 * v1.7.0 - 2026-02-12 - BEP LAZY LOAD: Lazy-loaded via AppRoutes with Suspense fallback={null}.
 *                       Also deferred with requestIdleCallback (setTimeout 500ms fallback) so
 *                       CookiesBanner renders last — after clock canvas is interactive. Banner
 *                       has internal 5s delay before showing anyway, so additional deferral
 *                       is non-blocking. Zero UX impact (banner shows after user interaction).
 * v1.6.0 - 2026-02-02 - BEP GDPR: Trigger Meta Pixel load when user clicks "Allow all".
 *                       Imported loadMetaPixel from consent.js. Called after consent is set.
 *                       Pixel is now consent-gated and only loads after explicit user action.
 * v1.5.0 - 2026-01-30 - BEP FIRESTORE SYNC: Implemented full cross-device consent persistence.
 *                       For authenticated users: Reads consent from Firestore first, then saves updates to Firestore + localStorage.
 *                       For guests: Uses localStorage as primary storage (backward compatible).
 *                       New useEffect checks user.uid and loads Firestore consent on auth state change.
 *                       handleConsent now calls saveConsentToFirestore() async when user is authenticated.
 *                       Maintains UI responsiveness with immediate localStorage updates + async Firestore sync.
 * v1.4.1 - 2026-01-30 - BEP COLOR: Changed privacy link color from primary.main to text.secondary for better visual hierarchy. Added hover state that transitions to text.primary. Link now uses secondary colors that adapt to light/dark theme, avoiding primary accent overuse.
 * v1.4.0 - 2026-01-30 - BEP THEME AWARE: Replaced all hardcoded colors with theme tokens. Changed surfaceColor to theme.palette.background.paper, borderColor to alpha(theme.palette.divider, 0.8), text colors to theme.palette.text.primary and text.secondary. Banner now adapts dynamically to light/dark theme modes with proper contrast and visual hierarchy.
 * v1.3.0 - 2026-01-30 - BEP: On xs breakpoint, horizontally center banner in viewport using left: 50% and transform: translateX(-50%). Maintains right: 12 positioning on sm and above for bottom-right alignment.
 * v1.2.0 - 2026-01-30 - i18n: Replaced all hardcoded strings (heading, description, button labels, link text) 
 * with i18n translations from dialogs.cookies namespace (EN/ES/FR). Added useTranslation hook and t() calls.
 * v1.1.0 - 2026-01-07 - Add 5s delay before showing banner and skip entirely if consent already stored.
 * v1.0.1 - 2026-01-07 - Removed primary CTA glow to simplify banner styling.
 * v1.0.0 - 2026-01-07 - Created shared consent banner with responsive bottom-right layout and primary CTA.
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Link, Stack, Typography, useTheme, alpha } from '@mui/material';
import {
    CONSENT_ACCEPTED,
    CONSENT_ESSENTIAL,
    CONSENT_UNKNOWN,
    readConsentStatus,
    setConsentStatus,
    subscribeConsent,
    saveConsentToFirestore,
    readConsentFromFirestore,
    loadMetaPixel,
} from '../utils/consent';
import { useAuth } from '../contexts/AuthContext';

type ConsentValue = typeof CONSENT_ACCEPTED | typeof CONSENT_ESSENTIAL | typeof CONSENT_UNKNOWN;

type CookiesBannerProps = {
    className?: string;
};

export default function CookiesBanner({ className }: CookiesBannerProps) {
    const theme = useTheme();
    const { t } = useTranslation('dialogs');
    const { user } = useAuth();
    const [consent, setConsent] = useState<ConsentValue>(CONSENT_UNKNOWN);
    const [readyToShow, setReadyToShow] = useState<boolean>(false);

    // BEP: Compute theme-aware colors
    const surfaceColor = useMemo(() => theme.palette.background.paper, [theme.palette.background.paper]);
    const borderColor = useMemo(() => alpha(theme.palette.divider, 0.8), [theme.palette.divider, theme]);
    const textColor = useMemo(() => theme.palette.text.primary, [theme.palette.text.primary]);
    const secondaryTextColor = useMemo(() => theme.palette.text.secondary, [theme.palette.text.secondary]);
    const primaryColor = useMemo(() => theme.palette.primary.main, [theme.palette.primary.main]);

    // BEP: Load consent from Firestore (if authenticated) or localStorage (if guest)
    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const loadConsent = async () => {
            // Check Firestore first if user is authenticated
            if (user && typeof user === 'object' && 'uid' in user) {
                const firestoreConsent = await readConsentFromFirestore((user as any).uid);
                if (firestoreConsent && !cancelled && (firestoreConsent === CONSENT_ACCEPTED || firestoreConsent === CONSENT_ESSENTIAL)) {
                    setConsent(firestoreConsent as ConsentValue);
                    setReadyToShow(false);
                    return;
                }
            }

            // Fall back to localStorage
            const localConsent = readConsentStatus();
            if (!cancelled) {
                setConsent(localConsent);
                if (localConsent === CONSENT_UNKNOWN) {
                    // Schedule banner to show after 5s delay
                    timer = setTimeout(() => {
                        if (!cancelled) setReadyToShow(true);
                    }, 5000);
                } else {
                    setReadyToShow(false);
                }
            }
        };

        loadConsent();
        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [user]);

    useEffect(() => {
        const unsubscribe = subscribeConsent((value: ConsentValue) => {
            setConsent(value);
            if (value !== CONSENT_UNKNOWN) {
                setReadyToShow(false);
            }
        });
        return unsubscribe;
    }, []);

    const handleConsent = useCallback((value: ConsentValue) => {
        setConsent(value);
        // Always update localStorage for immediate cross-tab communication
        setConsentStatus(value);
        // BEP: Also sync to Firestore if user is authenticated (async, non-blocking)
        if (user && typeof user === 'object' && 'uid' in user) {
            saveConsentToFirestore((user as any).uid, value).catch((error) => {
                console.error('Failed to save consent to Firestore:', error);
            });
        }
        // BEP GDPR: Load Meta Pixel only when user explicitly accepts
        if (value === CONSENT_ACCEPTED) {
            loadMetaPixel();
        }
    }, [user]);

    // Do not render if consent is already set or delay hasn't elapsed
    if (consent !== CONSENT_UNKNOWN || !readyToShow) return null;

    return (
        <Box
            component="section"
            role="dialog"
            aria-label="Cookie consent"
            className={className}
            sx={{
                position: 'fixed',
                left: { xs: '50%', sm: 'auto' },
                right: { xs: 'auto', sm: 12 },
                bottom: { xs: 12, sm: 12 },
                width: { xs: 'min(94vw, 420px)', sm: 360 },
                transform: { xs: 'translateX(-50%)', sm: 'none' },
                bgcolor: surfaceColor,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
                p: 2.25,
                zIndex: 1700,
            }}
        >
            <Stack spacing={1.25} alignItems="flex-start">
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {t('cookies.heading')}
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryTextColor, lineHeight: 1.55 }}>
                    {t('cookies.description')}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Button
                        onClick={() => handleConsent(CONSENT_ACCEPTED)}
                        variant="contained"
                        color="primary"
                        size="medium"
                        sx={{
                            flex: 1,
                            fontWeight: 800,
                            py: 1.05,
                            px: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                        }}
                    >
                        {t('cookies.allowAll')}
                    </Button>
                    <Button
                        onClick={() => handleConsent(CONSENT_ESSENTIAL)}
                        variant="text"
                        color="inherit"
                        size="medium"
                        sx={{
                            flexShrink: 0,
                            fontWeight: 700,
                            color: textColor,
                            textTransform: 'none',
                            px: 1,
                        }}
                    >
                        {t('cookies.essentialOnly')}
                    </Button>
                </Stack>
                <Link
                    href="/privacy"
                    underline="hover"
                    sx={{
                        fontWeight: 700,
                        color: secondaryTextColor,
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        alignSelf: 'center',
                        '&:hover': {
                            color: textColor,
                        },
                    }}
                >
                    {t('cookies.privacyLink')}
                </Link>
                
            </Stack>
        </Box>
    );
}
