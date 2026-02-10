/**
 * src/components/ClockPage.jsx
 *
 * Purpose: Public /clock page — centered trading clock with filters and add-event row.
 * Renders PublicLayout shell with a single centered column containing:
 *   1. Page title
 *   2. ClockEventsFilters (shared stateless component — no date filter)
 *   3. Add custom event row
 *   4. ClockPanelPaper (trading clock canvas, overlays, session label, timezone selector)
 * All settings read from SettingsContext; filter changes delegate through updateEventFilters.
 * BEP: Mobile-first, responsive, i18n, theme-aware, centered viewport layout.
 *
 * Changelog:
 * v2.9.0 - 2026-02-10 - BUGFIX: handleSaveCustomEvent now actually persists to Firestore via useCustomEvents
 *                        hook (createEvent/saveEvent). Previously ignored the payload parameter — dialog
 *                        closed but data never saved. Matches App.jsx reference implementation.
 * v2.8.0 - 2026-02-10 - BEP: Wire onEditCustomEvent to EventModal so custom events show edit icon.
 *                        Adds editingEvent state + handleEditCustomEvent callback. CustomEventDialog
 *                        opens in edit mode at z-index 12003 (above EventModal). Resets on close.
 * v2.7.0 - 2026-02-07 - BEP LOADING ANIMATION: Replaced Skeleton rectangle Suspense fallback with
 *                        LoadingAnimation component. Shows rotating donut animation centered in the
 *                        clock panel while lazy component loads. Matches ClockPanelPaper internal
 *                        loading animation for consistent UX. Removed unused Skeleton import.
 * v2.6.0 - 2026-02-07 - BEP LOADING DISABLED: Added isLoadingEvents state + handleOverlayLoadingStateChange
 *                        callback. ClockPanelPaper passes onLoadingStateChange to ClockEventsOverlay.
 *                        When events are loading/filtering, ClockEventsFilters disables all interactive
 *                        elements (disabled={isLoadingEvents}). Prevents user filter changes during data
 *                        load. Performance priority: smooth UX with clear loading feedback.
 * v2.5.0 - 2026-02-07 - BEP VIEWPORT-FILL V2: Removed all hardcoded height overhead. Paper is now a flex
 *                        column that fills available viewport height (flex:1 + minHeight:0). Fixed chrome
 *                        (title, subtitle, filters, divider) renders naturally; clock wrapper absorbs all
 *                        remaining space via flex:1. ClockPanelPaper measures actual container dimensions
 *                        and sizes the clock to min(containerWidth, containerHeight). Zero scroll on
 *                        desktop/tablet; natural page scroll only on very small screens.
 * v2.4.0 - 2026-02-07 - BEP VIEWPORT-FILL: Replaced fixed maxWidth:560 Paper with responsive breakpoints.
 * v2.3.0 - 2026-02-07 - BEP SKELETON UX: Updated Suspense fallback skeleton from circular clock icon
 *                        to full rectangular Paper shape matching Calendar2Page right column. Skeleton
 *                        is width 100%, height 400px with borderRadius 3. Shows placeholder Paper
 *                        immediately while component lazy-loads. Event marker skeletons render independently
 *                        within ClockPanelPaper (do not block main skeleton). No wait for ClockEventsOverlay
 *                        markers - only waits for CSS. Prioritizes load speed and perceived performance.
 * v2.2.0 - 2026-02-07 - BEP TRUST SIGNAL: Replaced add-event icon with info icon showing Forex Factory
 *                        data source. Modal displays real-time data reliability message without sales copy.
 *                        Builds trust through transparent data sourcing (Forex Factory). Tooltip shows
 *                        "Powered by Forex Factory" to give immediate context.
 * v2.1.0 - 2026-02-07 - BEP LAYOUT REORDER: Moved ClockEventsFilters below the subtitle/add-event row.
 *                        New order: Title → Subtitle/Add row → Filters → Divider → Clock.
 *                        Improves visual hierarchy with descriptive text before filter options.
 * v2.0.0 - 2026-02-07 - REWRITE: Replaced App wrapper with standalone ClockPanelPaper + filters layout.
 *                        Clock is centered below title, ClockEventsFilters, and add-event row. Uses
 *                        PublicLayout + single-column Paper. Full modal support (Auth, Settings, Contact,
 *                        CustomEventDialog, EventModal). Matches Calendar2Page patterns for consistency.
 * v1.1.0 - 2026-01-29 - BEP PERFORMANCE: Added preloadNamespaces() for route-aware i18n loading.
 * v1.0.1 - 2026-01-22 - BEP REFACTOR: App now renders via PublicLayout with MobileHeader.
 * v1.0.0 - 2026-01-16 - Added public /clock wrapper with SEO metadata and App UI.
 */

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Tooltip,
    IconButton,
    Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PublicLayout from './PublicLayout';
import SEO from './SEO';
import LoadingAnimation from './LoadingAnimation';
import SourceInfoModal from './SourceInfoModal';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEngine } from '../hooks/useTimeEngine';
import useCustomEvents from '../hooks/useCustomEvents';
import { buildSeoMeta } from '../utils/seoMeta';
import { preloadNamespaces } from '../i18n/config';

const AuthModal2 = lazy(() => import('./AuthModal2'));
const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
const ContactModal = lazy(() => import('./ContactModal'));
const EventModal = lazy(() => import('./EventModal'));
const ClockPanelPaper = lazy(() => import('./ClockPanelPaper'));
const CustomEventDialog = lazy(() => import('./CustomEventDialog'));
const ClockEventsFilters = lazy(() => import('./ClockEventsFilters'));

const clockMeta = buildSeoMeta({
    title: 'Trading Clock & Sessions | Time 2 Trade',
    description:
        'Public trading clock for futures and forex: live session arcs, overlaps, countdowns, and economic events in one clean view.',
    path: '/clock',
});

export default function ClockPage() {
    const { t } = useTranslation(['calendar', 'filter', 'common']);
    const theme = useTheme();
    const settingsContext = useSettingsSafe();
    const { isAuthenticated } = useAuth();

    // BEP v2.9.0: Custom event CRUD (no subscription needed — only mutation functions)
    const { createEvent: createCustomEvent, saveEvent: saveCustomEvent } = useCustomEvents();

    // Preload namespaces
    useEffect(() => {
        preloadNamespaces([
            'calendar', 'filter', 'events', 'sessions', 'tooltips',
            'settings', 'a11y', 'auth', 'dialogs', 'reminders',
        ]);
    }, []);

    // ─── Clock Settings ───
    const timeEngine = useTimeEngine(settingsContext.selectedTimezone);

    // ─── Filter change handler — delegates to SettingsContext ───
    const handleFilterChange = useCallback((partialFilters) => {
        settingsContext.updateEventFilters?.(partialFilters);
    }, [settingsContext]);

    // ─── Loading state (from ClockEventsOverlay via ClockPanelPaper) ───
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const handleOverlayLoadingStateChange = useCallback((isLoading) => {
        setIsLoadingEvents(isLoading);
    }, []);

    // ─── Modal states ───
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customEditingEvent, setCustomEditingEvent] = useState(null);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleOpenAuth = useCallback(() => { setSettingsOpen(false); setAuthModalOpen(true); }, []);
    const handleCloseAuth = useCallback(() => setAuthModalOpen(false), []);
    const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
    const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
    const handleOpenContact = useCallback(() => setContactModalOpen(true), []);
    const handleCloseContact = useCallback(() => setContactModalOpen(false), []);
    const handleOpenCustomDialog = useCallback(() => setCustomDialogOpen(true), []);
    const handleCloseCustomDialog = useCallback(() => { setCustomDialogOpen(false); setCustomEditingEvent(null); }, []);
    // BEP v2.8.0: Edit custom event from EventModal → close modal → open dialog in edit mode
    const handleEditCustomEvent = useCallback((event) => {
        setSelectedEvent(null);
        setCustomEditingEvent(event);
        setCustomDialogOpen(true);
    }, []);
    const handleOpenInfo = useCallback(() => setInfoModalOpen(true), []);
    const handleCloseInfo = useCallback(() => setInfoModalOpen(false), []);
    const handleOpenTimezone = useCallback(() => setSettingsOpen(true), []);
    const handleOpenEvent = useCallback((event) => setSelectedEvent(event), []);
    const handleCloseEvent = useCallback(() => setSelectedEvent(null), []);

    // BEP v2.9.0: Persist custom event to Firestore with auth check
    const handleSaveCustomEvent = useCallback(async (payload) => {
        if (!isAuthenticated()) {
            setCustomDialogOpen(false);
            setAuthModalOpen(true);
            return;
        }
        const eventId = customEditingEvent?.seriesId || customEditingEvent?.id;
        const result = eventId
            ? await saveCustomEvent(eventId, payload)
            : await createCustomEvent(payload);
        if (result?.success) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
        }
    }, [isAuthenticated, createCustomEvent, customEditingEvent, saveCustomEvent]);

    const navItems = useAppBarNavItems({
        onOpenAuth: handleOpenAuth,
        onOpenSettings: handleOpenSettings,
        onOpenContact: handleOpenContact,
    });

    return (
        <>
            <SEO {...clockMeta} />

            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
                onOpenAddReminder={handleOpenCustomDialog}
            >
                {/* BEP v2.5.0: Viewport-fill flex layout — no scroll on desktop/tablet */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        px: { xs: 1.5, sm: 2, md: 0 },
                        pt: { xs: 2, sm: 2, md: 0 },
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                        overflow: 'hidden',
                    }}
                >
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: { xs: 2, sm: 1.3, md: 2 },
                            borderRadius: 3,
                            borderColor: 'divider',
                            boxShadow: 'none',
                            width: '100%',
                            maxWidth: { xs: '100%', sm: 620, md: 800, lg: 900 },
                            // BEP: Fill available height — fixed chrome stacks naturally,
                            // clock wrapper absorbs remaining space via flex:1
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Title with Info Icon */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1.5, gap: 0.75 }}
                        >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <Typography variant="h5" fontWeight={800}>
                                    {t('calendar:clock.title')}
                                </Typography>
                                <Tooltip title="Powered by Forex Factory" placement="right">
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenInfo}
                                        sx={{
                                            color: alpha(theme.palette.text.primary, 0.7),
                                            p: 0,
                                            minWidth: 'auto',
                                            minHeight: 'auto',
                                            '&:hover': {
                                                color: theme.palette.text.primary,
                                                bgcolor: 'transparent',
                                            },
                                        }}
                                        aria-label="Data source information"
                                    >
                                        <InfoIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <Tooltip title={t('calendar:tooltip.addReminder')} placement="left">
                                <IconButton
                                    size="medium"
                                    onClick={handleOpenCustomDialog}
                                    sx={{
                                        color: alpha(theme.palette.text.primary, 0.9),
                                        p: 0.75,
                                        border: '1.5px solid',
                                        borderColor: alpha(theme.palette.text.primary, 0.2),
                                        borderRadius: '50%',
                                        '&:hover': {
                                            borderColor: alpha(theme.palette.text.primary, 0.4),
                                            bgcolor: alpha(theme.palette.text.primary, 0.08),
                                        },
                                    }}
                                    aria-label={t('calendar:aria.addReminder')}
                                >
                                    <AddRoundedIcon fontSize="medium" />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Subtitle */}
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', fontWeight: 600, mb: 1.5 }}
                        >
                            {t('calendar:clock.subtitle')}
                        </Typography>

                        {/* Filters — shared stateless component (no date filter on /clock) */}
                        <Suspense fallback={null}>
                            <ClockEventsFilters
                                onChange={handleFilterChange}
                                disabled={isLoadingEvents}
                                sx={{ mb: 2 }}
                            />
                        </Suspense>

                        <Divider sx={{ borderColor: alpha('#3c4d63', 0.12), mb: 2 }} />

                        {/* Clock Panel — flex:1 absorbs all remaining Paper height */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <Suspense
                                fallback={
                                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                        <LoadingAnimation clockSize={200} isLoading />
                                    </Box>
                                }
                            >
                                <ClockPanelPaper
                                    timeEngine={timeEngine}
                                    clockTimezone={settingsContext.selectedTimezone}
                                    sessions={settingsContext.sessions}
                                    clockStyle={settingsContext.clockStyle}
                                    showSessionNamesInCanvas={settingsContext.showSessionNamesInCanvas}
                                    showPastSessionsGray={settingsContext.showPastSessionsGray}
                                    showClockNumbers={settingsContext.showClockNumbers}
                                    showClockHands={settingsContext.showClockHands}
                                    showHandClock={settingsContext.showHandClock}
                                    showDigitalClock={settingsContext.showDigitalClock}
                                    showSessionLabel={settingsContext.showSessionLabel}
                                    showTimeToEnd={settingsContext.showTimeToEnd}
                                    showTimeToStart={settingsContext.showTimeToStart}
                                    showEventsOnCanvas={settingsContext.showEventsOnCanvas}
                                    eventFilters={settingsContext.eventFilters}
                                    newsSource={settingsContext.newsSource}
                                    backgroundBasedOnSession={settingsContext.backgroundBasedOnSession}
                                    selectedTimezone={settingsContext.selectedTimezone}
                                    onOpenTimezone={handleOpenTimezone}
                                    onOpenEvent={handleOpenEvent}
                                    onOpenAddEvent={handleOpenCustomDialog}
                                    onLoadingStateChange={handleOverlayLoadingStateChange}
                                />
                            </Suspense>
                        </Box>
                    </Paper>
                </Box>
            </PublicLayout>

            {/* Modals */}
            <Suspense fallback={null}>
                {selectedEvent && (
                    <EventModal
                        open={Boolean(selectedEvent)}
                        onClose={handleCloseEvent}
                        event={selectedEvent}
                        timezone={settingsContext.selectedTimezone}
                        onEditCustomEvent={handleEditCustomEvent}
                    />
                )}
            </Suspense>
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
            <Suspense fallback={null}>
                <CustomEventDialog
                    open={customDialogOpen}
                    onClose={handleCloseCustomDialog}
                    onSave={handleSaveCustomEvent}
                    event={customEditingEvent}
                    defaultTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    zIndexOverride={customEditingEvent ? 12003 : undefined}
                />
            </Suspense>

            {/* Data Source Info Modal */}
            <SourceInfoModal open={infoModalOpen} onClose={handleCloseInfo} />
        </>
    );
}
