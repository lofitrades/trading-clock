/**
 * src/components/CalendarPage.jsx
 * 
 * Purpose: Client-side calendar page shell that wires providers, theme, and viewport fixes
 * around the embeddable CalendarEmbed component for the /calendar route and in-app reuse.
 * 
 * Changelog:
 * v1.1.4 - 2026-01-07 - Rely on app-level CookiesBanner; removed local rendering on /calendar.
 * v1.1.3 - 2026-01-07 - Added inline consent banner on /calendar when the shared shell is bypassed.
 * v1.1.2 - 2026-01-07 - Added sticky back-to-top control at 30% viewport scroll for the calendar workspace.
 * v1.1.1 - 2026-01-07 - Remove nested BrowserRouter to avoid double-router error while still showing AuthModal2 for /calendar auth prompts.
 * v1.1.0 - 2026-01-07 - Keep calendar users on /calendar: show AuthModal2 instead of redirecting to /app for auth-required actions and provide router context for modal navigation.
 * v1.0.0 - 2026-01-06 - Added provider-wrapped calendar shell with safe-area setup and auth CTA routing.
 */

import { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { CssBaseline, Box, IconButton } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { setupViewportCssVars } from '../app/clientEffects';
import CalendarEmbed from './CalendarEmbed';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const AuthModal2 = lazy(() => import('./AuthModal2'));

export default function CalendarPage() {
    useEffect(() => {
        setupViewportCssVars();
    }, []);

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);

    const handleOpenAuth = useCallback(() => {
        setAuthModalOpen(true);
    }, []);

    const handleCloseAuth = useCallback(() => {
        setAuthModalOpen(false);
    }, []);

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const viewportHeight = document.documentElement?.clientHeight || window.innerHeight || 0;
            const threshold = viewportHeight * 0.3;
            const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
            setShowBackToTop(scrolled > threshold);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <SettingsProvider>
                    <Box component="main" sx={{ minHeight: 'var(--t2t-vv-height, 100dvh)', bgcolor: '#050b12' }}>
                        <CalendarEmbed onOpenAuth={handleOpenAuth} />
                    </Box>
                    <Suspense fallback={null}>
                        <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/calendar" />
                    </Suspense>
                    {showBackToTop && (
                        <Box
                            sx={{
                                position: 'fixed',
                                right: { xs: 12, sm: 18, md: 24 },
                                bottom: { xs: 18, sm: 22, md: 26 },
                                zIndex: 1400,
                            }}
                        >
                            <IconButton
                                aria-label="Back to top"
                                onClick={() => {
                                    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                                    window.scrollTo({ top: 0, behavior });
                                }}
                                sx={{
                                    bgcolor: '#0F172A',
                                    color: '#ffffff',
                                    boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    width: 48,
                                    height: 48,
                                    '&:hover': { bgcolor: '#16213a' },
                                    '&:focus-visible': {
                                        outline: '2px solid #0ea5e9',
                                        outlineOffset: 3,
                                    },
                                }}
                            >
                                <ArrowUpwardIcon />
                            </IconButton>
                        </Box>
                    )}
                </SettingsProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
