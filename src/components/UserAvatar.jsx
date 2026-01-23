/**
 * src/components/UserAvatar.jsx
 * 
 * Purpose: Standalone, fully responsive user avatar menu component for authenticated users.
 * Displays user profile photo with fallback icon, opens Popover menu for account and logout actions.
 * Mobile-first design: 32x32px on xs/sm, 40x40px on md+. Manages account modal internally.
 * Follows enterprise best practices: proper focus/hover states, accessibility attributes, lazy-loaded modals,
 * consistent z-index stacking (Popover: 1300, Modals: 10001+), and semantic button structure.
 * 
 * Changelog:
 * v1.0.7 - 2026-01-23 - BEP FIX: Increase Popover z-index from 1100 (AppBar level) to 1300 to render above AppBar shadow. Ensures user menu visually appears over the sticky header.
 * v1.0.6 - 2026-01-22 - BEP FIX: Only react to closeSignal changes to prevent immediate re-close.
 * v1.0.5 - 2026-01-22 - BEP UX: Add open/close coordination hooks for AppBar menu stacking.
 * v1.0.4 - 2026-01-22 - BEP: Add AppBar-matching border styling to user menu popover.
 * v1.0.3 - 2026-01-22 - BEP: Align user menu popover z-index with AppBar layer for consistent stacking.
 * v1.0.2 - 2026-01-14 - LOGOUT MODAL REFACTOR: Replaced inline ConfirmModal with standalone LogoutModal component.
 * LogoutModal now handles full logout flow (Firebase sign-out, settings reset, navigation) with loading state
 * to prevent double-clicks. UserAvatar focuses on avatar UI and account modal, delegating logout flow to LogoutModal.
 * Improves separation of concerns and eliminates double-click logout bug.
 * v1.0.1 - 2026-01-14 - ENHANCED ENTERPRISE PRACTICES: Improved responsive avatar sizing (32px mobile, 40px desktop).
 * Added comprehensive accessibility documentation. Enhanced Popover positioning with proper viewport handling.
 * Improved error handling for missing user data. Updated PropTypes validation. All lazy-loaded modals now in Suspense.
 * Component fully decoupled from PublicLayout - manages own modal state without parent callbacks.
 * v1.0.0 - 2026-01-14 - INITIAL COMPONENT: Extracted user avatar menu from PublicLayout.jsx.
 * Displays user photoURL or fallback AccountCircleIcon badge. Popover menu opens on click with
 * "My Account" and "Log out" items. Integrates lazy-loaded AccountModal and ConfirmModal for modal flows.
 * Props: user (Firebase user object), onLogout (callback for logout completion).
 */

import { useEffect, useRef, useState, Suspense, lazy, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Avatar, IconButton, Popover, Button, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const AccountModal = lazy(() => import('./AccountModal'));
const LogoutModal = lazy(() => import('./LogoutModal'));

const UserAvatar = ({ user, onLogout, onOpen, closeSignal }) => {
    const theme = useTheme();
    // User avatar menu state
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const lastCloseSignalRef = useRef(closeSignal || 0);

    // Handle popover open
    const handleUserMenuOpen = useCallback((event) => {
        setUserMenuAnchor(event.currentTarget);
        onOpen?.();
    }, [onOpen]);

    // Handle popover close
    const handleUserMenuClose = useCallback(() => {
        setUserMenuAnchor(null);
    }, []);

    useEffect(() => {
        if (closeSignal === undefined || closeSignal === null) return;
        if (closeSignal === lastCloseSignalRef.current) return;
        lastCloseSignalRef.current = closeSignal;
        if (userMenuAnchor) {
            setUserMenuAnchor(null);
        }
    }, [closeSignal, userMenuAnchor]);

    // Handle "My Account" click - open account modal and close menu
    const handleOpenAccount = useCallback(() => {
        setShowAccountModal(true);
        handleUserMenuClose();
    }, [handleUserMenuClose]);

    // Handle "Log out" click - open logout modal and close menu
    const handleLogoutClick = useCallback(() => {
        setShowLogoutModal(true);
        handleUserMenuClose();
    }, [handleUserMenuClose]);

    // Safe user display name fallback
    const userDisplayName = user?.displayName || user?.email || 'User';
    const userInitial = userDisplayName.charAt(0).toUpperCase();

    return (
        <>
            {/* Avatar Button Container */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {/* User Avatar Button - mobile-first responsive sizing (32px mobile → 40px desktop) */}
                <IconButton
                    onClick={handleUserMenuOpen}
                    aria-label={`${userDisplayName} menu`}
                    aria-haspopup="true"
                    aria-expanded={Boolean(userMenuAnchor)}
                    aria-controls={userMenuAnchor ? 'user-menu-popover' : undefined}
                    sx={{
                        p: 0.5,
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'scale(1.05)',
                        },
                        '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 4,
                            borderRadius: '50%',
                        },
                    }}
                >
                    {user?.photoURL ? (
                        <Avatar
                            src={user.photoURL}
                            alt={userDisplayName}
                            sx={{
                                width: { xs: 32, sm: 32, md: 36 },
                                height: { xs: 32, sm: 32, md: 36 },
                                transition: 'box-shadow 0.2s ease-in-out',
                            }}
                            imgProps={{
                                referrerPolicy: 'no-referrer',
                                crossOrigin: 'anonymous',
                                loading: 'lazy',
                            }}
                        />
                    ) : (
                        // Fallback avatar with initials
                        <Avatar
                            sx={{
                                width: { xs: 32, sm: 32, md: 40 },
                                height: { xs: 32, sm: 32, md: 40 },
                                bgcolor: 'primary.main',
                                fontSize: { xs: '0.875rem', md: '1rem' },
                                fontWeight: 600,
                            }}
                        >
                            {user?.displayName ? userInitial : <AccountCircleIcon />}
                        </Avatar>
                    )}
                </IconButton>

                {/* User Menu Popover - align with AppBar z-index for consistent nav stacking */}
                <Popover
                    id="user-menu-popover"
                    open={Boolean(userMenuAnchor)}
                    anchorEl={userMenuAnchor}
                    onClose={handleUserMenuClose}
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
                                mt: 1,
                                minWidth: { xs: 160, sm: 180 },
                                zIndex: 1300, // Above AppBar (1100) for proper visual stacking
                            },
                        },
                    }}
                >
                    <Box
                        role="menu"
                        sx={{
                            py: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* My Account Button */}
                        <Button
                            role="menuitem"
                            fullWidth
                            onClick={handleOpenAccount}
                            sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                py: 1.25,
                                px: 2,
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: { xs: '0.875rem', md: '0.95rem' },
                                transition: 'background-color 0.15s ease-in-out',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                '&:focus-visible': {
                                    outline: '2px solid',
                                    outlineColor: 'primary.main',
                                    outlineOffset: -2,
                                },
                            }}
                        >
                            My Account
                        </Button>

                        {/* Log out Button */}
                        <Button
                            role="menuitem"
                            fullWidth
                            onClick={handleLogoutClick}
                            sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                py: 1.25,
                                px: 2,
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: { xs: '0.875rem', md: '0.95rem' },
                                transition: 'background-color 0.15s ease-in-out',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                },
                                '&:focus-visible': {
                                    outline: '2px solid',
                                    outlineColor: 'primary.main',
                                    outlineOffset: -2,
                                },
                            }}
                        >
                            Log out
                        </Button>
                    </Box>
                </Popover>
            </Box>

            {/* Account Modal - for editing user profile (lazy-loaded) */}
            {showAccountModal && (
                <Suspense fallback={null}>
                    <AccountModal
                        open={showAccountModal}
                        onClose={() => setShowAccountModal(false)}
                        user={user}
                    />
                </Suspense>
            )}

            {/* Logout Modal - handles full logout flow (lazy-loaded) */}
            {showLogoutModal && (
                <Suspense fallback={null}>
                    <LogoutModal
                        open={showLogoutModal}
                        onClose={() => setShowLogoutModal(false)}
                        onLogoutComplete={onLogout}
                    />
                </Suspense>
            )}
        </>
    );
};

UserAvatar.propTypes = {
    /**
     * Firebase user object with authentication details
     * Must include at least one of: photoURL, displayName, or email
     */
    user: PropTypes.shape({
        photoURL: PropTypes.string,
        displayName: PropTypes.string,
        email: PropTypes.string,
    }).isRequired,
    /**
     * Callback triggered after successful logout and navigation
     * Optional - provided for parent component notification if needed
     */
    onLogout: PropTypes.func,
    onOpen: PropTypes.func,
    closeSignal: PropTypes.number,
};

UserAvatar.defaultProps = {
    onLogout: null,
    onOpen: null,
    closeSignal: 0,
};

export default UserAvatar;
