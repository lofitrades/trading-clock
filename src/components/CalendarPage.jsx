/**
 * src/components/CalendarPage.jsx
 * 
 * Purpose: Client-side calendar page shell that renders CalendarEmbed within PublicLayout.
 * No longer wraps with duplicate providers (Theme, Auth, Settings) - these are provided at app level.
 * Relies on app-level providers to ensure AppBar stays mounted during route navigation.
 * 
 * Changelog:
 * v1.3.1 - 2026-01-16 - Updated trading clock navigation target to /clock for new public route.
 * v1.3.0 - 2026-01-15 - PROVIDER REFACTOR: Removed duplicate ThemeProvider, AuthProvider, SettingsProvider, BrowserRouter, and CssBaseline. These are already provided at app level in main.jsx/AppBootstrap. CalendarPageShell now only handles page-specific state (auth modal, settings, contact modal) and navigation. This fixes the "white screen flash" issue where CalendarPage remounted on navigation, breaking AppBar persistence. PublicLayout now stays mounted across route changes, ensuring consistent navigation chrome.
 * v1.2.2 - 2026-01-14 - Close settings drawer before showing AuthModal2 and hide the drawer while AuthModal2 is open on /calendar to prevent z-index overlap with the unlock CTA.
 * Changelog:
 * v1.2.1 - 2026-01-14 - REMOVED DYNAMIC BACKGROUND: Removed BackgroundUpdater component; /calendar background should remain fixed at #F9F9F9. Only /app page has session-based background color changes (handled by App.jsx). Clock paper background in /calendar remains dynamic via CalendarEmbed settings.
 * v1.2.0 - 2026-01-14 - INSTANT BACKGROUND UPDATE: Added BackgroundUpdater component to apply session-based background color changes instantly on /calendar route, matching /app behavior. Updates document.body.style.backgroundColor when Session-based Background toggle is enabled/disabled or session changes.
 * v1.1.9 - 2026-01-13 - Removed banner toggle plumbing; CalendarEmbed now runs banner-free while keeping sticky navigation chrome.
 * v1.1.8 - 2026-01-13 - Swapped to PublicLayout for sticky navigation chrome and disabled in-embed banner to avoid duplication.
 * v1.1.7 - 2026-01-13 - Hooked contact nav item to ContactModal for in-context support without leaving /calendar.
 * v1.1.6 - 2026-01-13 - Added DashboardAppBar navigation to /calendar with router-aware fallback and mobile bottom nav support.
 * v1.1.5 - 2026-01-07 - Delegate back-to-top control to CalendarEmbed layout and simplify page shell.
 * v1.1.4 - 2026-01-07 - Rely on app-level CookiesBanner; removed local rendering on /calendar.
 * v1.1.3 - 2026-01-07 - Added inline consent banner on /calendar when the shared shell is bypassed.
 * v1.1.2 - 2026-01-07 - Added sticky back-to-top control at 30% viewport scroll for the calendar workspace.
 * v1.1.1 - 2026-01-07 - Remove nested BrowserRouter to avoid double-router error while still showing AuthModal2 for /calendar auth prompts.
 * v1.1.0 - 2026-01-07 - Keep calendar users on /calendar: show AuthModal2 instead of redirecting to /app for auth-required actions and provide router context for modal navigation.
 * v1.0.0 - 2026-01-06 - Added provider-wrapped calendar shell with safe-area setup and auth CTA routing.
 */

import { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import { setupViewportCssVars } from '../app/clientEffects';
import CalendarEmbed from './CalendarEmbed';
import PublicLayout from './PublicLayout';

const AuthModal2 = lazy(() => import('./AuthModal2'));
const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
const ContactModal = lazy(() => import('./ContactModal'));

export default function CalendarPage() {
    useEffect(() => {
        setupViewportCssVars();
    }, []);

    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);

    const handleOpenAuth = useCallback(() => {
        setSettingsOpen(false);
        setAuthModalOpen(true);
    }, []);

    const handleCloseAuth = useCallback(() => {
        setAuthModalOpen(false);
    }, []);

    const handleOpenSettings = useCallback(() => {
        setSettingsOpen(true);
    }, []);

    const handleOpenContact = useCallback(() => {
        setContactModalOpen(true);
    }, []);

    const handleCloseContact = useCallback(() => {
        setContactModalOpen(false);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setSettingsOpen(false);
    }, []);

    const navItems = useMemo(
        () => [
            {
                id: 'calendar',
                label: 'Calendar',
                shortLabel: 'Calendar',
                to: '/calendar',
                icon: <CalendarMonthRoundedIcon fontSize="small" />,
                ariaLabel: 'Economic calendar',
            },
            {
                id: 'clock',
                label: 'Trading Clock',
                shortLabel: 'Clock',
                to: '/clock',
                icon: <AccessTimeRoundedIcon fontSize="small" />,
                ariaLabel: 'Open the trading clock',
            },
            {
                id: 'about',
                label: 'About',
                shortLabel: 'About',
                to: '/about',
                icon: <InfoRoundedIcon fontSize="small" />,
                ariaLabel: 'Learn about Time 2 Trade',
            },
            {
                id: 'signin',
                label: 'Sign in',
                shortLabel: 'Sign in',
                icon: <LockOpenRoundedIcon fontSize="small" />,
                primary: true,
                ariaLabel: 'Sign in or create an account',
            },
        ],
        [],
    );

    return (
        <>
            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
            >
                <CalendarEmbed onOpenAuth={handleOpenAuth} isCalendarRoute />
            </PublicLayout>
            <Suspense fallback={null}>
                <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/clock" />
            </Suspense>
            <Suspense fallback={null}>
                <SettingsSidebar2
                    open={settingsOpen && !authModalOpen}
                    onClose={handleCloseSettings}
                    onOpenAuth={handleOpenAuth}
                    onOpenContact={handleOpenContact}
                />
            </Suspense>
            <Suspense fallback={null}>
                <ContactModal open={contactModalOpen} onClose={handleCloseContact} />
            </Suspense>
        </>
    );
}
