/**
 * src/components/RemindersEditor2.jsx
 * 
 * Purpose: Google-like modern reminders UI with individual save buttons per reminder
 * Key Features:
 * - Individual reminder cards with own save/cancel/edit/delete buttons
 * - View/edit mode toggle per reminder
 * - "Apply to" scope inside each reminder form
 * - Immediate deletion (no confirmation)
 * - Max 3 reminders per event
 * - Google Calendar-style MUI Card design
 * - Permission requests integrated into save flow
 * 
 * Changelog:
 * v2.2.0 - 2026-01-24 - BEP i18n migration: Added useTranslation hook, converted 35+ hardcoded strings to t() calls
 * v2.1.0 - 2026-01-23 - Limit to one reminder per event (both custom and non-custom events)
 * v2.0.0 - 2026-01-24 - Complete BEP refactor: Individual save buttons, inline scope selector, view/edit modes, Google-like cards
 */

import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EventIcon from '@mui/icons-material/Event';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { getReminderPolicyWarnings } from '../utils/remindersPolicy';

const DEFAULT_REMINDER = { minutesBefore: 5, channels: { inApp: true, browser: false, push: false }, leadUnit: 'minutes', leadValue: 5 };
const LEAD_UNIT_OPTIONS = [
    { value: 'minutes', labelKey: 'reminders:units.minutes', max: 59, multiplier: 1 },
    { value: 'hours', labelKey: 'reminders:units.hours', max: 23, multiplier: 60 },
    { value: 'days', labelKey: 'reminders:units.days', max: 1, multiplier: 1440 },
];

/**
 * Individual Reminder Card Component
 */
function ReminderCard({
    reminder,
    index,
    isEditing,
    isSaved,
    isSaving,
    scope,
    seriesKey,
    seriesLabel,
    disabled,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onRequestBrowserPermission,
    onRequestPushPermission,
}) {
    const { t } = useTranslation();
    const theme = useTheme();
    const [localReminder, setLocalReminder] = useState(reminder);
    const [localScope, setLocalScope] = useState(scope);
    const [permissionNotice, setPermissionNotice] = useState('');

    // Update local state when reminder prop changes (after save completes)
    useEffect(() => {
        if (!isSaving) {
            setLocalReminder(reminder);
            setLocalScope(scope);
        }
    }, [reminder, scope, isSaving]);

    const resolveLeadUnit = (rem) => {
        if (rem?.leadUnit) return rem.leadUnit;
        const minutesBefore = Number(rem?.minutesBefore);
        if (Number.isFinite(minutesBefore) && minutesBefore >= 1440 && minutesBefore % 1440 === 0) return 'days';
        if (Number.isFinite(minutesBefore) && minutesBefore >= 60 && minutesBefore % 60 === 0) return 'hours';
        return 'minutes';
    };

    const resolveLeadValue = (rem) => {
        if (Number.isFinite(rem?.leadValue)) return Number(rem.leadValue);
        const unit = resolveLeadUnit(rem);
        const minutesBefore = Number(rem?.minutesBefore);
        const option = LEAD_UNIT_OPTIONS.find((item) => item.value === unit) || LEAD_UNIT_OPTIONS[0];
        if (!Number.isFinite(minutesBefore)) return option.max;
        return Math.min(option.max, Math.max(0, Math.round(minutesBefore / option.multiplier)));
    };

    const applyLeadTime = (rem, leadValue, leadUnit) => {
        const option = LEAD_UNIT_OPTIONS.find((item) => item.value === leadUnit) || LEAD_UNIT_OPTIONS[0];
        const safeValue = Math.min(option.max, Math.max(0, Number(leadValue) || 0));
        return {
            ...rem,
            leadUnit: option.value,
            leadValue: safeValue,
            minutesBefore: safeValue * option.multiplier,
        };
    };

    const formatLeadTime = (rem) => {
        const unit = resolveLeadUnit(rem);
        const value = resolveLeadValue(rem);
        const unitLabel = unit === 'days' ? (value === 1 ? 'day' : 'days')
            : unit === 'hours' ? (value === 1 ? 'hour' : 'hours')
                : (value === 1 ? 'minute' : 'minutes');
        return `${value} ${unitLabel}`;
    };

    const formatChannels = (rem) => {
        const channels = rem?.channels || {};
        const active = [];
        if (channels.inApp) active.push(t('reminders:channels.inApp'));
        if (channels.browser) active.push(t('reminders:channels.browser'));
        if (channels.push) active.push(t('reminders:channels.push'));
        return active.length > 0 ? active.join(', ') : t('reminders:labels.noChannels');
    };

    const handleFieldChange = (key, value) => {
        if (key === 'leadUnit') {
            setLocalReminder(applyLeadTime(localReminder, resolveLeadValue(localReminder), value));
        } else if (key === 'leadValue') {
            const unit = resolveLeadUnit(localReminder);
            setLocalReminder(applyLeadTime(localReminder, value, unit));
        } else {
            setLocalReminder({ ...localReminder, [key]: value });
        }
        setPermissionNotice('');
    };

    const handleChannelToggle = (channel) => async (e) => {
        const checked = e.target.checked;
        let allowChecked = checked;

        setPermissionNotice('');

        if (channel === 'browser' && checked && onRequestBrowserPermission) {
            try {
                const result = await onRequestBrowserPermission();
                if (result !== 'granted') {
                    allowChecked = false;
                    setPermissionNotice(
                        result === 'denied'
                            ? t('reminders:permissions.browserBlocked')
                            : result === 'unsupported'
                                ? t('reminders:permissions.browserUnsupported')
                                : t('reminders:permissions.browserDismissed')
                    );
                }
            } catch {
                allowChecked = false;
                setPermissionNotice(t('reminders:permissions.browserError'));
            }
        }

        if (channel === 'push' && checked && onRequestPushPermission) {
            try {
                const result = await onRequestPushPermission();
                if (result === 'token-missing' || result === 'token-pending') {
                    setPermissionNotice(t('reminders:permissions.pushPending'));
                } else if (result !== 'granted') {
                    allowChecked = false;
                    setPermissionNotice(
                        result === 'auth-required'
                            ? t('reminders:permissions.pushAuthRequired')
                            : result === 'permission-default'
                                ? t('reminders:permissions.pushDismissed')
                                : result === 'missing-vapid'
                                    ? t('reminders:permissions.pushIncomplete')
                                    : t('reminders:permissions.pushError')
                    );
                }
            } catch {
                allowChecked = false;
                setPermissionNotice(t('reminders:permissions.pushFailure'));
            }
        }

        const channels = { ...(localReminder.channels || {}) };
        channels[channel] = allowChecked;
        setLocalReminder({ ...localReminder, channels });
    };

    const handleSave = async () => {
        try {
            await onSave(index, localReminder, localScope);
        } catch (error) {
            console.error(t('admin:reminders.saveFailed'), error);
        }
    };

    const handleCancel = () => {
        setLocalReminder(reminder);
        setLocalScope(scope);
        setPermissionNotice('');
        onCancel(index);
    };

    const scopeLabel = localScope === 'series' && seriesLabel
        ? t('reminders:scope.allSeries', { label: seriesLabel })
        : localScope === 'series'
            ? t('reminders:scope.allMatching')
            : t('reminders:scope.eventOnly');

    // View Mode - Saved Reminder
    if (isSaved && !isEditing) {
        return (
            <Card
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                    },
                }}
            >
                <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                            <NotificationsActiveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                            <Stack direction="column" spacing={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {formatLeadTime(reminder)} {t('reminders:labels.before')}
                                </Typography>
                                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                    <Chip
                                        label={formatChannels(reminder)}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                    />
                                    <Chip
                                        label={scopeLabel}
                                        size="small"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: 20,
                                            bgcolor: alpha(theme.palette.success.main, 0.12),
                                            color: 'success.dark',
                                            borderColor: 'success.main',
                                            border: '1px solid',
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={0.5}>
                            <IconButton
                                size="small"
                                onClick={() => onEdit(index)}
                                disabled={disabled}
                                title={t('reminders:actions.edit')}
                                sx={{
                                    color: 'primary.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                }}
                            >
                                <EditRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => onDelete(index)}
                                disabled={disabled}
                                title={t('reminders:actions.delete')}
                                sx={{
                                    color: 'error.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                                }}
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    // Edit Mode - Editing Existing or New Reminder
    return (
        <Card
            elevation={2}
            sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                    {/* Lead Time Input */}
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <TextField
                            label={t('reminders:labels.leadTime')}
                            type="number"
                            value={resolveLeadValue(localReminder)}
                            onChange={(e) => handleFieldChange('leadValue', Number(e.target.value))}
                            inputProps={{
                                min: 0,
                                max: (LEAD_UNIT_OPTIONS.find((item) => item.value === resolveLeadUnit(localReminder)) || LEAD_UNIT_OPTIONS[0]).max
                            }}
                            size="small"
                            sx={{ width: 110 }}
                            disabled={disabled || isSaving}
                        />
                        <TextField
                            select
                            label={t('reminders:labels.unit')}
                            value={resolveLeadUnit(localReminder)}
                            onChange={(e) => handleFieldChange('leadUnit', e.target.value)}
                            size="small"
                            sx={{ width: 110 }}
                            disabled={disabled || isSaving}
                            SelectProps={{
                                MenuProps: {
                                    sx: { zIndex: 12010 },
                                },
                            }}
                        >
                            {LEAD_UNIT_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {t(option.labelKey)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>

                    {/* Channels */}
                    <Box>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                            {t('reminders:sections.channels')}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={Boolean(localReminder.channels?.inApp)}
                                        onChange={handleChannelToggle('inApp')}
                                        disabled={disabled || isSaving}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">{t('reminders:channels.inApp')}</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={Boolean(localReminder.channels?.browser)}
                                        onChange={handleChannelToggle('browser')}
                                        disabled={disabled || isSaving}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">{t('reminders:channels.browser')}</Typography>}
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={Boolean(localReminder.channels?.push)}
                                        onChange={handleChannelToggle('push')}
                                        disabled={disabled || isSaving}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="body2">{t('reminders:channels.push')}</Typography>}
                            />
                        </Stack>
                    </Box>

                    {/* Apply To (Scope) - Show when seriesKey exists and in edit mode */}
                    {seriesKey && isEditing && (
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                {t('reminders:sections.applyTo')}
                            </Typography>
                            <ToggleButtonGroup
                                value={localScope}
                                exclusive
                                onChange={(_e, value) => value && setLocalScope(value)}
                                fullWidth
                                disabled={disabled || isSaving}
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        py: 1.25,
                                        px: 2,
                                        border: '1.5px solid',
                                        borderColor: 'divider',
                                        borderRadius: '8px !important',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            borderColor: 'primary.main',
                                        },
                                        '&.Mui-selected': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                            fontWeight: 600,
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                            },
                                        },
                                        '&.Mui-disabled': {
                                            opacity: 0.5,
                                        },
                                        '& .MuiSvgIcon-root': {
                                            fontSize: '1.125rem',
                                            mr: 0.75,
                                        },
                                    },
                                    '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
                                        ml: 1,
                                        borderLeft: '1.5px solid',
                                    },
                                }}
                            >
                                <ToggleButton value="event">
                                    <EventIcon />
                                    {t('reminders:scope.eventOnly')}
                                </ToggleButton>
                                <ToggleButton value="series">
                                    <EventRepeatIcon />
                                    {t('reminders:scope.allSeries', { label: seriesLabel || t('reminders:scope.matchingEvents') })}
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                    )}

                    {/* Permission Notice */}
                    {permissionNotice && (
                        <Alert severity="info" sx={{ borderRadius: 1.5, py: 0.75 }}>
                            <Typography variant="caption">{permissionNotice}</Typography>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                            size="small"
                            startIcon={<CloseIcon />}
                            onClick={handleCancel}
                            disabled={disabled || isSaving}
                            sx={{ borderRadius: 999 }}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={isSaving ? <CircularProgress size={14} sx={{ color: 'inherit' }} /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={disabled || isSaving}
                            sx={{ borderRadius: 999 }}
                        >
                            {isSaving ? t('reminders:actions.saving') : t('common:actions.save')}
                        </Button>
                        {isSaved && (
                            <IconButton
                                size="small"
                                onClick={() => onDelete(index)}
                                disabled={disabled || isSaving}
                                title={t('reminders:actions.delete')}
                                sx={{
                                    color: 'error.main',
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                                }}
                            >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

ReminderCard.propTypes = {
    reminder: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    isEditing: PropTypes.bool.isRequired,
    isSaved: PropTypes.bool.isRequired,
    isSaving: PropTypes.bool,
    scope: PropTypes.string.isRequired,
    seriesKey: PropTypes.string,
    seriesLabel: PropTypes.string,
    disabled: PropTypes.bool,
    onEdit: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onRequestBrowserPermission: PropTypes.func,
    onRequestPushPermission: PropTypes.func,
};

/**
 * Main RemindersEditor2 Component
 */
export default function RemindersEditor2({
    reminders,
    savedCount = 0,
    reminderScopes = [],
    seriesKey,
    seriesLabel,
    recurrence,
    disabled,
    onSaveReminder,
    onDeleteReminder,
    onRequestBrowserPermission,
    onRequestPushPermission,
    onUnsavedChanges,
}) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const effectiveReminders = useMemo(
        () => (Array.isArray(reminders) ? reminders : []),
        [reminders]
    );

    const hasReminder = effectiveReminders.length > 0;
    const reminder = effectiveReminders[0] || DEFAULT_REMINDER;
    const scope = reminderScopes[0] || 'event';

    const warnings = useMemo(
        () => getReminderPolicyWarnings({ reminders: effectiveReminders, recurrence }),
        [effectiveReminders, recurrence]
    );

    // Track unsaved changes state (exclude saving state from unsaved check)
    const hasUnsavedChanges = isEditing && !isSaving;

    // Notify parent of unsaved changes
    useEffect(() => {
        if (onUnsavedChanges) {
            onUnsavedChanges(hasUnsavedChanges);
        }
    }, [hasUnsavedChanges, onUnsavedChanges]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async (reminderData, scopeValue) => {
        setIsSaving(true);
        try {
            await onSaveReminder(0, reminderData, scopeValue);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await onDeleteReminder(0);
        setIsEditing(false);
    };

    return (
        <Stack spacing={2}>
            {/* Single Reminder Card or Add Button */}
            {hasReminder ? (
                <ReminderCard
                    reminder={reminder}
                    index={0}
                    isEditing={isEditing}
                    isSaved={savedCount > 0}
                    isSaving={isSaving}
                    scope={scope}
                    seriesKey={seriesKey}
                    seriesLabel={seriesLabel}
                    disabled={disabled}
                    onEdit={handleEdit}
                    onSave={(_, reminderData, scopeValue) => handleSave(reminderData, scopeValue)}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onRequestBrowserPermission={onRequestBrowserPermission}
                    onRequestPushPermission={onRequestPushPermission}
                />
            ) : (
                <Button
                    size="medium"
                    startIcon={<AddIcon />}
                    onClick={handleEdit}
                    disabled={disabled}
                    sx={{
                        alignSelf: 'flex-start',
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    {t('reminders:actions.addReminder')}
                </Button>
            )}

            {/* Empty State */}
            {!hasReminder && !isEditing && (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                    {t('reminders:empty.noReminders')}
                </Typography>
            )}

            {/* New Reminder Card (when adding first reminder) */}
            {!hasReminder && isEditing && (
                <ReminderCard
                    reminder={DEFAULT_REMINDER}
                    index={0}
                    isEditing={true}
                    isSaved={false}
                    isSaving={isSaving}
                    scope="event"
                    seriesKey={seriesKey}
                    seriesLabel={seriesLabel}
                    disabled={disabled}
                    onEdit={() => { }}
                    onSave={(_, reminderData, scopeValue) => handleSave(reminderData, scopeValue)}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onRequestBrowserPermission={onRequestBrowserPermission}
                    onRequestPushPermission={onRequestPushPermission}
                />
            )}

            {/* Policy Warnings */}
            {warnings.length > 0 && (
                <Stack spacing={1}>
                    {warnings.map((warning, idx) => (
                        <Alert key={idx} severity="warning" sx={{ borderRadius: 2 }}>
                            {warning}
                        </Alert>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

RemindersEditor2.propTypes = {
    reminders: PropTypes.arrayOf(PropTypes.object),
    savedCount: PropTypes.number,
    reminderScopes: PropTypes.arrayOf(PropTypes.string),
    seriesKey: PropTypes.string,
    seriesLabel: PropTypes.string,
    recurrence: PropTypes.object,
    timezone: PropTypes.string,
    disabled: PropTypes.bool,
    onSaveReminder: PropTypes.func.isRequired,
    onDeleteReminder: PropTypes.func.isRequired,
    onRequestBrowserPermission: PropTypes.func,
    onRequestPushPermission: PropTypes.func,
    onUnsavedChanges: PropTypes.func,
};

RemindersEditor2.defaultProps = {
    reminders: [],
    savedCount: 0,
    reminderScopes: [],
    seriesKey: null,
    seriesLabel: null,
    recurrence: null,
    timezone: 'UTC',
    disabled: false,
};
