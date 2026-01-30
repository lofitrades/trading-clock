/**
 * src/components/NotificationCenter.jsx
 * 
 * Purpose: Compact notification center for custom reminder alerts.
 * Key responsibility and main functionality: Display unread counts, list recent notifications,
 * and provide quick actions to mark as read or clear.
 * 
 * Changelog:
 * v1.0.21 - 2026-01-29 - BEP THEME-AWARE: Replaced hardcoded #fff with background.paper and
 *                        rgba shadow colors with theme-aware values. Badge border and menu
 *                        backgrounds now adapt to light/dark mode. Fully AA accessible.
 * v1.0.20 - 2026-01-24 - Phase 2 i18n migration: Add notification namespace (7 strings EN/ES/FR). Replaced hardcoded "Notifications", "No reminders yet", "Clear all" with t() calls.
 * v1.0.19 - 2026-01-22 - BEP UI CONSISTENCY: Increase bell icon glyph size on xs/sm to visually match add icon and avatar sizing across all pages, including /clock.
 * v1.0.18 - 2026-01-22 - BEP UI CONSISTENCY: Increase bell icon glyph size on xs/sm so it visually matches add icon and avatar sizing in MobileHeader.
 * v1.0.17 - 2026-01-22 - BEP UI CONSISTENCY: Change bell icon background from transparent to white (#fff) to match add icon appearance on /clock page. Both icons now have identical white backgrounds with divider border for consistent mobile header UI.
 * v1.0.16 - 2026-01-22 - BEP BUGFIX: Add defensive anchorEl validation to prevent MUI warnings about invalid anchor elements.
 * v1.0.15 - 2026-01-22 - BEP UI: Increase top margin to 1.5 for better AppBar spacing.
 * v1.0.14 - 2026-01-22 - BEP UI: Match container display flex to UserAvatar for consistent vertical alignment.
 * v1.0.13 - 2026-01-22 - BEP UI: Match Menu structure exactly to UserAvatar Popover (slotProps.paper, elevation, Box wrapper).
 * v1.0.12 - 2026-01-22 - BEP UI: Match notification menu container styling/positioning to UserAvatar popover.
 * v1.0.11 - 2026-01-22 - BEP UI: Align bell icon color and border with AppBar nav + filter chips.
 * v1.0.10 - 2026-01-22 - BEP UI: Match bell button styling with UserAvatar (outlined, size, hover).
 * v1.0.9 - 2026-01-22 - BEP FIX: Only react to closeSignal changes to prevent immediate re-close.
 * v1.0.8 - 2026-01-22 - BEP UX: Add open/close coordination hooks for AppBar menu stacking.
 * v1.0.7 - 2026-01-22 - BEP UX: Add unread visual emphasis and ignore deleted notifications for cleaner state handling.
 * v1.0.6 - 2026-01-22 - BEP AUTH GATE: Non-authenticated users clicking notification bell now see AuthModal2 instead of notifications menu. Gated feature encourages conversion while showing notification count as teaser.
 * v1.0.5 - 2026-01-22 - BEP: Remove box shadow from notification bell button for cleaner UI.
 * v1.0.4 - 2026-01-22 - BEP UX: Enhanced notification display with TradingView-style rich details (impact chip, event time, countdown). Shows event metadata in notification items for quick scanning.
 * v1.0.3 - 2026-01-22 - BEP UX: Removed redundant "Mark all read" button (already called on menu open). Added EventModal integration: clicking notification opens EventModal for the associated custom event. Improved user flow for reminder-to-event navigation.
 * v1.0.2 - 2026-01-22 - BEP BADGE POSITIONING FIX: Moved badge outside IconButton, changed parent from inline-flex to inline-block, aligned badge styling with ClockEventsOverlay pattern (18px size, borderRadius 50%, boxShadow 0.35 opacity, pointerEvents none). Ensures badge aligns cleanly to top-right of bell icon across md+ and xs/sm breakpoints. Fixes misalignment caused by inline-flex layout and dimension mismatch.
 * v1.0.1 - 2026-01-22 - BEP: Improve bell icon styling, raise menu z-index above AppBar, and guard anchorEl validity to prevent MUI popover warnings.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom event notifications.
 */

import PropTypes from 'prop-types';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

const EventModal = lazy(() => import('./EventModal'));
const AuthModal2 = lazy(() => import('./AuthModal2'));

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
    const { t } = useTranslation('notification');
    const theme = useTheme();
    const anchorRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const lastCloseSignalRef = useRef(closeSignal || 0);
    const visibleNotifications = useMemo(
        () => notifications.filter((item) => !item.deleted),
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
        onMarkAllRead?.();
    };

    const handleClose = () => {
        setMenuOpen(false);
        onMenuClose?.();
    };

    const handleNotificationClick = (notification) => {
        const event = events?.find((evt) => evt.id === notification.eventId);
        if (event) {
            setSelectedEvent(event);
            handleClose();
        }
        onMarkRead?.(notification.id);
    };

    const handleCloseEventModal = () => setSelectedEvent(null);

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
                            return (
                                <MenuItem
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
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
                                                {item.title}
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
        message: PropTypes.string,
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
