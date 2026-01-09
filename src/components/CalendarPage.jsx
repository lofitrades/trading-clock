/**
 * src/components/CalendarPage.jsx
 * 
 * Purpose: Client-side calendar page shell that wires providers, theme, and viewport fixes
 * around the embeddable CalendarEmbed component for the /calendar route and in-app reuse.
 * 
 * Changelog:
 * v1.1.5 - 2026-01-07 - Delegate back-to-top control to CalendarEmbed layout and simplify page shell.
 * v1.1.4 - 2026-01-07 - Rely on app-level CookiesBanner; removed local rendering on /calendar.
 * v1.1.3 - 2026-01-07 - Added inline consent banner on /calendar when the shared shell is bypassed.
 * v1.1.2 - 2026-01-07 - Added sticky back-to-top control at 30% viewport scroll for the calendar workspace.
 * v1.1.1 - 2026-01-07 - Remove nested BrowserRouter to avoid double-router error while still showing AuthModal2 for /calendar auth prompts.
 * v1.1.0 - 2026-01-07 - Keep calendar users on /calendar: show AuthModal2 instead of redirecting to /app for auth-required actions and provide router context for modal navigation.
 * v1.0.0 - 2026-01-06 - Added provider-wrapped calendar shell with safe-area setup and auth CTA routing.
 */

import { useCallback, useEffect, useState, Suspense, lazy } from 'react';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { setupViewportCssVars } from '../app/clientEffects';
import CalendarEmbed from './CalendarEmbed';

const AuthModal2 = lazy(() => import('./AuthModal2'));

export default function CalendarPage() {
    useEffect(() => {
        setupViewportCssVars();
    }, []);

    const [authModalOpen, setAuthModalOpen] = useState(false);

    const handleOpenAuth = useCallback(() => {
        setAuthModalOpen(true);
    }, []);

    const handleCloseAuth = useCallback(() => {
        setAuthModalOpen(false);
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
                </SettingsProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
