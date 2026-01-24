/**
 * src/components/CustomEventDialog.jsx
 * 
 * Purpose: Refactored modal dialog for creating/editing custom events with modern popover-based pickers.
 * Key responsibility: Optimized viewport usage with two-column desktop layout, popover icon/color selectors,
 * and smooth transitions while maintaining all v1 features (reminders, recurrence, timezone, impact).
 * 
 * Changelog:
 * v2.1.0 - 2026-01-29 - BEP i18n migration: Added useTranslation hook, replaced 50+ hardcoded strings with t() calls for events namespace
 * v2.0.0 - 2026-01-23 - BEP refactor: Popover-based icon/color pickers, two-column desktop layout, smooth transitions, optimized viewport usage. All v1 features preserved.
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Popover,
    Snackbar,
    Stack,
    TextField,
    Typography,
    Grow,
    useTheme,
} from '@mui/material';
import { darken } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { CUSTOM_EVENT_ICON_OPTIONS, DEFAULT_CUSTOM_EVENT_COLOR, DEFAULT_CUSTOM_EVENT_ICON } from '../utils/customEventStyle';
import { isColorDark } from '../utils/clockUtils';
import { IMPACT_LEVELS } from '../utils/newsApi';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import RemindersEditor2 from './RemindersEditor2';
import SwitchComponent from './Switch';
import UnsavedChangesModal from './UnsavedChangesModal';
import { auth } from '../firebase';
import { requestFcmTokenForUser } from '../services/pushNotificationsService';

const buildTimezoneOptions = () => {
    const supported = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const list = supported.length ? supported : [fallback];
    return list.map((tz) => ({
        id: tz,
        label: tz.replace(/_/g, ' '),
        value: tz,
    }));
};

const formatLocalDate = (epochMs, timezone) => {
    if (!epochMs) return '';
    try {
        const date = new Date(epochMs);
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch {
        return '';
    }
};

const formatLocalTime = (epochMs, timezone) => {
    if (!epochMs) return '';
    try {
        const date = new Date(epochMs);
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    } catch {
        return '';
    }
};

const RECURRENCE_OPTIONS = [
    { value: 'none', labelKey: 'events:dialog.schedule.recurrence.options.none' },
    { value: '1h', labelKey: 'events:dialog.schedule.recurrence.options.hour1' },
    { value: '4h', labelKey: 'events:dialog.schedule.recurrence.options.hour4' },
    { value: '1D', labelKey: 'events:dialog.schedule.recurrence.options.day1' },
    { value: '1W', labelKey: 'events:dialog.schedule.recurrence.options.week1' },
    { value: '1M', labelKey: 'events:dialog.schedule.recurrence.options.month1' },
    { value: '1Q', labelKey: 'events:dialog.schedule.recurrence.options.quarter1' },
    { value: '1Y', labelKey: 'events:dialog.schedule.recurrence.options.year1' },
];

const RECURRENCE_END_OPTIONS = [
    { value: 'never', labelKey: 'events:dialog.schedule.recurrenceEnd.options.never' },
    { value: 'onDate', labelKey: 'events:dialog.schedule.recurrenceEnd.options.onDate' },
    { value: 'after', labelKey: 'events:dialog.schedule.recurrenceEnd.options.after' },
];

const getDefaultRecurrence = (timezone) => ({
    enabled: false,
    interval: 'none',
    ends: {
        type: 'never',
        untilLocalDate: formatLocalDate(Date.now(), timezone),
        count: 10,
    },
});

const getDefaultForm = (timezone, customColor, customIcon) => ({
    title: '',
    description: '',
    localDate: formatLocalDate(Date.now(), timezone),
    localTime: formatLocalTime(Date.now() + 15 * 60 * 1000, timezone),
    timezone,
    customColor: customColor || DEFAULT_CUSTOM_EVENT_COLOR,
    customIcon: customIcon || DEFAULT_CUSTOM_EVENT_ICON,
    impact: 'non-economic',
    showOnClock: true,
    recurrence: getDefaultRecurrence(timezone),
    reminders: [],
});

export default function CustomEventDialog({
    open,
    onClose,
    onSave,
    onDelete,
    event,
    defaultTimezone,
    onRequestBrowserPermission,
    zIndexOverride,
}) {
    const { t } = useTranslation(['events', 'common']);
    const theme = useTheme();
    const timezoneOptions = useMemo(buildTimezoneOptions, []);
    const [form, setForm] = useState(() => getDefaultForm(defaultTimezone, theme.palette.primary.main, DEFAULT_CUSTOM_EVENT_ICON));
    const [savedChanges, setSavedChanges] = useState(false);
    const [initialForm, setInitialForm] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

    // Popover anchors
    const [colorAnchor, setColorAnchor] = useState(null);
    const [iconAnchor, setIconAnchor] = useState(null);
    const [hexInput, setHexInput] = useState('');

    const selectedIconTextColor = useMemo(
        () => (isColorDark(form.customColor) ? theme.palette.common.white : theme.palette.text.primary),
        [form.customColor, theme]
    );

    const colorPresets = useMemo(() => ([
        theme.palette.primary.main,
        '#018786',
        '#4E7DFF',
        '#FFA85C',
        '#FFD54F',
        '#FF6F91',
        '#8B6CFF',
        '#E53935',
        '#9E9E9E',
        '#212121',
    ]), [theme]);

    const selectedIconData = useMemo(
        () => CUSTOM_EVENT_ICON_OPTIONS.find((opt) => opt.value === form.customIcon) || CUSTOM_EVENT_ICON_OPTIONS[0],
        [form.customIcon]
    );

    useEffect(() => {
        if (!open) return;
        setSavedChanges(false);
        setHasUnsavedChanges(false);
        if (event) {
            const timezone = event.timezone || defaultTimezone;
            const epochMs = event.epochMs || event.date;
            const sanitizedReminders = (Array.isArray(event.reminders) && event.reminders.length
                ? event.reminders
                : [{ minutesBefore: 10, channels: { inApp: true, browser: false, push: false } }]
            ).map((reminder) => ({
                ...reminder,
                channels: {
                    ...(reminder.channels || {}),
                    email: false,
                },
            }));
            const recurrence = event.recurrence?.enabled
                ? {
                    enabled: true,
                    interval: event.recurrence?.interval || '1D',
                    ends: {
                        type: event.recurrence?.ends?.type || 'never',
                        untilLocalDate: event.recurrence?.ends?.untilLocalDate || formatLocalDate(Date.now(), timezone),
                        count: event.recurrence?.ends?.count || 10,
                    },
                }
                : getDefaultRecurrence(timezone);

            setForm({
                title: event.title || event.name || '',
                description: event.description || '',
                localDate: event.localDate || formatLocalDate(epochMs, timezone),
                localTime: event.localTime || formatLocalTime(epochMs, timezone),
                timezone,
                customColor: event.customColor || theme.palette.primary.main,
                customIcon: event.customIcon || DEFAULT_CUSTOM_EVENT_ICON,
                impact: event.impact || 'non-economic',
                showOnClock: event.showOnClock !== false,
                recurrence,
                reminders: sanitizedReminders,
            });
            setInitialForm({
                title: event.title || event.name || '',
                description: event.description || '',
                localDate: event.localDate || formatLocalDate(epochMs, timezone),
                localTime: event.localTime || formatLocalTime(epochMs, timezone),
                timezone,
                customColor: event.customColor || theme.palette.primary.main,
                customIcon: event.customIcon || DEFAULT_CUSTOM_EVENT_ICON,
                impact: event.impact || 'non-economic',
                showOnClock: event.showOnClock !== false,
                recurrence,
                reminders: sanitizedReminders,
            });
        } else {
            const defaultForm = getDefaultForm(defaultTimezone, theme.palette.primary.main, DEFAULT_CUSTOM_EVENT_ICON);
            setForm(defaultForm);
            setInitialForm(defaultForm);
        }
    }, [open, event, defaultTimezone, theme]);

    // Detect unsaved changes by comparing form with initialForm
    useEffect(() => {
        if (!initialForm || savedChanges) {
            setHasUnsavedChanges(false);
            return;
        }

        const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);
        setHasUnsavedChanges(hasChanges);
    }, [form, initialForm, savedChanges]);

    const resetSavedState = () => {
        if (savedChanges) setSavedChanges(false);
    };

    const handleClose = () => {
        if (hasUnsavedChanges && !savedChanges) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    };

    const handleConfirmClose = () => {
        setShowCloseConfirmation(false);
        setHasUnsavedChanges(false);
        onClose();
    };

    const handleCancelClose = () => {
        setShowCloseConfirmation(false);
    };

    const handleFieldChange = (field) => (e) => {
        const value = e.target.value;
        resetSavedState();
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleToggle = (field) => (e) => {
        resetSavedState();
        setForm((prev) => ({ ...prev, [field]: e.target.checked }));
    };

    const handleTimezoneChange = (e) => {
        resetSavedState();
        setForm((prev) => ({ ...prev, timezone: e.target.value }));
    };



    const handleColorSelect = (color) => {
        resetSavedState();
        setForm((prev) => ({ ...prev, customColor: color }));
        setHexInput(color.toUpperCase());
    };

    const handleHexInputChange = (e) => {
        let value = e.target.value.toUpperCase();
        if (!value.startsWith('#')) {
            value = '#' + value;
        }
        setHexInput(value);

        // Validate and apply hex color (supports 3 or 6 digit hex)
        const hexRegex = /^#([A-F0-9]{6}|[A-F0-9]{3})$/i;
        if (hexRegex.test(value)) {
            resetSavedState();
            setForm((prev) => ({ ...prev, customColor: value }));
        }
    };

    const handleColorClose = () => {
        setColorAnchor(null);
        setHexInput('');
    };

    const handleColorClick = (e) => {
        setColorAnchor(e.currentTarget);
        setHexInput(form.customColor.toUpperCase());
    };

    const handleIconClick = (e) => {
        setIconAnchor(e.currentTarget);
    };

    const handleIconClose = () => {
        setIconAnchor(null);
    };

    const handleIconSelect = (value) => {
        resetSavedState();
        setForm((prev) => ({ ...prev, customIcon: value }));
        handleIconClose();
    };

    const handleImpactChange = (e) => {
        resetSavedState();
        setForm((prev) => ({ ...prev, impact: e.target.value }));
    };

    const handleRecurrenceIntervalChange = (e) => {
        const value = e.target.value;
        resetSavedState();
        setForm((prev) => {
            if (value === 'none') {
                return { ...prev, recurrence: { ...prev.recurrence, enabled: false, interval: 'none' } };
            }
            return {
                ...prev,
                recurrence: {
                    ...prev.recurrence,
                    enabled: true,
                    interval: value,
                    ends: prev.recurrence?.ends || { type: 'never', untilLocalDate: prev.localDate, count: 10 },
                },
            };
        });
    };

    const handleRecurrenceEndTypeChange = (e) => {
        const value = e.target.value;
        if (!value) return;
        resetSavedState();
        setForm((prev) => ({
            ...prev,
            recurrence: {
                ...prev.recurrence,
                ends: {
                    ...prev.recurrence?.ends,
                    type: value,
                },
            },
        }));
    };

    const handleRecurrenceEndFieldChange = (field) => (e) => {
        const value = field === 'count' ? Number(e.target.value) : e.target.value;
        resetSavedState();
        setForm((prev) => ({
            ...prev,
            recurrence: {
                ...prev.recurrence,
                ends: {
                    ...prev.recurrence?.ends,
                    [field]: value,
                },
            },
        }));
    };

    const handleSaveReminder = async (index, reminderData) => {
        resetSavedState();
        setForm((prev) => {
            const updatedReminders = [...(prev.reminders || [])];
            if (index < updatedReminders.length) {
                updatedReminders[index] = reminderData;
            } else {
                updatedReminders.push(reminderData);
            }
            return { ...prev, reminders: updatedReminders };
        });
    };

    const handleDeleteReminder = async (index) => {
        resetSavedState();
        setForm((prev) => ({
            ...prev,
            reminders: (prev.reminders || []).filter((_, i) => i !== index),
        }));
    };

    const handleRequestPushPermission = async () => {
        const currentUser = auth?.currentUser;
        if (!currentUser?.uid) return 'auth-required';
        try {
            const result = await requestFcmTokenForUser(currentUser.uid);
            return result?.status || 'denied';
        } catch {
            return 'denied';
        }
    };

    const handleSubmit = () => {
        if (!form.title || !form.localDate || !form.localTime) return;
        const sanitizedReminders = form.reminders.map((reminder) => ({
            ...reminder,
            channels: {
                ...(reminder.channels || {}),
                email: false,
            },
        }));
        const recurrenceEnabled = Boolean(form.recurrence?.enabled) && form.recurrence?.interval !== 'none';
        const sanitizedRecurrence = recurrenceEnabled
            ? {
                enabled: true,
                interval: form.recurrence?.interval,
                ends: {
                    type: form.recurrence?.ends?.type || 'never',
                    untilLocalDate: form.recurrence?.ends?.untilLocalDate || form.localDate,
                    count: form.recurrence?.ends?.count || 10,
                },
            }
            : { enabled: false };

        const savedData = {
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
            reminders: sanitizedReminders,
            recurrence: sanitizedRecurrence,
        };

        onSave?.(savedData);

        // If editing, show success message and keep modal open
        // If creating new, modal will be closed by parent component
        if (isEditing) {
            setSavedChanges(true);
        }
    };

    const isEditing = Boolean(event?.id);
    const colorOpen = Boolean(colorAnchor);
    const iconOpen = Boolean(iconAnchor);

    const SelectedIcon = selectedIconData.Icon;

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                sx={{ zIndex: zIndexOverride || 2000 }}
                TransitionComponent={Grow}
                TransitionProps={{ timeout: 300 }}
                slotProps={{
                    backdrop: { sx: BACKDROP_OVERLAY_SX },
                }}
            >
                <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {isEditing ? 'Edit custom event' : 'New custom event'}
                    </Typography>
                    <IconButton onClick={handleClose} aria-label="Close" size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Divider />

                <DialogContent sx={{ pt: 2, pb: 1 }}>
                    <Grid container spacing={3}>
                        {/* Left Column - Details & Schedule */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={2.5}>
                                {/* Details Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                        {t('events:dialog.details.section')}
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <TextField
                                            label={t('events:dialog.details.fields.title.label')}
                                            value={form.title}
                                            onChange={handleFieldChange('title')}
                                            fullWidth
                                            required
                                            autoFocus
                                        />
                                        <TextField
                                            label={t('events:dialog.details.fields.description.label')}
                                            value={form.description}
                                            onChange={handleFieldChange('description')}
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            maxRows={4}
                                        />
                                        <TextField
                                            select
                                            label={t('events:dialog.details.fields.impact.label')}
                                            value={form.impact}
                                            onChange={handleImpactChange}
                                            fullWidth
                                            SelectProps={{
                                                MenuProps: {
                                                    sx: { zIndex: 12010 },
                                                    slotProps: {
                                                        root: { sx: { zIndex: 12010 } },
                                                        paper: { sx: { zIndex: 12010 } },
                                                    },
                                                },
                                            }}
                                        >
                                            {IMPACT_LEVELS.filter((level) => level.key !== 'unknown' && level.key !== 'not-loaded').map((level) => (
                                                <MenuItem key={level.key} value={level.key}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box component="span" sx={{ fontWeight: 800, fontFamily: 'monospace', color: level.color }}>
                                                            {level.icon}
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {level.label}
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>
                                </Box>

                                <Divider />

                                {/* Schedule Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                        {t('events:dialog.schedule.section')}
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={1.5}>
                                            <TextField
                                                label={t('events:dialog.schedule.fields.date.label')}
                                                type="date"
                                                value={form.localDate}
                                                onChange={handleFieldChange('localDate')}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                            <TextField
                                                label={t('events:dialog.schedule.fields.time.label')}
                                                type="time"
                                                value={form.localTime}
                                                onChange={handleFieldChange('localTime')}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                            />
                                        </Stack>
                                        {/* Repeat */}
                                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                                            <TextField
                                                select
                                                label={t('events:dialog.schedule.fields.repeat.label')}
                                                value={form.recurrence?.enabled ? form.recurrence?.interval : 'none'}
                                                onChange={handleRecurrenceIntervalChange}
                                                fullWidth
                                                SelectProps={{
                                                    MenuProps: {
                                                        sx: { zIndex: 12010 },
                                                        slotProps: {
                                                            root: { sx: { zIndex: 12010 } },
                                                            paper: { sx: { zIndex: 12010 } },
                                                        },
                                                    },
                                                }}
                                            >
                                                {RECURRENCE_OPTIONS.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {t(option.labelKey)}
                                                    </MenuItem>
                                                ))}
                                            </TextField>

                                            <Grow in={form.recurrence?.enabled} unmountOnExit>
                                                <Stack spacing={1.5}>
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                                        <TextField
                                                            select
                                                            label={t('events:dialog.schedule.fields.recurrenceEnd.label')}
                                                            value={form.recurrence?.ends?.type || 'never'}
                                                            onChange={handleRecurrenceEndTypeChange}
                                                            fullWidth
                                                            sx={{ flex: 1 }}
                                                            SelectProps={{
                                                                MenuProps: {
                                                                    sx: { zIndex: 12010 },
                                                                    slotProps: {
                                                                        root: { sx: { zIndex: 12010 } },
                                                                        paper: { sx: { zIndex: 12010 } },
                                                                    },
                                                                },
                                                            }}
                                                        >
                                                            {RECURRENCE_END_OPTIONS.map((option) => (
                                                                <MenuItem key={option.value} value={option.value}>
                                                                    {t(option.labelKey)}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>

                                                        <Grow in={form.recurrence?.ends?.type === 'onDate'} unmountOnExit>
                                                            <TextField
                                                                label={t('events:dialog.schedule.fields.endDate.label')}
                                                                type="date"
                                                                value={form.recurrence?.ends?.untilLocalDate || ''}
                                                                onChange={handleRecurrenceEndFieldChange('untilLocalDate')}
                                                                InputLabelProps={{ shrink: true }}
                                                                fullWidth
                                                                sx={{ flex: 1 }}
                                                            />
                                                        </Grow>
                                                        <Grow in={form.recurrence?.ends?.type === 'after'} unmountOnExit>
                                                            <TextField
                                                                label={t('events:dialog.schedule.fields.occurrences.label')}
                                                                type="number"
                                                                value={form.recurrence?.ends?.count || 1}
                                                                onChange={handleRecurrenceEndFieldChange('count')}
                                                                inputProps={{ min: 1 }}
                                                                fullWidth
                                                                sx={{ flex: 1 }}
                                                            />
                                                        </Grow>
                                                    </Stack>
                                                </Stack>
                                            </Grow>
                                        </Stack>
                                        <TextField
                                            select
                                            label={t('events:dialog.schedule.fields.timezone.label')}
                                            value={form.timezone}
                                            onChange={handleTimezoneChange}
                                            fullWidth
                                            SelectProps={{ native: true }}
                                        >
                                            {timezoneOptions.map((option) => (
                                                <option key={option.id} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </TextField>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Right Column - Appearance & Reminders */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={2.5}>
                                {/* Appearance Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                        {t('events:dialog.appearance.section')}
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        {/* Color Picker Button */}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.75, display: 'block' }}>
                                                {t('events:dialog.appearance.fields.color.label')}
                                            </Typography>
                                            <Button
                                                onClick={handleColorClick}
                                                variant="outlined"
                                                endIcon={<KeyboardArrowDownRoundedIcon />}
                                                fullWidth
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    py: 1,
                                                    textTransform: 'none',
                                                    borderColor: 'divider',
                                                    color: 'text.primary',
                                                    '&:hover': {
                                                        borderColor: 'text.primary',
                                                        bgcolor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: 999,
                                                            bgcolor: form.customColor,
                                                            border: '2px solid',
                                                            borderColor: 'divider',
                                                        }}
                                                    />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {form.customColor.toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </Box>

                                        {/* Icon Picker Button */}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.75, display: 'block' }}>
                                                {t('events:dialog.appearance.fields.icon.label')}
                                            </Typography>
                                            <Button
                                                onClick={handleIconClick}
                                                variant="outlined"
                                                endIcon={<KeyboardArrowDownRoundedIcon />}
                                                fullWidth
                                                sx={{
                                                    justifyContent: 'space-between',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    py: 1,
                                                    textTransform: 'none',
                                                    borderColor: 'divider',
                                                    color: 'text.primary',
                                                    '&:hover': {
                                                        borderColor: 'text.primary',
                                                        bgcolor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 999,
                                                            bgcolor: form.customColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: selectedIconTextColor,
                                                        }}
                                                    >
                                                        <SelectedIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedIconData.label}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </Box>
                                    </Stack>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {t('events:dialog.appearance.fields.showOnClock.label')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('events:dialog.appearance.fields.showOnClock.description')}
                                            </Typography>
                                        </Box>
                                        <SwitchComponent
                                            checked={form.showOnClock}
                                            onChange={handleToggle('showOnClock')}
                                        />
                                    </Box>
                                </Box>

                                <Divider />

                                {/* Reminders Section */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                                        {t('events:dialog.reminders.section')}
                                    </Typography>
                                    <RemindersEditor2
                                        reminders={form.reminders}
                                        savedCount={form.reminders?.length || 0}
                                        reminderScopes={(form.reminders || []).map(() => 'event')}
                                        seriesKey={form.recurrence?.enabled && event?.seriesId ? `custom-series:${event.seriesId}` : null}
                                        seriesLabel={form.recurrence?.enabled ? form.title : null}
                                        recurrence={form.recurrence}
                                        timezone={form.timezone}
                                        disabled={false}
                                        onSaveReminder={handleSaveReminder}
                                        onDeleteReminder={handleDeleteReminder}
                                        onRequestBrowserPermission={onRequestBrowserPermission}
                                        onRequestPushPermission={handleRequestPushPermission}
                                    />
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>

                <Divider />
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
                    {isEditing && (
                        <Button
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => onDelete?.(event)}
                            sx={{ borderRadius: 999 }}
                        >
                            {t('events:dialog.actions.delete')}
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button
                        onClick={handleClose}
                        color="inherit"
                        sx={{ borderRadius: 999 }}
                    >
                        {t('events:dialog.actions.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!form.title || !form.localDate || !form.localTime || (isEditing && savedChanges)}
                        sx={{ borderRadius: 999, px: 3 }}
                    >
                        {isEditing ? (savedChanges ? t('events:dialog.actions.saveChanges.success') : t('events:dialog.actions.saveChanges.action')) : t('events:dialog.actions.addCustomEvent')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Message Snackbar */}
            <Snackbar
                open={savedChanges}
                autoHideDuration={4000}
                onClose={() => setSavedChanges(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ zIndex: (zIndexOverride || 2000) + 20 }}
            >
                <Alert
                    onClose={() => setSavedChanges(false)}
                    severity="success"
                    variant="filled"
                    sx={{ borderRadius: 2, boxShadow: theme.shadows[8] }}
                >
                    Changes saved successfully
                </Alert>
            </Snackbar>

            {/* Color Picker Popover */}
            <Popover
                open={colorOpen}
                anchorEl={colorAnchor}
                onClose={handleColorClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                TransitionComponent={Grow}
                TransitionProps={{ timeout: 250 }}
                sx={{ zIndex: (zIndexOverride || 2000) + 10 }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 2,
                            borderRadius: 2,
                            mt: 0.5,
                            boxShadow: theme.shadows[8],
                        },
                    },
                }}
            >
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Select Color
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 1.25,
                            maxWidth: 240,
                            mb: 2,
                        }}
                    >
                        {colorPresets.map((color) => (
                            <IconButton
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 999,
                                    bgcolor: color,
                                    border: form.customColor === color ? '3px solid' : '2px solid',
                                    borderColor: form.customColor === color ? theme.palette.text.primary : 'transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        bgcolor: color,
                                        transform: 'scale(1.1)',
                                        boxShadow: theme.shadows[4],
                                    },
                                }}
                                aria-label={`Select color ${color}`}
                            >
                                {form.customColor === color && (
                                    <CheckRoundedIcon
                                        sx={{
                                            fontSize: 20,
                                            color: color === '#FFFFFF' ? theme.palette.text.primary : theme.palette.common.white,
                                        }}
                                    />
                                )}
                            </IconButton>
                        ))}
                    </Box>
                    <TextField
                        label="Hex Color"
                        value={hexInput}
                        onChange={handleHexInputChange}
                        fullWidth
                        placeholder="#4E7DFF"
                        InputProps={{
                            startAdornment: (
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 1,
                                        bgcolor: form.customColor,
                                        border: '2px solid',
                                        borderColor: 'divider',
                                        mr: 1,
                                        flexShrink: 0,
                                    }}
                                />
                            ),
                        }}
                        sx={{
                            '& .MuiInputBase-input': {
                                textTransform: 'uppercase',
                                fontFamily: 'monospace',
                                letterSpacing: 0.5,
                            },
                        }}
                    />
                </Box>
            </Popover>

            {/* Icon Picker Popover */}
            <Popover
                open={iconOpen}
                anchorEl={iconAnchor}
                onClose={handleIconClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                TransitionComponent={Grow}
                TransitionProps={{ timeout: 250 }}
                sx={{ zIndex: (zIndexOverride || 2000) + 10 }}
                slotProps={{
                    paper: {
                        sx: {
                            p: 2,
                            borderRadius: 2,
                            mt: 0.5,
                            boxShadow: theme.shadows[8],
                        },
                    },
                }}
            >
                <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Select Icon
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: 1,
                            maxWidth: 280,
                        }}
                    >
                        {CUSTOM_EVENT_ICON_OPTIONS.map(({ value, label, Icon }) => {
                            const isSelected = form.customIcon === value;
                            return (
                                <IconButton
                                    key={value}
                                    onClick={() => handleIconSelect(value)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 999,
                                        bgcolor: isSelected ? form.customColor : 'transparent',
                                        color: isSelected ? selectedIconTextColor : 'text.secondary',
                                        border: '2px solid',
                                        borderColor: isSelected ? darken(form.customColor, 0.2) : 'divider',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            bgcolor: isSelected ? form.customColor : 'action.hover',
                                            transform: 'scale(1.1)',
                                            borderColor: isSelected ? darken(form.customColor, 0.2) : 'text.secondary',
                                        },
                                    }}
                                    aria-label={label}
                                >
                                    <Icon sx={{ fontSize: 18 }} />
                                </IconButton>
                            );
                        })}
                    </Box>
                </Box>
            </Popover>

            {/* Unsaved Changes Confirmation */}
            <UnsavedChangesModal
                open={showCloseConfirmation}
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
                message="You have unsaved changes to this custom event. If you close now, your changes will be lost."
                zIndex={(zIndexOverride || 2000) + 2}
            />
        </>
    );
}

CustomEventDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    event: PropTypes.shape({
        id: PropTypes.string,
        seriesId: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        description: PropTypes.string,
        timezone: PropTypes.string,
        localDate: PropTypes.string,
        localTime: PropTypes.string,
        epochMs: PropTypes.number,
        date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        reminders: PropTypes.arrayOf(PropTypes.object),
        showOnClock: PropTypes.bool,
        customColor: PropTypes.string,
        customIcon: PropTypes.string,
        impact: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        recurrence: PropTypes.shape({
            enabled: PropTypes.bool,
            interval: PropTypes.string,
            ends: PropTypes.shape({
                type: PropTypes.string,
                untilLocalDate: PropTypes.string,
                count: PropTypes.number,
            }),
        }),
    }),
    defaultTimezone: PropTypes.string.isRequired,
    onRequestBrowserPermission: PropTypes.func,
    zIndexOverride: PropTypes.number,
};
