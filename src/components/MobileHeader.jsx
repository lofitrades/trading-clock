/**
 * src/components/MobileHeader.jsx
 * 
 * Purpose: Standalone mobile header component for xs/sm breakpoints.
 * Renders fixed brand lockup (logo + "Time 2 Trade" text) with notifications, auth CTA, and page-specific actions.
 * Extracted from PublicLayout to improve separation of concerns and ensure consistency across all pages.
 * 
 * Changelog:
 * v1.1.7 - 2026-01-22 - BEP: Add icon now shows CustomEventDialog for non-auth users (matching CalendarEmbed pattern). When saving, auth check prevents save and shows AuthModal2 instead of immediately showing AuthModal2. Improves UX by letting guests preview feature before login.
 * v1.1.6 - 2026-01-22 - BEP UI CONSISTENCY: Reduce add icon glyph size on xs/sm so it matches bell and avatar sizing on /clock page.
 * v1.1.5 - 2026-01-22 - BEP UI CONSISTENCY: Change add icon background from transparent to white (#fff) to match bell icon styling on /clock page. Both icons now have identical white backgrounds with divider border.
 * v1.1.4 - 2026-01-22 - BEP UX: Add close signal coordination between NotificationCenter and UserAvatar for mutually exclusive menu display.
 * v1.1.3 - 2026-01-22 - BEP UI: Normalize icon slot widths for consistent spacing between add, bell, and avatar.
 * v1.1.2 - 2026-01-22 - BEP UI: Standardize icon spacing and alignment in mobile header.
 * v1.1.1 - 2026-01-22 - BEP UI: Match Add reminder button styling with notification bell.
 * v1.1.0 - 2026-01-22 - BEP: Add icon always visible on all pages for both auth and non-auth users. Non-auth users see AuthModal2 on click. Improves feature discoverability and conversion across the app.
 * v1.0.0 - 2026-01-22 - Initial implementation. Extracted mobile header logic from PublicLayout for DRY and BEP.
 * Renders brand lockup, mobileHeaderAction slot, notification center, and auth CTA/user avatar.
 * Responsive text "Unlock" (xs/md) / "Unlock all features" (sm/lg+) for CTA button.
 * Z-index 100 for proper layering above content.
 */

import { useState, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UserAvatar from './UserAvatar';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';

const LogoutModal = lazy(() => import('./LogoutModal'));
const AuthModal2 = lazy(() => import('./AuthModal2'));
const CustomEventDialog = lazy(() => import('./CustomEventDialog'));

const MobileHeader = ({
    user,
    onOpenAuth,
    notifications,
    unreadCount,
    onMarkRead,
    onMarkAllRead,
    onClearAll,
    mobileHeaderAction,
    customEvents,
}) => {
    const { isAuthenticated } = useAuth();
    const { settings } = useSettings();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [notificationCloseSignal, setNotificationCloseSignal] = useState(0);
    const [avatarCloseSignal, setAvatarCloseSignal] = useState(0);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);

    const defaultTimezone = settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleAddClick = () => {
        // BEP: Show CustomEventDialog for all users (non-auth users see auth check on save)
        setCustomDialogOpen(true);
    };

    const handleSaveCustomEvent = () => {
        // BEP: Auth check on save - prevents save and shows AuthModal2 for non-auth users
        const isUserAuthenticated = isAuthenticated ? isAuthenticated() : Boolean(user);
        if (!isUserAuthenticated) {
            setCustomDialogOpen(false);
            setShowAuthModal(true);
            return;
        }

        // Auth users can proceed with save (actual save logic in parent page)
        setCustomDialogOpen(false);
    };

    return (
        <>
            {/* Mobile brand lockup - fixed on xs/sm ONLY */}
            <Box
                sx={{
                    display: { xs: 'inline-flex', sm: 'inline-flex', md: 'none' },
                    alignItems: 'center',
                    gap: 1,
                    width: { xs: '100%', sm: '100%', md: 'auto' },
                    px: { xs: 2.5, sm: 2.75, md: 0 },
                    bgcolor: { xs: 'background.default', sm: 'background.default', md: 'transparent' },
                    py: { xs: 1, sm: 1, md: 'unset' },
                    mb: 2,
                    position: { xs: 'fixed', sm: 'fixed', md: 'relative' },
                    top: 0,
                    left: { xs: 0, sm: 0, md: 'auto' },
                    zIndex: { xs: 100, sm: 100, md: 'auto' },
                    boxSizing: 'border-box',
                    justifyContent: 'space-between',
                }}
                aria-label="Time 2 Trade home"
            >
                <Box
                    component={RouterLink}
                    to="/"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:focus-visible': {
                            outline: '2px solid rgba(15,23,42,0.35)',
                            outlineOffset: 4,
                            borderRadius: 1,
                        },
                    }}
                >
                    <Box
                        component="img"
                        src="/logos/favicon/favicon.ico"
                        alt="Time 2 Trade logo"
                        sx={{
                            display: 'block',
                            height: 32,
                            width: 'auto',
                            maxWidth: '32vw',
                            objectFit: 'contain',
                            flexShrink: 0,
                        }}
                    />
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 900,
                            lineHeight: 1.1,
                            color: 'text.primary',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        Time 2 Trade
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                    {/* Page-specific action slot (e.g., Add reminder button) - legacy support */}
                    {mobileHeaderAction}

                    {/* Add Reminder button - always visible on all pages */}
                    {!mobileHeaderAction && (
                        <Box
                            sx={{
                                width: { xs: 32, sm: 32, md: 36 },
                                height: { xs: 32, sm: 32, md: 36 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Tooltip title="Add reminder" placement="bottom">
                                <IconButton
                                    onClick={handleAddClick}
                                    size="small"
                                    sx={{
                                        width: { xs: 32, sm: 32, md: 36 },
                                        height: { xs: 32, sm: 32, md: 36 },
                                        borderRadius: '50%',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: '#fff',
                                        color: 'text.primary',
                                        p: 0.5,
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                            bgcolor: '#fff',
                                        },
                                        '&:focus-visible': {
                                            outline: '2px solid',
                                            outlineColor: 'primary.main',
                                            outlineOffset: 4,
                                            borderRadius: '50%',
                                        },
                                    }}
                                    aria-label="Add custom reminder"
                                >
                                    <AddRoundedIcon sx={{ fontSize: { xs: 22, sm: 22, md: 20 } }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}

                    {/* Notification Center - left of user avatar/CTA on mobile */}
                    {notifications && unreadCount !== undefined && (
                        <Box
                            sx={{
                                width: { xs: 32, sm: 32, md: 36 },
                                height: { xs: 32, sm: 32, md: 36 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <NotificationCenter
                                notifications={notifications}
                                unreadCount={unreadCount}
                                onMarkRead={onMarkRead}
                                onMarkAllRead={onMarkAllRead}
                                onClearAll={onClearAll}
                                events={customEvents}
                                closeSignal={notificationCloseSignal}
                                onMenuOpen={() => setAvatarCloseSignal((prev) => prev + 1)}
                            />
                        </Box>
                    )}

                    {/* Mobile CTA button - shows "Unlock" for guests, user avatar for auth users */}
                    {user ? (
                        <Box
                            sx={{
                                width: { xs: 32, sm: 32, md: 36 },
                                height: { xs: 32, sm: 32, md: 36 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <UserAvatar
                                user={user}
                                onLogout={() => setShowLogoutModal(true)}
                                onOpen={() => setNotificationCloseSignal((prev) => prev + 1)}
                                closeSignal={avatarCloseSignal}
                            />
                        </Box>
                    ) : (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<LockIcon sx={{ fontSize: '1rem' }} />}
                            onClick={onOpenAuth}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                height: { xs: 'auto', sm: 32 },
                                py: { xs: 0.75, sm: 0.5 },
                                px: { xs: 1.5, sm: 2 },
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ display: { xs: 'inline', sm: 'none', md: 'inline', lg: 'none' } }}>Unlock</Box>
                            <Box sx={{ display: { xs: 'none', sm: 'inline', md: 'none', lg: 'inline' } }}>Unlock all features</Box>
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Logout Modal */}
            {showLogoutModal && (
                <Suspense fallback={null}>
                    <LogoutModal
                        open={showLogoutModal}
                        onClose={() => setShowLogoutModal(false)}
                    />
                </Suspense>
            )}

            {/* CustomEventDialog for adding reminders */}
            {customDialogOpen && (
                <Suspense fallback={null}>
                    <CustomEventDialog
                        open={customDialogOpen}
                        onClose={() => setCustomDialogOpen(false)}
                        onSave={handleSaveCustomEvent}
                        defaultTimezone={defaultTimezone}
                    />
                </Suspense>
            )}

            {/* AuthModal2 for non-authenticated users */}
            {showAuthModal && (
                <Suspense fallback={null}>
                    <AuthModal2
                        open={showAuthModal}
                        onClose={() => setShowAuthModal(false)}
                        initialMode="signup"
                    />
                </Suspense>
            )}
        </>
    );
};

MobileHeader.propTypes = {
    user: PropTypes.shape({
        uid: PropTypes.string,
        email: PropTypes.string,
        displayName: PropTypes.string,
        photoURL: PropTypes.string,
    }),
    onOpenAuth: PropTypes.func.isRequired,
    notifications: PropTypes.arrayOf(PropTypes.object),
    unreadCount: PropTypes.number,
    onMarkRead: PropTypes.func,
    onMarkAllRead: PropTypes.func,
    onClearAll: PropTypes.func,
    mobileHeaderAction: PropTypes.node,
    customEvents: PropTypes.arrayOf(PropTypes.object),
    onOpenAddReminder: PropTypes.func,
};

MobileHeader.defaultProps = {
    user: null,
    notifications: null,
    unreadCount: null,
    onMarkRead: null,
    onMarkAllRead: null,
    onClearAll: null,
    mobileHeaderAction: null,
    customEvents: [],
    onOpenAddReminder: null,
};

export default MobileHeader;
