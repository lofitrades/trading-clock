/**
 * src/components/PushPermissionModal.jsx
 * 
 * Purpose: BEP modal to prompt users for notification permission on app load.
 * Key responsibility: Display a user-friendly explanation of why notifications
 * are needed and trigger the browser's permission prompt.
 * 
 * Note: This modal is shown when user has reminders with browser OR push channels
 * enabled but hasn't granted notification permission yet. Both channels require
 * the same browser permission (Notification.permission).
 * 
 * Changelog:
 * v1.1.0 - 2026-02-03 - BEP: Updated copy to be generic "Notifications" (not just Push).
 *                       Applies to both browser and push notification channels.
 * v1.0.0 - 2026-02-03 - Initial implementation with MUI and i18n support.
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';

/**
 * PushPermissionModal Component
 * 
 * Displays a friendly modal explaining why notifications are needed
 * and provides a CTA to request permission from the browser.
 * Used for BOTH browser and push notification channels.
 * 
 * @param {boolean} open - Whether the modal is open
 * @param {function} onClose - Callback when modal is dismissed (not now)
 * @param {function} onRequestPermission - Callback to trigger permission request
 * @param {boolean} isRequesting - Whether permission request is in progress
 */
export default function PushPermissionModal({
    open = false,
    onClose,
    onRequestPermission,
    isRequesting = false,
}) {
    const { t } = useTranslation(['dialogs', 'common']);

    const handleRequestPermission = async () => {
        if (onRequestPermission) {
            await onRequestPermission();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex: 12002 }}
            slotProps={{
                backdrop: { sx: BACKDROP_OVERLAY_SX },
                paper: {
                    sx: {
                        zIndex: 12002,
                        borderRadius: 3,
                        p: 1,
                    },
                },
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.contrastText',
                        }}
                    >
                        <NotificationsActiveIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography variant="h6" component="span" fontWeight={600}>
                        {t('dialogs:notificationPermission.title', 'Enable Notifications')}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'center', mb: 2 }}
                >
                    {t(
                        'dialogs:notificationPermission.description',
                        'You have reminders set up that use notifications. To receive them on this device, please allow notifications when prompted.'
                    )}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        textAlign: 'center',
                        display: 'block',
                        opacity: 0.8,
                    }}
                >
                    {t(
                        'dialogs:notificationPermission.hint',
                        'You can change this anytime in your browser settings.'
                    )}
                </Typography>
            </DialogContent>
            <DialogActions
                sx={{
                    flexDirection: 'column',
                    gap: 1,
                    px: 3,
                    pb: 3,
                }}
            >
                <Button
                    onClick={handleRequestPermission}
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isRequesting}
                    startIcon={
                        isRequesting ? <CircularProgress size={16} color="inherit" /> : null
                    }
                >
                    {isRequesting
                        ? t('common:loading', 'Loading...')
                        : t('dialogs:notificationPermission.allow', 'Allow Notifications')}
                </Button>
                <Button
                    onClick={onClose}
                    variant="text"
                    color="inherit"
                    fullWidth
                    disabled={isRequesting}
                    sx={{ color: 'text.secondary' }}
                >
                    {t('dialogs:notificationPermission.notNow', 'Not Now')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

PushPermissionModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onRequestPermission: PropTypes.func.isRequired,
    isRequesting: PropTypes.bool,
};
