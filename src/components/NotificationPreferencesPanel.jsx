/**
 * src/components/NotificationPreferencesPanel.jsx
 * 
 * Purpose: BEP notification device management panel with multi-device support.
 * Uses enabled flag pattern (like WhatsApp/TradingView) - tokens are persistent,
 * enabled=true/false controls whether notifications are sent to each device.
 * 
 * Key Features:
 * - Auto-registers device on load if permission granted (updates lastSeenAt only)
 * - Lists ALL registered devices with friendly names
 * - Enable/disable toggle per device (does NOT delete token)
 * - "Remove device" option for permanent deletion
 * - Highlights current device in the list
 * - Shows last seen timestamp for each device
 * - Rename devices with custom names
 * - Customizable quiet hours with enable/disable and time pickers
 * - Mobile-first responsive design
 * 
 * Changelog:
 * v2.6.0 - 2026-02-03 - BEP: Add customizable quiet hours with enable/disable toggle
 *                       and start/end time pickers. Persists to Firestore.
 * v2.5.0 - 2026-02-03 - BEP: Show native browser prompt first on enable/retry.
 *                       Only show instructions modal if browser prompt denied.
 *                       Matches RemindersEditor2 native-first pattern.
 * v2.4.0 - 2026-02-03 - BEP: When denied, try native browser prompt first, then show
 *                       instructions modal as fallback. Better UX flow.
 * v2.3.0 - 2026-02-03 - BEP: Add "How to Enable" modal with browser-specific instructions
 *                       when notifications are blocked. CTA button in denied state.
 * v2.2.0 - 2026-02-03 - BEP: Use enabled flag pattern instead of delete.
 *                       Switch toggle per device, separate "Remove" action.
 * v2.1.0 - 2026-02-03 - BEP: Auto-register device on load if permission granted.
 * v2.0.0 - 2026-02-03 - BEP: Complete rewrite with multi-device management.
 * v1.0.0 - 2026-02-03 - Initial BEP implementation (single device only).
 */

import PropTypes from 'prop-types';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Stack,
    Alert,
    CircularProgress,
    IconButton,
    TextField,
    Chip,
    Tooltip,
    Switch,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Select,
    FormControl,
    InputLabel,
    Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import ComputerIcon from '@mui/icons-material/Computer';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import {
    requestFcmTokenForUser,
    getAllDeviceTokens,
    updateDeviceName,
    setDeviceEnabled,
    removeDevice,
    getNotificationPreferences,
    saveNotificationPreferences,
} from '../services/pushNotificationsService';

/**
 * Format relative time for last seen
 */
const formatLastSeen = (date, t) => {
    if (!date) return t('dialogs:devices.neverSeen');

    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('dialogs:devices.justNow');
    if (minutes < 60) return t('dialogs:devices.minutesAgo', { count: minutes });
    if (hours < 24) return t('dialogs:devices.hoursAgo', { count: hours });
    if (days < 7) return t('dialogs:devices.daysAgo', { count: days });

    // Format as date for older
    return date.toLocaleDateString();
};

/**
 * Single device row component with enable/disable toggle
 */
function DeviceRow({
    device,
    isCurrentDevice,
    onRename,
    onToggleEnabled,
    onRemove,
    isToggling,
    isRemoving,
    t
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(device.name);
    const [isSaving, setIsSaving] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);

    const handleSave = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        const success = await onRename(device.token, editName.trim());
        setIsSaving(false);
        if (success) setIsEditing(false);
    };

    const handleCancel = () => {
        setEditName(device.name);
        setIsEditing(false);
    };

    const handleMenuOpen = (event) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleRemove = () => {
        handleMenuClose();
        onRemove(device.token);
    };

    const DeviceIcon = device.isMobile ? PhoneAndroidIcon : ComputerIcon;
    const isDisabled = isToggling === device.token || isRemoving === device.token;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                p: 1.5,
                bgcolor: isCurrentDevice
                    ? (theme) => alpha(theme.palette.primary.main, 0.08)
                    : 'action.hover',
                borderRadius: 1.5,
                border: isCurrentDevice ? 2 : 0,
                borderColor: 'primary.main',
                opacity: device.enabled ? 1 : 0.7,
            }}
        >
            <DeviceIcon
                sx={{
                    color: device.enabled
                        ? (isCurrentDevice ? 'primary.main' : 'text.secondary')
                        : 'text.disabled',
                    fontSize: 24,
                    mt: 0.5
                }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                            size="small"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            sx={{ flex: 1 }}
                            disabled={isSaving}
                        />
                        <IconButton size="small" onClick={handleSave} disabled={isSaving || !editName.trim()}>
                            {isSaving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={handleCancel} disabled={isSaving}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                            variant="body2"
                            fontWeight={500}
                            noWrap
                            sx={{
                                flex: 1,
                                color: device.enabled ? 'text.primary' : 'text.disabled',
                            }}
                        >
                            {device.name}
                        </Typography>
                        {isCurrentDevice && (
                            <Chip
                                label={t('dialogs:devices.thisDevice')}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                        <Tooltip title={t('dialogs:devices.rename')}>
                            <IconButton size="small" onClick={() => setIsEditing(true)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {device.isPWA ? 'PWA • ' : ''}
                    {!device.enabled && `${t('dialogs:devices.disabled')} • `}
                    {formatLastSeen(device.lastSeenAt, t)}
                </Typography>
            </Box>

            {/* Enable/Disable Toggle */}
            <Tooltip title={device.enabled ? t('dialogs:devices.tapToDisable') : t('dialogs:devices.tapToEnable')}>
                <span>
                    <Switch
                        size="small"
                        checked={device.enabled}
                        onChange={() => onToggleEnabled(device.token, !device.enabled)}
                        disabled={isDisabled}
                    />
                </span>
            </Tooltip>

            {/* More options menu */}
            <IconButton size="small" onClick={handleMenuOpen} disabled={isDisabled}>
                {isRemoving === device.token ? (
                    <CircularProgress size={18} />
                ) : (
                    <MoreVertIcon fontSize="small" />
                )}
            </IconButton>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ zIndex: 1800 }}
            >
                <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteOutlineIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>{t('dialogs:devices.removeDevice')}</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
}

DeviceRow.propTypes = {
    device: PropTypes.shape({
        token: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        isMobile: PropTypes.bool,
        isPWA: PropTypes.bool,
        enabled: PropTypes.bool,
        lastSeenAt: PropTypes.instanceOf(Date),
    }).isRequired,
    isCurrentDevice: PropTypes.bool,
    onRename: PropTypes.func.isRequired,
    onToggleEnabled: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    isToggling: PropTypes.string,
    isRemoving: PropTypes.string,
    t: PropTypes.func.isRequired,
};

/**
 * NotificationPreferencesPanel Component
 */
export default function NotificationPreferencesPanel({
    user,
    onMessage,
    onError,
    showTitle = true,
}) {
    const { t } = useTranslation(['dialogs']);

    // Browser permission state
    const [browserPermission, setBrowserPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    );

    // Device list state
    const [devices, setDevices] = useState([]);
    const [currentToken, setCurrentToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Quiet hours state
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
    const [quietHoursStart, setQuietHoursStart] = useState(21);
    const [quietHoursEnd, setQuietHoursEnd] = useState(6);
    const [isSavingQuietHours, setIsSavingQuietHours] = useState(false);

    // Operation states
    const [isEnabling, setIsEnabling] = useState(false);
    const [isToggling, setIsToggling] = useState(null); // token being toggled
    const [isRemoving, setIsRemoving] = useState(null); // token being removed
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Internal messages
    const [internalMessage, setInternalMessage] = useState('');
    const [internalError, setInternalError] = useState('');

    // Format hour for display (12-hour format)
    const formatHour = useCallback((hour) => {
        const normalized = ((hour % 24) + 24) % 24;
        const suffix = normalized >= 12 ? 'PM' : 'AM';
        const hour12 = normalized % 12 || 12;
        return `${hour12}:00 ${suffix}`;
    }, []);

    // Generate hour options for select
    const hourOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            options.push({ value: h, label: formatHour(h) });
        }
        return options;
    }, [formatHour]);

    // Detect browser for help instructions
    const getBrowserName = useCallback(() => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('edg/')) return 'Microsoft Edge';
        if (ua.includes('chrome') && !ua.includes('edg')) return 'Google Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
        if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
        return t('dialogs:notifications.yourBrowser');
    }, [t]);

    // Get browser-specific instructions
    const getBrowserInstructions = useCallback(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod/.test(ua);

        if (ua.includes('chrome') && !ua.includes('edg')) {
            if (isMobile) {
                return [
                    t('dialogs:notifications.instructions.chromeMobile1'),
                    t('dialogs:notifications.instructions.chromeMobile2'),
                    t('dialogs:notifications.instructions.chromeMobile3'),
                    t('dialogs:notifications.instructions.chromeMobile4'),
                ];
            }
            return [
                t('dialogs:notifications.instructions.chrome1'),
                t('dialogs:notifications.instructions.chrome2'),
                t('dialogs:notifications.instructions.chrome3'),
                t('dialogs:notifications.instructions.chrome4'),
            ];
        }
        if (ua.includes('safari') && !ua.includes('chrome')) {
            return [
                t('dialogs:notifications.instructions.safari1'),
                t('dialogs:notifications.instructions.safari2'),
                t('dialogs:notifications.instructions.safari3'),
                t('dialogs:notifications.instructions.safari4'),
            ];
        }
        if (ua.includes('firefox')) {
            return [
                t('dialogs:notifications.instructions.firefox1'),
                t('dialogs:notifications.instructions.firefox2'),
                t('dialogs:notifications.instructions.firefox3'),
            ];
        }
        if (ua.includes('edg/')) {
            return [
                t('dialogs:notifications.instructions.edge1'),
                t('dialogs:notifications.instructions.edge2'),
                t('dialogs:notifications.instructions.edge3'),
                t('dialogs:notifications.instructions.edge4'),
            ];
        }
        // Generic fallback
        return [
            t('dialogs:notifications.instructions.generic1'),
            t('dialogs:notifications.instructions.generic2'),
            t('dialogs:notifications.instructions.generic3'),
        ];
    }, [t]);

    // Message helpers
    const setMessage = useCallback((msg) => {
        if (onMessage) onMessage(msg);
        else {
            setInternalMessage(msg);
            setInternalError('');
        }
    }, [onMessage]);

    const setError = useCallback((err) => {
        if (onError) onError(err);
        else {
            setInternalError(err);
            setInternalMessage('');
        }
    }, [onError]);

    // Auto-register device if permission already granted (like WhatsApp/TradingView)
    // This only updates lastSeenAt, does NOT change enabled flag
    const autoRegisterDevice = useCallback(async () => {
        if (!user?.uid) return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

        try {
            // This will either register a new token or update lastSeenAt for existing
            await requestFcmTokenForUser(user.uid);
        } catch (err) {
            console.warn('[NotificationPreferencesPanel] Auto-register failed:', err);
        }
    }, [user?.uid]);

    // Load devices
    const loadDevices = useCallback(async () => {
        if (!user?.uid) {
            setDevices([]);
            setIsLoading(false);
            return;
        }

        // Update browser permission
        if (typeof Notification !== 'undefined') {
            setBrowserPermission(Notification.permission);
        }

        setIsLoading(true);
        try {
            const [devicesResult, prefsResult] = await Promise.all([
                getAllDeviceTokens(user.uid),
                getNotificationPreferences(user.uid),
            ]);
            setDevices(devicesResult.devices);
            setCurrentToken(devicesResult.currentToken);

            // Load quiet hours preferences
            if (prefsResult.quietHours) {
                setQuietHoursEnabled(prefsResult.quietHours.enabled);
                setQuietHoursStart(prefsResult.quietHours.start);
                setQuietHoursEnd(prefsResult.quietHours.end);
            }
        } catch {
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    // On mount: auto-register if permission granted, then load devices
    useEffect(() => {
        const init = async () => {
            await autoRegisterDevice();
            await loadDevices();
        };
        init();
    }, [autoRegisterDevice, loadDevices]);

    // Handle enabling push notifications (register current device for first time)
    const handleEnable = async () => {
        if (!user?.uid) return;

        setIsEnabling(true);
        setInternalError('');
        setInternalMessage('');

        try {
            // First: Try to show native browser permission prompt
            if (typeof Notification === 'undefined') {
                setError(t('dialogs:notifications.unsupported'));
                setIsEnabling(false);
                return;
            }

            // Request permission directly from browser
            const permissionResult = await Notification.requestPermission();

            if (permissionResult === 'granted') {
                // Success! Now register the device for push
                const result = await requestFcmTokenForUser(user.uid);

                if (result.status === 'granted' || result.token) {
                    setBrowserPermission('granted');
                    setMessage(t('dialogs:notifications.enabled'));
                    // Reload devices to show the new one
                    await loadDevices();
                } else {
                    // Permission granted but registration failed
                    setError(t('dialogs:notifications.enableError'));
                }
            } else if (permissionResult === 'denied') {
                // User denied in native prompt
                setBrowserPermission('denied');
                setError(t('dialogs:notifications.deniedError'));
            } else {
                // User dismissed (default state)
                setError(t('dialogs:notifications.enableError'));
            }
        } catch (err) {
            console.error('[NotificationPreferencesPanel] Enable failed:', err);
            setError(t('dialogs:notifications.enableError'));
        } finally {
            setIsEnabling(false);
        }
    };

    // Handle trying to enable again when permission was previously denied
    // First attempts native browser prompt, shows instructions if still denied
    const handleTryEnableAgain = async () => {
        if (!user?.uid) return;

        setIsEnabling(true);
        setInternalError('');
        setInternalMessage('');

        try {
            // First: Try to show native browser permission prompt
            if (typeof Notification === 'undefined') {
                setError(t('dialogs:notifications.unsupported'));
                setIsEnabling(false);
                return;
            }

            // Request permission directly from browser
            const permissionResult = await Notification.requestPermission();

            if (permissionResult === 'granted') {
                // Success! Now register the device for push
                const result = await requestFcmTokenForUser(user.uid);

                if (result.status === 'granted' || result.token) {
                    setBrowserPermission('granted');
                    setMessage(t('dialogs:notifications.enabled'));
                    await loadDevices();
                } else {
                    // Permission granted but registration failed
                    setError(t('dialogs:notifications.enableError'));
                }
            } else {
                // User still denied - show instructions modal as fallback
                setBrowserPermission(Notification.permission);
                setShowHelpModal(true);
            }
        } catch (err) {
            console.error('[NotificationPreferencesPanel] Try enable again failed:', err);
            // Show instructions as fallback
            setShowHelpModal(true);
        } finally {
            setIsEnabling(false);
        }
    };

    // Handle renaming a device
    const handleRename = async (token, newName) => {
        if (!user?.uid) return false;

        try {
            const result = await updateDeviceName(user.uid, token, newName);
            if (result.success) {
                // Update local state
                setDevices((prev) =>
                    prev.map((d) => (d.token === token ? { ...d, name: newName } : d))
                );
                return true;
            }
            setError(t('dialogs:devices.renameError'));
            return false;
        } catch {
            setError(t('dialogs:devices.renameError'));
            return false;
        }
    };

    // Handle toggling device enabled status
    const handleToggleEnabled = async (token, enabled) => {
        if (!user?.uid) return;

        setIsToggling(token);
        setInternalError('');
        setInternalMessage('');

        try {
            const result = await setDeviceEnabled(user.uid, token, enabled);

            if (result.success) {
                // Update local state
                setDevices((prev) =>
                    prev.map((d) => (d.token === token ? { ...d, enabled } : d))
                );
                setMessage(enabled
                    ? t('dialogs:devices.deviceEnabled')
                    : t('dialogs:devices.deviceDisabled')
                );
            } else {
                setError(t('dialogs:devices.toggleError'));
            }
        } catch {
            setError(t('dialogs:devices.toggleError'));
        } finally {
            setIsToggling(null);
        }
    };

    // Handle removing a device permanently
    const handleRemove = async (token) => {
        if (!user?.uid) return;

        setIsRemoving(token);
        setInternalError('');
        setInternalMessage('');

        try {
            const result = await removeDevice(user.uid, token);

            if (result.success) {
                // Remove from local state
                setDevices((prev) => prev.filter((d) => d.token !== token));
                setMessage(t('dialogs:devices.deviceRemoved'));
            } else {
                setError(t('dialogs:devices.removeError'));
            }
        } catch {
            setError(t('dialogs:devices.removeError'));
        } finally {
            setIsRemoving(null);
        }
    };

    // Handle saving quiet hours preferences
    const handleSaveQuietHours = useCallback(async (enabled, start, end) => {
        if (!user?.uid) return;

        setIsSavingQuietHours(true);
        try {
            const result = await saveNotificationPreferences(user.uid, {
                quietHoursEnabled: enabled,
                quietHoursStart: start,
                quietHoursEnd: end,
            });

            if (result.success) {
                setMessage(t('dialogs:quietHours.saved'));
            } else {
                setError(t('dialogs:quietHours.saveError'));
            }
        } catch {
            setError(t('dialogs:quietHours.saveError'));
        } finally {
            setIsSavingQuietHours(false);
        }
    }, [user?.uid, setMessage, setError, t]);

    // Handle quiet hours toggle
    const handleQuietHoursToggle = useCallback((enabled) => {
        setQuietHoursEnabled(enabled);
        handleSaveQuietHours(enabled, quietHoursStart, quietHoursEnd);
    }, [handleSaveQuietHours, quietHoursStart, quietHoursEnd]);

    // Handle quiet hours time change
    const handleQuietHoursTimeChange = useCallback((type, value) => {
        const newStart = type === 'start' ? value : quietHoursStart;
        const newEnd = type === 'end' ? value : quietHoursEnd;

        if (type === 'start') {
            setQuietHoursStart(value);
        } else {
            setQuietHoursEnd(value);
        }

        handleSaveQuietHours(quietHoursEnabled, newStart, newEnd);
    }, [handleSaveQuietHours, quietHoursEnabled, quietHoursStart, quietHoursEnd]);

    // Check if current device is registered
    const isCurrentDeviceRegistered = currentToken && devices.some((d) => d.token === currentToken);

    // Count enabled devices
    const enabledCount = devices.filter((d) => d.enabled).length;

    // Determine status display
    const getStatusInfo = () => {
        if (browserPermission === 'unsupported') {
            return {
                icon: NotificationsOffIcon,
                color: 'text.disabled',
                label: t('dialogs:notifications.unsupported'),
            };
        }
        if (browserPermission === 'denied') {
            return {
                icon: NotificationsOffIcon,
                color: 'error.main',
                label: t('dialogs:notifications.statusDenied'),
            };
        }
        if (enabledCount > 0) {
            return {
                icon: NotificationsActiveIcon,
                color: 'success.main',
                label: t('dialogs:devices.devicesEnabled', { count: enabledCount }),
            };
        }
        if (devices.length > 0) {
            return {
                icon: NotificationsOffIcon,
                color: 'warning.main',
                label: t('dialogs:devices.allDevicesDisabled'),
            };
        }
        return {
            icon: NotificationsIcon,
            color: 'text.secondary',
            label: t('dialogs:notifications.statusDefault'),
        };
    };

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    return (
        <Box>
            {showTitle && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        {t('dialogs:notifications.title')}
                    </Typography>
                    {!isLoading && devices.length > 0 && (
                        <IconButton size="small" onClick={loadDevices} disabled={isLoading}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )}

            {/* Status Header */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1.5,
                mb: 2,
            }}>
                {isLoading ? (
                    <CircularProgress size={24} />
                ) : (
                    <StatusIcon sx={{ color: status.color, fontSize: 24 }} />
                )}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                        {isLoading ? t('dialogs:devices.loading') : status.label}
                    </Typography>
                    {browserPermission === 'denied' && (
                        <Typography variant="caption" color="text.secondary">
                            {t('dialogs:notifications.deniedHint')}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Device List */}
            {!isLoading && devices.length > 0 && (
                <>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {t('dialogs:devices.registeredDevices')}
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 2 }}>
                        {devices.map((device) => (
                            <DeviceRow
                                key={device.token}
                                device={device}
                                isCurrentDevice={device.token === currentToken}
                                onRename={handleRename}
                                onToggleEnabled={handleToggleEnabled}
                                onRemove={handleRemove}
                                isToggling={isToggling}
                                isRemoving={isRemoving}
                                t={t}
                            />
                        ))}
                    </Stack>
                </>
            )}

            {/* Action Buttons */}
            {!isLoading && (
                <Stack spacing={1}>
                    {/* Show enable button if permission not granted or current device not registered */}
                    {browserPermission !== 'denied' && !isCurrentDeviceRegistered && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={isEnabling ? <CircularProgress size={16} /> : <NotificationsActiveIcon />}
                            onClick={handleEnable}
                            disabled={isEnabling}
                            fullWidth
                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                        >
                            {isEnabling
                                ? t('dialogs:notifications.enabling')
                                : browserPermission === 'granted'
                                    ? t('dialogs:devices.registerThisDevice')
                                    : t('dialogs:notifications.enable')
                            }
                        </Button>
                    )}

                    {browserPermission === 'denied' && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={isEnabling ? <CircularProgress size={16} /> : <NotificationsActiveIcon />}
                            onClick={handleTryEnableAgain}
                            disabled={isEnabling}
                            fullWidth
                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                        >
                            {isEnabling
                                ? t('dialogs:notifications.enabling')
                                : t('dialogs:notifications.tryEnableAgain')
                            }
                        </Button>
                    )}
                </Stack>
            )}

            {/* Quiet Hours Settings - Show when notifications are enabled */}
            {!isLoading && (browserPermission === 'granted' || devices.length > 0) && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <NightsStayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {t('dialogs:quietHours.title')}
                                </Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={quietHoursEnabled}
                                        onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                                        disabled={isSavingQuietHours}
                                    />
                                }
                                label=""
                                sx={{ m: 0 }}
                            />
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                            {t('dialogs:quietHours.description')}
                        </Typography>

                        {quietHoursEnabled && (
                            <Box sx={{
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: 'action.hover',
                                borderRadius: 1.5,
                            }}>
                                <FormControl size="small" sx={{ minWidth: 120, '& .MuiPopover-root': { zIndex: 1702 } }}>
                                    <InputLabel id="quiet-hours-start-label">
                                        {t('dialogs:quietHours.start')}
                                    </InputLabel>
                                    <Select
                                        labelId="quiet-hours-start-label"
                                        value={quietHoursStart}
                                        label={t('dialogs:quietHours.start')}
                                        onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
                                        disabled={isSavingQuietHours}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { zIndex: 1702 }
                                            }
                                        }}
                                    >
                                        {hourOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography variant="body2" color="text.secondary">
                                    {t('dialogs:quietHours.to')}
                                </Typography>

                                <FormControl size="small" sx={{ minWidth: 120, '& .MuiPopover-root': { zIndex: 1702 } }}>
                                    <InputLabel id="quiet-hours-end-label">
                                        {t('dialogs:quietHours.end')}
                                    </InputLabel>
                                    <Select
                                        labelId="quiet-hours-end-label"
                                        value={quietHoursEnd}
                                        label={t('dialogs:quietHours.end')}
                                        onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
                                        disabled={isSavingQuietHours}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: { zIndex: 1702 }
                                            }
                                        }}
                                    >
                                        {hourOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {isSavingQuietHours && <CircularProgress size={16} />}
                            </Box>
                        )}

                        {!quietHoursEnabled && (
                            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                                {t('dialogs:quietHours.disabledInfo')}
                            </Alert>
                        )}
                    </Box>
                </>
            )}

            {/* How to Enable Notifications Modal */}
            <Dialog
                open={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                maxWidth="sm"
                fullWidth
                sx={{ zIndex: 1800 }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HelpOutlineIcon color="warning" />
                    {t('dialogs:notifications.howToEnableTitle')}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" paragraph>
                        {t('dialogs:notifications.blockedExplanation')}
                    </Typography>
                    <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            {getBrowserName()}:
                        </Typography>
                        <Typography variant="body2" component="div">
                            <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                {getBrowserInstructions().map((step, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
                                ))}
                            </ol>
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {t('dialogs:notifications.afterEnabling')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setShowHelpModal(false)} sx={{ textTransform: 'none' }}>
                        {t('dialogs:gotIt')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Empty state */}
            {!isLoading && devices.length === 0 && browserPermission === 'granted' && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    {t('dialogs:devices.noDevices')}
                </Typography>
            )}

            {/* Internal Messages */}
            {!onMessage && !onError && (
                <>
                    {internalError && (
                        <Alert
                            severity="error"
                            onClose={() => setInternalError('')}
                            sx={{ mt: 2, borderRadius: 2 }}
                        >
                            {internalError}
                        </Alert>
                    )}
                    {internalMessage && (
                        <Alert
                            severity="success"
                            onClose={() => setInternalMessage('')}
                            sx={{ mt: 2, borderRadius: 2 }}
                        >
                            {internalMessage}
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}

NotificationPreferencesPanel.propTypes = {
    user: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }),
    onMessage: PropTypes.func,
    onError: PropTypes.func,
    showTitle: PropTypes.bool,
};
