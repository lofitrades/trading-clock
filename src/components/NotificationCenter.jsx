/**
 * src/components/NotificationCenter.jsx
 * 
 * Purpose: Compact notification center for custom reminder alerts.
 * Key responsibility and main functionality: Display unread counts, list recent notifications,
 * and provide quick actions to mark as read or clear.
 * 
 * Changelog:
 * v1.6.0  - 2026-02-12 - BUGFIX: CustomEventDialog now has onDelete={handleDeleteCustomEvent} prop.
 *                        Delete button was not connected — modal didn't call removeCustomEvent. Also
 *                        added removeEvent to useCustomEvents destructure. Delete now works BEP.
 * v1.5.0  - 2026-02-12 - BUGFIX: CustomEventDialog defaultTimezone now uses selectedTimezone from
 *                        useSettingsSafe instead of Intl device timezone. Ensures custom event time is
 *                        interpreted in the user's selected timezone, not the browser's local timezone.
 * v1.4.0  - 2026-02-10 - BEP INTERACTION FEEDBACK: Mark notification as read on hover (desktop)
 *                        or click/tap (mobile/desktop). Added handleNotificationHover() + 
 *                        onMouseEnter handler to MenuItem. Unread notifications change from
 *                        action.selected (highlighted) to transparent on interaction, providing
 *                        immediate visual feedback that the message has been consumed.
 * v1.3.0  - 2026-02-10 - BUGFIX: onSave on CustomEventDialog now actually persists to Firestore via
 *                        useCustomEvents hook (createEvent/saveEvent). Previously used handleCloseCustomDialog
 *                        as onSave — dialog closed but data never saved.
 * v1.2.0  - 2026-02-10 - BEP: Self-contained edit custom event support. Adds CustomEventDialog
 *                        (lazy) so clicking Edit in EventModal opens edit form without prop-drilling
 *                        through MobileHeader/PublicLayout.
 * v1.1.0  - 2026-02-07 - BEP: Defense-in-depth dedup in visibleNotifications. Deduplicates
 *                        by eventKey+eventEpochMs+channel to guarantee one notification per
 *                        event per occurrence in the UI, even if upstream has edge cases.
 * v1.0.21 - 2026-01-29 - BEP THEME-AWARE: Replaced hardcoded #fff with background.paper and
 *                        rgba shadow colors with theme-aware values.
 * v1.0.20 - 2026-01-24 - Phase 2 i18n migration: Add notification namespace.
 * v1.0.19 - 2026-01-22 - BEP UI CONSISTENCY: Increase bell icon glyph size.
 * v1.0.18 - 2026-01-22 - BEP UI CONSISTENCY: Increase bell icon glyph size on xs/sm.
 * v1.0.17 - 2026-01-22 - BEP UI CONSISTENCY: Change bell icon background.
 * v1.0.16 - 2026-01-22 - BEP BUGFIX: Add defensive anchorEl validation.
 * v1.0.15 - 2026-01-22 - BEP UI: Increase top margin.
 * v1.0.14 - 2026-01-22 - BEP UI: Match container display flex.
 * v1.0.13 - 2026-01-22 - BEP UI: Match Menu structure to UserAvatar.
 * v1.0.12 - 2026-01-22 - BEP UI: Match notification menu styling.
 * v1.0.11 - 2026-01-22 - BEP UI: Align bell icon color.
 * v1.0.10 - 2026-01-22 - BEP UI: Match bell button styling.
 * v1.0.9  - 2026-01-22 - BEP FIX: Only react to closeSignal changes.
 * v1.0.8  - 2026-01-22 - BEP UX: Add open/close coordination hooks.
 * v1.0.7  - 2026-01-22 - BEP UX: Add unread visual emphasis.
 * v1.0.6  - 2026-01-22 - BEP AUTH GATE: Non-authenticated users see AuthModal2.
 * v1.0.5  - 2026-01-22 - BEP: Remove box shadow from notification bell.
 * v1.0.4  - 2026-01-22 - BEP UX: Enhanced notification display.
 * v1.0.3  - 2026-01-22 - BEP UX: Added EventModal integration.
 * v1.0.2  - 2026-01-22 - BEP BADGE POSITIONING FIX.
 * v1.0.1  - 2026-01-22 - BEP: Improve bell icon styling.
 * v1.0.0  - 2026-01-21 - Initial implementation.
 */

import PropTypes from 'prop-types';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { resolveImpactMeta } from '../utils/newsApi';
import { useAuth } from '../contexts/AuthContext';
import { useSettingsSafe } from '../contexts/SettingsContext';
import useCustomEvents from '../hooks/useCustomEvents';

const EventModal = lazy(() => import('./EventModal'));
const AuthModal2 = lazy(() => import('./AuthModal2'));
const CustomEventDialog = lazy(() => import('./CustomEventDialog'));

export default function NotificationCenter({
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onClearAll,
    events,
    onMenuOpen,
    onMenuClose,
    closeSignal,
}) {
    const { user, isAuthenticated } = useAuth();
    const { selectedTimezone } = useSettingsSafe();
    // BEP v1.3.0: Custom event CRUD (no subscription needed — only mutation functions)
    const { createEvent: createCustomEvent, saveEvent: saveCustomEvent, removeEvent: removeCustomEvent } = useCustomEvents();
    const { t } = useTranslation('notification');
    const theme = useTheme();
    const anchorRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [customEditingEvent, setCustomEditingEvent] = useState(null);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const lastCloseSignalRef = useRef(closeSignal || 0);
    const visibleNotifications = useMemo(
        () => {
            // BEP v1.1.0: Defense-in-depth dedup — one notification per event+occurrence+channel
            const seen = new Map();
            return notifications
                .filter((item) => !item.deleted)
                .filter((item) => {
                    const dedupeKey = item.eventKey && Number.isFinite(item.eventEpochMs)
                        ? `${item.eventKey}__${item.eventEpochMs}__${item.channel || 'inApp'}`
                        : item.id;
                    if (seen.has(dedupeKey)) return false;
                    seen.set(dedupeKey, true);
                    return true;
                });
        },
        [notifications]
    );
    const anchorNode = anchorRef.current;
    const isAnchorValid = Boolean(
        anchorNode
        && typeof document !== 'undefined'
        && document.body.contains(anchorNode)
        && anchorNode.offsetParent !== null
    );
    const open = Boolean(menuOpen && isAnchorValid);

    const handleOpen = () => {
        // BEP: Non-auth users see AuthModal2 to unlock notifications feature
        const isUserAuthenticated = isAuthenticated ? isAuthenticated() : Boolean(user);
        if (!isUserAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        // Defensive check: ensure anchor element is mounted and valid before opening
        if (!anchorRef.current || !isAnchorValid) return;
        setMenuOpen(true);
        onMenuOpen?.();
        // BEP v1.4.0: Do NOT mark all as read on menu open. Only mark as read when user
        // actually hovers or clicks on individual notification items.
    };

    const handleClose = () => {
        setMenuOpen(false);
        onMenuClose?.();
    };

    const handleNotificationHover = (notification) => {
        // BEP v1.4.0: Mark as read on hover (desktop UX)
        if (!notification.read) {
            onMarkRead?.(notification.id);
        }
    };

    const handleNotificationClick = (notification) => {
        // BEP v1.4.0: Mark as read on click/tap (mobile UX + desktop confirmation)
        if (!notification.read) {
            onMarkRead?.(notification.id);
        }

        const event = events?.find((evt) => evt.id === notification.eventId);
        if (event) {
            setSelectedEvent(event);
            handleClose();
        }

        // BEP: Non-event notifications can carry a link (e.g., blog draft created)
        const href = notification?.href;
        if (!event && href && typeof window !== 'undefined') {
            try {
                window.open(String(href), '_blank', 'noopener,noreferrer');
                handleClose();
            } catch {
                // Ignore window.open failures
            }
        }
    };

    const handleCloseEventModal = () => setSelectedEvent(null);

    // BEP v1.2.0: Self-contained edit — close EventModal, open CustomEventDialog in edit mode
    const handleEditCustomEvent = useCallback((event) => {
        setSelectedEvent(null);
        setCustomEditingEvent(event);
        setCustomDialogOpen(true);
    }, []);
    const handleCloseCustomDialog = useCallback(() => {
        setCustomDialogOpen(false);
        setCustomEditingEvent(null);
    }, []);

    // BEP v1.3.0: Persist custom event to Firestore with auth check
    const handleSaveCustomEvent = useCallback(async (payload) => {
        const isUserAuthenticated = isAuthenticated ? isAuthenticated() : Boolean(user);
        if (!isUserAuthenticated) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
            setShowAuthModal(true);
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
    }, [isAuthenticated, user, createCustomEvent, customEditingEvent, saveCustomEvent]);

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

    useEffect(() => {
        if (menuOpen && !isAnchorValid) {
            setMenuOpen(false);
            onMenuClose?.();
        }
    }, [menuOpen, isAnchorValid, onMenuClose]);

    useEffect(() => {
        if (closeSignal === undefined || closeSignal === null) return;
        if (closeSignal === lastCloseSignalRef.current) return;
        lastCloseSignalRef.current = closeSignal;
        if (menuOpen) {
            setMenuOpen(false);
            onMenuClose?.();
        }
    }, [closeSignal, menuOpen, onMenuClose]);

    return (
        <Box sx={{ width: { xs: 32, sm: 32, md: 36 }, height: { xs: 32, sm: 32, md: 36 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: { xs: 32, sm: 32, md: 36 }, height: { xs: 32, sm: 32, md: 36 } }}>
                <IconButton
                    aria-label={t('ariaLabel')}
                    onClick={handleOpen}
                    size="small"
                    ref={anchorRef}
                    sx={{
                        width: { xs: 32, sm: 32, md: 36 },
                        height: { xs: 32, sm: 32, md: 36 },
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        p: 0.5,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'scale(1.05)',
                            bgcolor: 'background.paper',
                        },
                        '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 4,
                            borderRadius: '50%',
                        },
                    }}
                >
                    <NotificationsRoundedIcon sx={{ fontSize: { xs: 22, sm: 22, md: 20 } }} />
                </IconButton>
                {unreadCount > 0 ? (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            color: 'common.white',
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            boxShadow: (theme) => `0 3px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)'}`,
                            border: '2px solid',
                            borderColor: 'background.paper',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {unreadCount}
                    </Box>
                ) : null}
            </Box>
            {isAnchorValid && (
                <Menu
                    anchorEl={anchorRef.current}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    slotProps={{
                        paper: {
                            elevation: 8,
                            sx: {
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: '0 10px 26px rgba(15,23,42,0.12)',
                                mt: 1.5,
                                width: 320,
                                maxWidth: '85vw',
                                zIndex: theme.zIndex.appBar,
                            },
                        },
                    }}
                >
                    <Box sx={{ py: 1, display: 'flex', flexDirection: 'column' }}>
                        <Stack spacing={1} sx={{ px: 1, pb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {t('title')}
                            </Typography>
                            {visibleNotifications.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    {t('empty')}
                                </Typography>
                            ) : null}
                        </Stack>

                        {visibleNotifications.slice(0, 8).map((item) => {
                            const impactMeta = item.impact ? resolveImpactMeta(item.impact) : null;
                            const titleText = item.titleKey
                                ? t(item.titleKey, item.titleParams || {})
                                : item.title;
                            const messageText = item.messageKey
                                ? t(item.messageKey, item.messageParams || {})
                                : item.message;
                            return (
                                <MenuItem
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    onMouseEnter={() => handleNotificationHover(item)}
                                    sx={{
                                        alignItems: 'flex-start',
                                        whiteSpace: 'normal',
                                        py: 1.25,
                                        px: 1.5,
                                        borderRadius: 1.5,
                                        bgcolor: item.read ? 'transparent' : 'action.selected',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Stack spacing={0.75} sx={{ width: '100%' }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                            <Typography variant="body2" sx={{ fontWeight: item.read ? 600 : 700, flex: 1, minWidth: 0 }}>
                                                {titleText}
                                            </Typography>
                                            {impactMeta && (
                                                <Chip
                                                    label={item.impactLabel || impactMeta.label}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        bgcolor: impactMeta.color,
                                                        color: '#fff',
                                                        '& .MuiChip-label': { px: 1 },
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        {messageText ? (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    fontWeight: 500,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {messageText}
                                            </Typography>
                                        ) : null}
                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                            {item.eventTime && (
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {item.eventTime}
                                                    </Typography>
                                                </Stack>
                                            )}
                                            {item.minutesBefore && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                    {t('bullet')} {t('in')} {item.minutesBefore} {t('min')}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Stack>
                                </MenuItem>
                            );
                        })}

                        {visibleNotifications.length > 0 ? (
                            <Box sx={{ px: 1, pt: 1, pb: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button size="small" color="error" onClick={onClearAll}>
                                    {t('clearAll')}
                                </Button>
                            </Box>
                        ) : null}
                    </Box>
                </Menu>
            )}
            {showAuthModal && (
                <Suspense fallback={null}>
                    <AuthModal2
                        open={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        initialMode="signup"
                    />
                </Suspense>
            )}
            {selectedEvent && (
                <Suspense fallback={null}>
                    <EventModal
                        event={selectedEvent}
                        onClose={handleCloseEventModal}
                        open={Boolean(selectedEvent)}
                        onEditCustomEvent={handleEditCustomEvent}
                    />
                </Suspense>
            )}
            {customDialogOpen && (
                <Suspense fallback={null}>
                    <CustomEventDialog
                        open={customDialogOpen}
                        onClose={handleCloseCustomDialog}
                        onSave={handleSaveCustomEvent}
                        onDelete={handleDeleteCustomEvent}
                        event={customEditingEvent}
                        defaultTimezone={selectedTimezone}
                        zIndexOverride={customEditingEvent ? 12003 : undefined}
                    />
                </Suspense>
            )}
        </Box>
    );
}

NotificationCenter.propTypes = {
    notifications: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        eventId: PropTypes.string,
        title: PropTypes.string,
        titleKey: PropTypes.string,
        titleParams: PropTypes.object,
        message: PropTypes.string,
        messageKey: PropTypes.string,
        messageParams: PropTypes.object,
        href: PropTypes.string,
        eventTime: PropTypes.string,
        impact: PropTypes.string,
        impactLabel: PropTypes.string,
        minutesBefore: PropTypes.number,
        read: PropTypes.bool,
        deleted: PropTypes.bool,
    })).isRequired,
    unreadCount: PropTypes.number.isRequired,
    onMarkRead: PropTypes.func,
    onMarkAllRead: PropTypes.func,
    onClearAll: PropTypes.func,
    events: PropTypes.arrayOf(PropTypes.object),
    onMenuOpen: PropTypes.func,
    onMenuClose: PropTypes.func,
    closeSignal: PropTypes.number,
};
