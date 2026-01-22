/**
 * src/components/NotificationCenter.jsx
 * 
 * Purpose: Compact notification center for custom reminder alerts.
 * Key responsibility and main functionality: Display unread counts, list recent notifications,
 * and provide quick actions to mark as read or clear.
 * 
 * Changelog:
 * v1.0.5 - 2026-01-22 - BEP: Remove box shadow from notification bell button for cleaner UI.
 * v1.0.4 - 2026-01-22 - BEP UX: Enhanced notification display with TradingView-style rich details (impact chip, event time, countdown). Shows event metadata in notification items for quick scanning.
 * v1.0.3 - 2026-01-22 - BEP UX: Removed redundant "Mark all read" button (already called on menu open). Added EventModal integration: clicking notification opens EventModal for the associated custom event. Improved user flow for reminder-to-event navigation.
 * v1.0.2 - 2026-01-22 - BEP BADGE POSITIONING FIX: Moved badge outside IconButton, changed parent from inline-flex to inline-block, aligned badge styling with ClockEventsOverlay pattern (18px size, borderRadius 50%, boxShadow 0.35 opacity, pointerEvents none). Ensures badge aligns cleanly to top-right of bell icon across md+ and xs/sm breakpoints. Fixes misalignment caused by inline-flex layout and dimension mismatch.
 * v1.0.1 - 2026-01-22 - BEP: Improve bell icon styling, raise menu z-index above AppBar, and guard anchorEl validity to prevent MUI popover warnings.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom event notifications.
 */

import PropTypes from 'prop-types';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { resolveImpactMeta } from '../utils/newsApi';

const EventModal = lazy(() => import('./EventModal'));

export default function NotificationCenter({
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onClearAll,
    events,
}) {
    const anchorRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const anchorNode = anchorRef.current;
    const isAnchorValid = Boolean(
        anchorNode
        && typeof document !== 'undefined'
        && document.body.contains(anchorNode)
        && anchorNode.offsetParent !== null
    );
    const open = Boolean(menuOpen && isAnchorValid);

    const handleOpen = () => {
        if (!isAnchorValid) return;
        setMenuOpen(true);
        onMarkAllRead?.();
    };

    const handleClose = () => setMenuOpen(false);

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
        }
    }, [menuOpen, isAnchorValid]);

    return (
        <Box>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <IconButton
                    aria-label="Notifications"
                    onClick={handleOpen}
                    size="small"
                    ref={anchorRef}
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <NotificationsRoundedIcon fontSize="small" />
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
                            color: '#fff',
                            fontSize: '0.625rem',
                            fontWeight: 800,
                            boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
                            border: '2px solid #fff',
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
            <Menu
                anchorEl={isAnchorValid ? anchorRef.current : null}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 320,
                        maxWidth: '85vw',
                        p: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 16px 40px rgba(15,23,42,0.14)',
                    },
                }}
                slotProps={{
                    root: { sx: { zIndex: 2005 } },
                    paper: { sx: { zIndex: 2006 } },
                }}
            >
                <Stack spacing={1} sx={{ px: 1, pb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Notifications
                    </Typography>
                    {notifications.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No reminders yet.
                        </Typography>
                    ) : null}
                </Stack>

                {notifications.slice(0, 8).map((item) => {
                    const impactMeta = item.impact ? resolveImpactMeta(item.impact) : null;
                    return (
                        <MenuItem
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1.25, px: 1.5 }}
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
                                            • in {item.minutesBefore} min
                                        </Typography>
                                    )}
                                </Stack>
                            </Stack>
                        </MenuItem>
                    );
                })}

                {notifications.length > 0 ? (
                    <Box sx={{ px: 1, pt: 1, pb: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" color="error" onClick={onClearAll}>
                            Clear all
                        </Button>
                    </Box>
                ) : null}
            </Menu>

            {/* EventModal for custom event details */}
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
    })).isRequired,
    unreadCount: PropTypes.number.isRequired,
    onMarkRead: PropTypes.func,
    onMarkAllRead: PropTypes.func,
    onClearAll: PropTypes.func,
    events: PropTypes.arrayOf(PropTypes.object),
};
