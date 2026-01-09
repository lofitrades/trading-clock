/**
 * src/components/CookiesBanner.tsx
 * 
 * Purpose: Reusable cookie/consent banner aligned bottom-right for marketing and calendar pages.
 * Presents a light, mobile-first surface with a primary CTA to allow ads or keep essential-only cookies.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-07 - Add 5s delay before showing banner and skip entirely if consent already stored.
 * v1.0.1 - 2026-01-07 - Removed primary CTA glow to simplify banner styling.
 * v1.0.0 - 2026-01-07 - Created shared consent banner with responsive bottom-right layout and primary CTA.
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import {
    CONSENT_ACCEPTED,
    CONSENT_ESSENTIAL,
    CONSENT_UNKNOWN,
    readConsentStatus,
    setConsentStatus,
    subscribeConsent,
} from '../utils/consent';

const surfaceColor = 'rgba(255,255,255,0.98)';
const borderColor = 'rgba(15,23,42,0.08)';

type ConsentValue = typeof CONSENT_ACCEPTED | typeof CONSENT_ESSENTIAL | typeof CONSENT_UNKNOWN;

type CookiesBannerProps = {
    className?: string;
};

export default function CookiesBanner({ className }: CookiesBannerProps) {
    const theme = useTheme();
    const [consent, setConsent] = useState<ConsentValue>(CONSENT_UNKNOWN);
    const [readyToShow, setReadyToShow] = useState<boolean>(false);

    useEffect(() => {
        // Read existing consent immediately and set delayed show only if unknown
        let timer: ReturnType<typeof setTimeout> | undefined;
        const initial = readConsentStatus();
        setConsent(initial);
        if (initial === CONSENT_UNKNOWN) {
            timer = setTimeout(() => setReadyToShow(true), 5000);
        } else {
            setReadyToShow(false);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

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
        setConsentStatus(value);
    }, []);

    // Do not render if consent is already set or delay hasn't elapsed
    if (consent !== CONSENT_UNKNOWN || !readyToShow) return null;

    const primaryColor = theme?.palette?.primary?.main || '#2563eb';

    return (
        <Box
            component="section"
            role="dialog"
            aria-label="Cookie consent"
            className={className}
            sx={{
                position: 'fixed',
                right: 12,
                bottom: 12,
                width: { xs: 'min(94vw, 420px)', sm: 360 },
                bgcolor: surfaceColor,
                color: '#0f172a',
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                boxShadow: '0 16px 40px rgba(15,23,42,0.16)',
                p: 2.25,
                zIndex: 1700,
            }}
        >
            <Stack spacing={1.25} alignItems="flex-start">
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    We use cookies
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.55 }}>
                    Essential cookies keep Time 2 Trade running. Ads use Google AdSense and can stay non-personalized unless you allow them.
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
                        Allow all
                    </Button>
                    <Button
                        onClick={() => handleConsent(CONSENT_ESSENTIAL)}
                        variant="text"
                        color="inherit"
                        size="medium"
                        sx={{
                            flexShrink: 0,
                            fontWeight: 700,
                            color: '#0f172a',
                            textTransform: 'none',
                            px: 1,
                        }}
                    >
                        Essential only
                    </Button>
                </Stack>
                <Link
                    href="/privacy"
                    underline="hover"
                    sx={{
                        fontWeight: 700,
                        color: primaryColor,
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        alignSelf: 'center',
                    }}
                >
                    Privacy & cookies
                </Link>
                
            </Stack>
        </Box>
    );
}
