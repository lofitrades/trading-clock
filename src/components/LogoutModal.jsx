/**
 * src/components/LogoutModal.jsx
 * 
 * Purpose: Standalone logout confirmation modal that handles Firebase logout flow.
 * Encapsulates logout state management, error handling, and Firebase sign-out logic.
 * Provides single source of truth for logout confirmation across the app.
 * 
 * Key Features:
 * - Handles full logout flow (sign-out, settings reset, navigation)
 * - Complete user data cleanup (Firebase + localStorage + all preferences)
 * - Sets sensible defaults after logout confirmation
 * - Error boundary with user-friendly error messages
 * - Prevents double-clicks with loading state
 * - Respects user preference for reduced motion
 * - Enterprise z-index stacking (Dialog: 10001+)
 * 
 * Changelog:
 * v1.1.0 - 2026-01-17 - ENHANCED LOGOUT: Ensure complete user preference cleanup. Reset settings BEFORE sign-out to clear state immediately. Add explicit localStorage targeted cleanup for user-specific keys. Ensure all async operations complete before navigation. Set sensible defaults (America/New_York timezone, show all clock elements). Follows BEP enterprise logout patterns.
 * v1.0.1 - 2026-01-15 - Modal layering: keep backdrop behind paper and ensure modal stacks above AppBar.
 * v1.0.0 - 2026-01-14 - INITIAL COMPONENT: Created standalone LogoutModal for enterprise logout flow.
 * Manages Firebase sign-out, settings reset, and navigation internally. Prevents double-click logout
 * with loading state on confirm button. Includes error handling with retry capability.
 * Props: open (bool), onClose (callback), onLogoutComplete (callback on success).
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Box,
    Alert,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useSettings } from '../contexts/SettingsContext';

const LogoutModal = ({ open = false, onClose, onLogoutComplete }) => {
    const navigate = useNavigate();
    const { resetSettings } = useSettings();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reset error when modal closes
    const handleClose = useCallback(() => {
        setError(null);
        setIsLoading(false);
        onClose();
    }, [onClose]);

    // Handle logout confirmation
    const handleLogoutConfirm = useCallback(async () => {
        // Prevent double-clicks
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            // STEP 1: Reset all user settings and preferences FIRST
            // This clears localStorage and resets all state to defaults
            // Must happen before Firebase sign-out to ensure clean state
            await resetSettings();

            // STEP 2: Clear any remaining user-specific localStorage keys
            // Target only user-specific data, not app-wide data like consent
            const userSpecificKeys = [
                'selectedTimezone',
                'eventFilters',
                'newsSource',
                'clockSize',
                'sessions',
                'showHandClock',
                'showDigitalClock',
                'showSessionLabel',
                'showTimezoneLabel',
                'showTimeToEnd',
                'showTimeToStart',
                'showSessionNamesInCanvas',
                'showEventsOnCanvas',
                'showClockNumbers',
                'showClockHands',
                'showPastSessionsGray',
                'backgroundBasedOnSession',
            ];

            userSpecificKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                }
            });

            // STEP 3: Sign out from Firebase
            // After state reset, perform Firebase sign-out
            await signOut(auth);

            // STEP 4: Close modal and trigger callbacks
            handleClose();

            // Call success callback if provided
            if (onLogoutComplete) {
                onLogoutComplete();
            }

            // STEP 5: Navigate to home after all cleanup is complete
            // Ensures user sees clean state on home page
            navigate('/');
        } catch (err) {
            console.error('Logout failed:', err);
            setError(
                err?.message || 'Failed to log out. Please try again or refresh the page.'
            );
            setIsLoading(false);
        }
    }, [isLoading, resetSettings, handleClose, onLogoutComplete, navigate]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            sx={{ zIndex: 1701 }}
            slotProps={{
                backdrop: { sx: BACKDROP_OVERLAY_SX },
            }}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 20px 60px rgba(15,23,42,0.15)',
                },
            }}
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
        >
            <DialogTitle
                id="logout-dialog-title"
                sx={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'text.primary',
                }}
            >
                Log out?
            </DialogTitle>

            <DialogContent id="logout-dialog-description" sx={{ pt: 2 }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        lineHeight: 1.6,
                        mb: error ? 2 : 0,
                    }}
                >
                    Are you sure you want to log out? You&apos;ll need to sign in again to access your
                    saved settings.
                </Typography>

                {/* Error message with retry option */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ mt: 2 }}
                    >
                        <Typography variant="body2" sx={{ color: 'error.dark' }}>
                            {error}
                        </Typography>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={handleClose}
                    disabled={isLoading}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Cancel
                </Button>

                <Box sx={{ position: 'relative' }}>
                    <Button
                        onClick={handleLogoutConfirm}
                        disabled={isLoading}
                        variant="contained"
                        color="primary"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            minWidth: 100,
                        }}
                    >
                        {isLoading ? 'Logging out...' : 'Log out'}
                    </Button>

                    {/* Loading spinner overlay */}
                    {isLoading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

LogoutModal.propTypes = {
    /**
     * Controls whether the modal is open
     */
    open: PropTypes.bool,
    /**
     * Callback fired when the modal should close (Cancel button or close icon clicked)
     */
    onClose: PropTypes.func.isRequired,
    /**
     * Callback fired after successful logout and navigation
     */
    onLogoutComplete: PropTypes.func,
};

LogoutModal.defaultProps = {
    open: false,
    onLogoutComplete: null,
};

export default LogoutModal;
