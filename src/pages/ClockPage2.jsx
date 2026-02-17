/**
 * src/pages/ClockPage2.jsx
 *
 * Purpose: Primary /clock page — two-column layout using MainLayout.
 * Left column: Full ClockPanelPaper (market clock canvas, overlays, timezone selector).
 * Right column: TabbedStickyPanel with Session Overview and Upcoming Events tabs.
 * BEP: Mobile-first, responsive, i18n, theme-aware, lazy-loaded, optimized for loading speed.
 *
 * Architecture:
 * - Uses MainLayout (2fr 1fr grid on md+, stacked on xs/sm)
 * - ClockPanelPaper adapts to column container width via useClockPage2 route detection
 * - TabbedStickyPanel provides Chrome-like tab UI with session persistence
 * - All modals managed locally (AuthModal2, SettingsSidebar2, ContactModal, CustomEventDialog, EventModal)
 * - Filters delegate to SettingsContext via ClockEventsFilters
 * - SEO metadata via buildSeoMeta
 *
 * Changelog:
 * v1.6.0 - 2026-02-13 - BEP EVENTS TABLE: Replaced placeholder Events tab with live ClockEventsTable.
 *                        Compact today-only events table with NOW/NEXT badges, currency flags, impact
 *                        dots, monospace time column. Fixed to "today" date preset. Reads currency/impact
 *                        filters from SettingsContext. Lazy-loaded with LoadingAnimation fallback.
 *                        Event rows open EventModal on click. Full i18n (EN/ES/FR).
 * v1.5.0 - 2026-02-13 - BEP CLOCK INFO MODAL: Replaced SourceInfoModal with new ClockInfoModal on
 *                        the info icon next to Market Clock title. ClockInfoModal explains dual-circle
 *                        design, session arcs, overlaps, countdowns, and events. Full i18n (EN/ES/FR)
 *                        via dialogs:clockInfo namespace. Tooltip and aria-label use translation keys.
 * v1.4.0 - 2026-02-13 - BEP SKELETON UX: Added skeleton loading states to all Overview tab elements
 *                        (info button, add-reminder button, filters, session icon, SessionLabel).
 *                        Prevents layout shift and provides visual feedback during i18n/lazy loading.
 * v1.3.0 - 2026-02-13 - BEP TABBED UI: Wrapped right column content in TabbedStickyPanel with
 *                        two tabs: "Overview" (Session Overview with filters, session label, and
 *                        coming soon features) and "Events" (Upcoming Events placeholder for future
 *                        economic events timeline). Added i18n tab labels (EN/ES/FR). Chrome-like
 *                        tab styling with session-level persistence per route.
 * v1.2.0 - 2026-02-13 - BEP UI CLEANUP: Removed subtitle from right column. Added SessionLabel
 *                        component to right sidebar below description text. Integrated useClock
 *                        hook to provide session data (activeSession, nextSession, timeToEnd,
 *                        timeToStart) for SessionLabel rendering. SessionLabel now lives in
 *                        sidebar instead of below clock canvas for better layout balance.
 * v1.1.0 - 2026-02-13 - BEP LAYOUT OPTIMIZATION: Moved title, subtitle, filters, and add-event
 *                        button from left column to right column header. Left column now contains
 *                        only ClockPanelPaper for maximum clock canvas height. Right column has
 *                        full controls header + placeholder content. Improved clock visibility.
 * v1.0.0 - 2026-02-13 - Initial implementation. Refactored clock page with MainLayout two-column
 *                        design. Left column: ClockPanelPaper with full responsive sizing. Right column:
 *                        placeholder for future features. BEP: Lazy-loaded components, i18n translations,
 *                        mobile-first responsive, theme-aware, optimized loading speed.
 */

import { useState, useCallback, useEffect, lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Stack,
    Tooltip,
    IconButton,
    Divider,
    Skeleton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DonutLargeRoundedIcon from '@mui/icons-material/DonutLargeRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LabelRoundedIcon from '@mui/icons-material/LabelRounded';

import PublicLayout from '../components/PublicLayout';
import MainLayout from '../components/layouts/MainLayout';
import SEO from '../components/SEO';
import LoadingAnimation from '../components/LoadingAnimation';

import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { useClock } from '../hooks/useClock';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEngine } from '../hooks/useTimeEngine';
import useCustomEvents from '../hooks/useCustomEvents';
import { useEventNotes } from '../hooks/useEventNotes';
import { buildSeoMeta } from '../utils/seoMeta';
import { preloadNamespaces } from '../i18n/config';

// Lazy-loaded components for code splitting
const ClockInfoModal = lazy(() => import('../components/ClockInfoModal'));
const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const EventModal = lazy(() => import('../components/EventModal'));
const ClockPanelPaper = lazy(() => import('../components/ClockPanelPaper'));
const CustomEventDialog = lazy(() => import('../components/CustomEventDialog'));
const EventNotesDialog = lazy(() => import('../components/EventNotesDialog'));
const ClockEventsFilters = lazy(() => import('../components/ClockEventsFilters'));
const SessionLabel = lazy(() => import('../components/SessionLabel'));
const ClockEventsTable = lazy(() => import('../components/ClockEventsTable'));

// ============================================================================
// SEO METADATA
// ============================================================================

const clockMeta = buildSeoMeta({
    title: 'Market Clock & Sessions | Time 2 Trade',
    description:
        'Live market clock for futures and forex traders: session arcs, overlaps, countdowns, and economic events — all in one clean two-column layout.',
    path: '/clock',
});



// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ClockPage2() {
    const { t } = useTranslation(['calendar', 'filter', 'common', 'clockPage', 'dialogs']);
    const theme = useTheme();
    const settingsContext = useSettingsSafe();
    const { isAuthenticated } = useAuth();

    // Preload namespaces
    useEffect(() => {
        preloadNamespaces([
            'calendar', 'filter', 'events', 'sessions', 'tooltips',
            'settings', 'a11y', 'auth', 'dialogs', 'reminders', 'clockPage',
        ]);
    }, []);

    // ─── Clock Settings ───
    const timeEngine = useTimeEngine(settingsContext.selectedTimezone);

    // ─── Session data for SessionLabel in right column ───
    const { activeSession, nextSession, timeToEnd, timeToStart } = useClock(
        settingsContext.selectedTimezone,
        settingsContext.sessions || [],
        timeEngine
    );

    // ─── Custom event CRUD (mutation-only, no subscription needed on clock page) ───
    const { createEvent: createCustomEvent, saveEvent: saveCustomEvent, removeEvent: removeCustomEvent } = useCustomEvents();

    // ─── Event notes support ───
    const {
        hasNotes,
        ensureNotesStream,
        stopNotesStream,
        addNote,
        removeNote,
        isEventNotesLoading,
        getNotesForEvent,
    } = useEventNotes();
    const [noteTarget, setNoteTarget] = useState(null);

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

    // ─── Modal handlers ───
    const handleOpenAuth = useCallback(() => { setSettingsOpen(false); setAuthModalOpen(true); }, []);
    const handleCloseAuth = useCallback(() => setAuthModalOpen(false), []);
    const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
    const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
    const handleOpenContact = useCallback(() => setContactModalOpen(true), []);
    const handleCloseContact = useCallback(() => setContactModalOpen(false), []);

    const handleOpenCustomDialog = useCallback(() => {
        if (!isAuthenticated()) {
            setAuthModalOpen(true);
        } else {
            setCustomDialogOpen(true);
        }
    }, [isAuthenticated]);

    const handleCloseCustomDialog = useCallback(() => {
        setCustomDialogOpen(false);
        setCustomEditingEvent(null);
    }, []);

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

    // ─── Notes handlers ───
    const handleOpenNotes = useCallback((event) => {
        const result = ensureNotesStream(event);
        if (result?.requiresAuth) {
            setAuthModalOpen(true);
            return;
        }
        setNoteTarget(event);
    }, [ensureNotesStream]);

    const handleCloseNotes = useCallback(() => {
        if (noteTarget) stopNotesStream(noteTarget);
        setNoteTarget(null);
    }, [noteTarget, stopNotesStream]);

    const handleAddNote = useCallback(async (content) => {
        if (!noteTarget) return { success: false, requiresAuth: false };
        const result = await addNote(noteTarget, content);
        if (result?.requiresAuth) setAuthModalOpen(true);
        return result;
    }, [addNote, noteTarget]);

    const handleRemoveNote = useCallback(async (noteId) => {
        if (!noteTarget) return { success: false, requiresAuth: false };
        const result = await removeNote(noteTarget, noteId);
        if (result?.requiresAuth) setAuthModalOpen(true);
        return result;
    }, [noteTarget, removeNote]);

    // ─── Custom event CRUD handlers ───
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

    const handleDeleteCustomEvent = useCallback(async (eventToDelete) => {
        const eventId = eventToDelete?.seriesId || eventToDelete?.id;
        if (!eventId) return;
        const confirmed = window.confirm('Delete this reminder?');
        if (!confirmed) return;
        const result = await removeCustomEvent(eventId);
        if (result?.success) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
        }
    }, [removeCustomEvent]);

    // ─── Navigation items ───
    const navItems = useAppBarNavItems({
        onOpenAuth: handleOpenAuth,
        onOpenSettings: handleOpenSettings,
        onOpenContact: handleOpenContact,
    });

    // ============================================================================
    // LEFT COLUMN: Clock Panel only (maximized canvas space)
    // ============================================================================
    const leftContent = useMemo(() => (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Clock Panel — fills entire column height */}
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
        </Box>
    ), [
        timeEngine, settingsContext, handleOpenTimezone, handleOpenEvent,
        handleOpenCustomDialog, handleOverlayLoadingStateChange,
    ]);

    // ============================================================================
    // RIGHT COLUMN: Tabbed panel with Session Overview and Upcoming Events
    // ============================================================================

    // Tab 1: Session Overview content (moved from direct rightContent)
    const sessionOverviewContent = useMemo(() => (
        <Box>
            {/* Header: Title + Info + Add Reminder */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5, gap: 0.75 }}
            >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="h6" fontWeight={800}>
                        {t('calendar:clock.title')}
                    </Typography>
                    <Tooltip title={t('dialogs:clockInfo.title')} placement="right">
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
                            aria-label={t('dialogs:clockInfo.title')}
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

            {/* Filters — shared stateless component (no date filter on clock page) */}
            <Suspense fallback={
                <Stack spacing={1} sx={{ mb: 2 }}>
                    <Skeleton variant="rounded" width="100%" height={36} sx={{ borderRadius: 2 }} />
                    <Skeleton variant="rounded" width="60%" height={28} sx={{ borderRadius: 2 }} />
                </Stack>
            }>
                <ClockEventsFilters
                    onChange={handleFilterChange}
                    disabled={isLoadingEvents}
                    sx={{ mb: 2 }}
                />
            </Suspense>

            <Divider sx={{ borderColor: alpha('#3c4d63', 0.12), mb: 2 }} />

            {/* Quick session overview */}
            <Stack spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTimeIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight={800}>
                        {t('clockPage:sidebar.title')}
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t('clockPage:sidebar.description')}
                </Typography>

                {/* Session Label — moved from ClockPanelPaper to sidebar */}
                <Suspense fallback={
                    <Skeleton variant="rounded" width="100%" height={42} sx={{ mt: 1, borderRadius: 2 }} />
                }>
                    <SessionLabel
                        activeSession={activeSession}
                        showTimeToEnd={settingsContext.showTimeToEnd}
                        timeToEnd={timeToEnd}
                        showTimeToStart={settingsContext.showTimeToStart}
                        nextSession={nextSession}
                        timeToStart={timeToStart}
                        clockSize={320}
                        contrastTextColor={theme.palette.text.primary}
                        backgroundBasedOnSession={settingsContext.backgroundBasedOnSession}
                    />
                </Suspense>

            </Stack>

            {/* ─── How It Works — mini guide ─────────────────────── */}
            <Divider sx={{ borderColor: alpha('#3c4d63', 0.12), mt: 2.5, mb: 2 }} />

            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                {t('clockPage:guide.heading')}
            </Typography>

            <Stack spacing={1.5}>
                {[
                    { icon: <DonutLargeRoundedIcon />, key: 'dualCircle' },
                    { icon: <AccessTimeIcon />, key: 'sessionArcs' },
                    { icon: <FiberManualRecordIcon />, key: 'eventMarkers' },
                    { icon: <LabelRoundedIcon />, key: 'sessionLabel' },
                    { icon: <TuneRoundedIcon />, key: 'filters' },
                    { icon: <PublicRoundedIcon />, key: 'timezone' },
                    { icon: <AutoAwesomeRoundedIcon />, key: 'tip' },
                ].map(({ icon, key }) => (
                    <Stack key={key} direction="row" spacing={1.25} alignItems="flex-start">
                        <Box
                            sx={{
                                mt: 0.25,
                                color: key === 'tip' ? 'warning.main' : 'primary.main',
                                fontSize: 18,
                                lineHeight: 0,
                                flexShrink: 0,
                            }}
                        >
                            {icon}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>
                                {t(`clockPage:guide.${key}.title`)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mt: 0.25 }}>
                                {t(`clockPage:guide.${key}.body`)}
                            </Typography>
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </Box>
    ), [t, theme, handleOpenInfo, handleOpenCustomDialog, handleFilterChange, isLoadingEvents, activeSession, nextSession, timeToEnd, timeToStart, settingsContext]);

    // Tab 2: Today's Events — compact table with NOW/NEXT badges, currency/impact aware
    const upcomingEventsContent = useMemo(() => (
        <Suspense fallback={
            <Box sx={{ py: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LoadingAnimation clockSize={120} isLoading />
            </Box>
        }>
            <ClockEventsTable
                onOpenEvent={handleOpenEvent}
            />
        </Suspense>
    ), [handleOpenEvent]);

    // TabbedStickyPanel tabs configuration
    const rightTabs = useMemo(() => [
        {
            key: 'session-overview',
            label: t('clockPage:tabs.sessionOverview'),
            icon: <AccessTimeIcon sx={{ fontSize: 16 }} />,
            content: sessionOverviewContent,
        },
        {
            key: 'upcoming-events',
            label: t('clockPage:tabs.upcomingEvents.label'),
            icon: <EventNoteIcon sx={{ fontSize: 16 }} />,
            content: upcomingEventsContent,
        },
    ], [t, sessionOverviewContent, upcomingEventsContent]);

    return (
        <>
            <SEO {...clockMeta} />

            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
                onOpenAddReminder={handleOpenCustomDialog}
            >
                <MainLayout
                    left={leftContent}
                    rightTabs={rightTabs}
                    gap={3}
                    stickyTop={0}
                />
            </PublicLayout>

            {/* ─── Modals ─── */}
            <Suspense fallback={null}>
                {selectedEvent && (
                    <EventModal
                        open={Boolean(selectedEvent)}
                        onClose={handleCloseEvent}
                        event={selectedEvent}
                        timezone={settingsContext.selectedTimezone}
                        hasEventNotes={hasNotes}
                        onOpenNotes={handleOpenNotes}
                        isEventNotesLoading={isEventNotesLoading}
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
                    onDelete={handleDeleteCustomEvent}
                    event={customEditingEvent}
                    defaultTimezone={settingsContext.selectedTimezone}
                    zIndexOverride={customEditingEvent ? 12003 : undefined}
                />
            </Suspense>

            {/* Clock Info Modal */}
            <Suspense fallback={null}>
                <ClockInfoModal open={infoModalOpen} onClose={handleCloseInfo} />
            </Suspense>

            {/* Event Notes Dialog */}
            <Suspense fallback={null}>
                <EventNotesDialog
                    open={Boolean(noteTarget)}
                    onClose={handleCloseNotes}
                    event={noteTarget}
                    notes={noteTarget ? getNotesForEvent(noteTarget) : []}
                    onAddNote={handleAddNote}
                    onRemoveNote={handleRemoveNote}
                    isLoading={noteTarget && isEventNotesLoading(noteTarget)}
                />
            </Suspense>
        </>
    );
}
