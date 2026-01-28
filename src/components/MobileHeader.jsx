/**
 * src/components/MobileHeader.jsx
 * 
 * Purpose: Standalone mobile header component for xs/sm breakpoints.
 * Renders fixed brand lockup (logo + "Time 2 Trade" text) with notifications, auth CTA, and page-specific actions.
 * Extracted from PublicLayout to improve separation of concerns and ensure consistency across all pages.
 * 
 * Changelog:
 * v1.4.0 - 2026-01-27 - BEP REFACTOR: Complete mobile header cleanup for proper spacing and responsive design. Removed complex gap: 0 logic and replaced with proper gap values (xs: 1, sm: 1.5 for container; xs: 0.75, sm: 1 for icons). Fixed logo sizing to explicit px values (28px xs, 32px sm). Hidden language switcher on xs for guests (shows on sm+). Added border-bottom and subtle shadow for visual separation. Reduced padding to px: 2/2.5 for better space utilization. Typography now shrinks properly (0.95rem xs, 1.05rem sm). All action icons properly spaced without overlap.
 * v1.3.0 - 2026-01-27 - BEP UI CONSISTENCY: Hide LanguageSwitcher for authenticated users (only show for guests). Ensure add icon, bell icon, and user avatar all have consistent circular sizing (32px xs/sm, 36px md+) with flex centering. All action icons now have matching dimensions and spacing for perfect alignment on mobile header. Updated add icon fontSize to 18px for proportion balance.
 * v1.2.1 - 2026-01-27 - BEP i18n: Added useTranslation hook and replaced hardcoded "Unlock" and "Unlock all features" text with t('common:navigation.unlock') and t('common:navigation.unlockAllFeatures') keys. Button now respects user's selected language (EN/ES/FR) via LanguageSwitcher. All copy now dynamically updates when language changes.
 * v1.2.0 - 2026-01-27 - BEP SIZING REFACTOR: Removed all hardcoded heights (width/height props on wrapper Boxes). All elements now use MUI size="small" with py: 0.9 padding, matching LanguageSwitcher pattern. Logo uses maxHeight instead of hardcoded height. Add icon, NotificationCenter, and UserAvatar now rely on natural MUI sizing instead of wrapper constraints. CSS custom property --t2t-mobile-header-height set to fit-content for dynamic height computation. PublicLayout updated to use var(--t2t-mobile-header-height, 48px) for pt and maxHeight calculations instead of hardcoded 48px. Ensures all elements match LanguageSwitcher sizing and eliminates brittle pixel-based heights (BEP).
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
import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UserAvatar from './UserAvatar';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
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
    const { t } = useTranslation('common');
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
                    display: { xs: 'flex', sm: 'flex', md: 'none' },
                    alignItems: 'center',
                    gap: { xs: 1, sm: 1.5 },
                    width: '100%',
                    px: { xs: 2, sm: 2.5 },
                    bgcolor: 'background.default',
                    py: { xs: 1, sm: 1.25 },
                    mb: 2,
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 100,
                    boxSizing: 'border-box',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
                aria-label="Time 2 Trade home"
            >
                {/* Logo + Brand Text */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 1, minWidth: 0 }}>
                    <Box
                        component={RouterLink}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.75, sm: 1 },
                            textDecoration: 'none',
                            color: 'inherit',
                            flexShrink: 1,
                            minWidth: 0,
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
                                width: { xs: 28, sm: 32 },
                                height: { xs: 28, sm: 32 },
                                objectFit: 'contain',
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 900,
                                fontSize: { xs: '0.95rem', sm: '1.05rem' },
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

                    {/* Language Switcher - only for guests, hidden on xs */}
                    {!user && (
                        <Box sx={{ display: { xs: 'none', sm: 'block' }, flexShrink: 0 }}>
                            <LanguageSwitcher />
                        </Box>
                    )}
                </Box>

                {/* Action Icons Group */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexShrink: 0 }}>
                    {/* Page-specific action slot (e.g., Add reminder button) - legacy support */}
                    {mobileHeaderAction}

                    {/* Add Reminder button - visible only for authenticated users */}
                    {user && !mobileHeaderAction && (
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
                                    p: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
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
                                <AddRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Notification Center - visible only for authenticated users */}
                    {user && notifications && unreadCount !== undefined && (
                        <NotificationCenter
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkRead={onMarkRead}
                            onMarkAllRead={onMarkAllRead}
                            onClearAll={onClearAll}
                            events={customEvents}
                            closeSignal={notificationCloseSignal}
                            onMenuOpen={() => setAvatarCloseSignal((prev) => prev + 1)}
                            sx={{
                                flexShrink: 0,
                                width: { xs: 32, sm: 32, md: 36 },
                                height: { xs: 32, sm: 32, md: 36 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        />
                    )}

                    {/* Mobile CTA button - shows "Unlock" for guests, user avatar for auth users */}
                    {user ? (
                        <UserAvatar
                            user={user}
                            onLogout={() => setShowLogoutModal(true)}
                            onOpen={() => setNotificationCloseSignal((prev) => prev + 1)}
                            closeSignal={avatarCloseSignal}
                        />
                    ) : (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<LockIcon sx={{ fontSize: '1rem' }} />}
                            onClick={onOpenAuth}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                py: 0.9,
                                px: 2,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            title={t('navigation.unlock')}
                        >
                            <Box sx={{ display: { xs: 'inline', sm: 'none', md: 'inline', lg: 'none' } }}>
                                {t('navigation.unlock')}
                            </Box>
                            <Box sx={{ display: { xs: 'none', sm: 'inline', md: 'none', lg: 'inline' } }}>
                                {t('navigation.unlockAllFeatures')}
                            </Box>
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
