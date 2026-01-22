/**
 * src/components/CustomEventDialog.jsx
 * 
 * Purpose: Modal dialog for creating and editing custom reminder events.
 * Key responsibility and main functionality: Collect timezone-aware date/time, reminders, and visibility
 * settings while supporting BEP-ready notification channel options.
 * 
 * Changelog:
 * v1.2.3 - 2026-01-22 - BEP: Add zIndexOverride prop to support opening at z-index 12003 when editing from EventModal (default remains 2000). Ensures CustomEventDialog appears above EventModal (z-index 12001) in view/edit flow. Added propTypes validation.
 * v1.2.2 - 2026-01-22 - BEP: Update button borderRadius from 1.5 to 999 (pill shape) to match filter chips styling.
 * v1.2.1 - 2026-01-22 - Remove unused Tooltip import and add missing propTypes for customColor, customIcon, and impact.
 * v1.2.0 - 2026-01-22 - BEP: Add borderRadius: 1.5 to CTA buttons for rounded corners matching filter chips and appbar nav items.
 * v1.1.9 - 2026-01-22 - Remove email channel and re-enable push reminders.
 * v1.1.7 - 2026-01-22 - Shrink custom icon picker to match color selector sizing.
 * v1.1.6 - 2026-01-22 - Force impact menu z-index above custom reminder dialog.
 * v1.1.5 - 2026-01-21 - Raise impact menu above notes dialog overlay.
 * v1.1.4 - 2026-01-21 - Add impact selector for custom reminders and update palette.
 * v1.1.3 - 2026-01-21 - Add selected styling and checkmark for icon/color pickers.
 * v1.1.2 - 2026-01-21 - Enlarge icon picker buttons for trading workflows.
 * v1.1.1 - 2026-01-21 - Simplify appearance pickers to icon-only + brand-aligned colors.
 * v1.1.0 - 2026-01-21 - Add icon and color pickers for custom reminders.
 * v1.0.3 - 2026-01-21 - Fix browser notification checkbox gating with permission feedback.
 * v1.0.2 - 2026-01-21 - Raise dialog z-index above AppBar overlays.
 * v1.0.1 - 2026-01-21 - Fix DialogTitle heading nesting to avoid hydration warnings.
 * v1.0.0 - 2026-01-21 - Initial implementation for custom reminder event creation/editing.
 */

import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme,
} from '@mui/material';
import { darken } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { CUSTOM_EVENT_ICON_OPTIONS, DEFAULT_CUSTOM_EVENT_COLOR, DEFAULT_CUSTOM_EVENT_ICON } from '../utils/customEventStyle';
import { isColorDark } from '../utils/clockUtils';
import { IMPACT_LEVELS } from '../utils/newsApi';

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
    reminders: [{ minutesBefore: 10, channels: { inApp: true, browser: false, email: false, push: false } }],
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
    const theme = useTheme();
    const timezoneOptions = useMemo(buildTimezoneOptions, []);
    const [form, setForm] = useState(() => getDefaultForm(defaultTimezone, theme.palette.primary.main, DEFAULT_CUSTOM_EVENT_ICON));
    const [permissionNotice, setPermissionNotice] = useState('');
    const selectedIconTextColor = useMemo(
        () => (isColorDark(form.customColor) ? theme.palette.common.white : theme.palette.text.primary),
        [form.customColor, theme]
    );

    const colorPresets = useMemo(() => ([
        '#018786',
        '#4E7DFF',
        '#FFA85C',
        '#FFD54F',
        '#FF6F91',
        '#8B6CFF',
        '#E53935',
        '#9E9E9E',
        '#212121',
    ]), []);

    useEffect(() => {
        if (!open) return;
        setPermissionNotice('');
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
                reminders: sanitizedReminders,
            });
        } else {
            setForm(getDefaultForm(defaultTimezone, theme.palette.primary.main, DEFAULT_CUSTOM_EVENT_ICON));
        }
    }, [open, event, defaultTimezone, theme]);

    const handleFieldChange = (field) => (e) => {
        const value = e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleToggle = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.checked }));
    };

    const handleTimezoneChange = (e) => {
        setForm((prev) => ({ ...prev, timezone: e.target.value }));
    };

    const handleIconChange = (_event, value) => {
        if (!value) return;
        setForm((prev) => ({ ...prev, customIcon: value }));
    };

    const handleColorChange = (value) => {
        setForm((prev) => ({ ...prev, customColor: value }));
    };

    const handleImpactChange = (e) => {
        setForm((prev) => ({ ...prev, impact: e.target.value }));
    };

    const handleReminderChange = (index, key, value) => {
        setForm((prev) => {
            const next = [...prev.reminders];
            next[index] = { ...next[index], [key]: value };
            return { ...prev, reminders: next };
        });
    };

    const handleReminderChannelToggle = (index, channel) => async (e) => {
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
                            ? 'Browser notifications are blocked. Enable them in your browser settings to use this channel.'
                            : result === 'unsupported'
                                ? 'Browser notifications are not supported in this environment.'
                                : 'Please allow browser notifications to enable this channel.'
                    );
                }
            } catch {
                allowChecked = false;
                setPermissionNotice('Unable to request browser notification permission. Please try again.');
            }
        }

        setForm((prev) => {
            const next = [...prev.reminders];
            const channels = { ...(next[index]?.channels || {}) };
            channels[channel] = allowChecked;
            next[index] = { ...next[index], channels };
            return { ...prev, reminders: next };
        });
    };

    const handleAddReminder = () => {
        setForm((prev) => ({
            ...prev,
            reminders: [...prev.reminders, { minutesBefore: 5, channels: { inApp: true, browser: false, email: false, push: false } }],
        }));
    };

    const handleRemoveReminder = (index) => () => {
        setForm((prev) => ({
            ...prev,
            reminders: prev.reminders.filter((_, idx) => idx !== index),
        }));
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
        onSave?.({
            ...form,
            title: form.title.trim(),
            description: form.description.trim(),
            reminders: sanitizedReminders,
        });
    };

    const isEditing = Boolean(event?.id);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth sx={{ zIndex: zIndexOverride || 2000 }}>
            <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {isEditing ? 'Edit reminder' : 'New reminder'}
                </Typography>
                <IconButton onClick={onClose} aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2.25}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Details</Typography>
                        <Stack spacing={1.5}>
                            <TextField
                                label="Reminder title"
                                value={form.title}
                                onChange={handleFieldChange('title')}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Notes (optional)"
                                value={form.description}
                                onChange={handleFieldChange('description')}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                            <TextField
                                select
                                label="Impact"
                                value={form.impact}
                                onChange={handleImpactChange}
                                fullWidth
                                sx={{ maxWidth: { xs: '100%', sm: 260 } }}
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

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Schedule</Typography>
                        <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }}>
                            <TextField
                                label="Date"
                                type="date"
                                value={form.localDate}
                                onChange={handleFieldChange('localDate')}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                            <TextField
                                label="Time"
                                type="time"
                                value={form.localTime}
                                onChange={handleFieldChange('localTime')}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Stack>
                        <TextField
                            select
                            label="Timezone"
                            value={form.timezone}
                            onChange={handleTimezoneChange}
                            fullWidth
                            sx={{ mt: 1.5 }}
                            SelectProps={{ native: true }}
                        >
                            {timezoneOptions.map((option) => (
                                <option key={option.id} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </TextField>
                        <FormControlLabel
                            control={<Checkbox checked={form.showOnClock} onChange={handleToggle('showOnClock')} />}
                            label="Show on clock"
                            sx={{ mt: 0.5 }}
                        />
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Appearance</Typography>
                        <Stack spacing={1.5}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    Color
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mt: 0.75 }}>
                                    {colorPresets.map((color) => (
                                        <IconButton
                                            key={color}
                                            onClick={() => handleColorChange(color)}
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 999,
                                                bgcolor: color,
                                                border: form.customColor === color ? '2px solid' : '1px solid',
                                                borderColor: form.customColor === color ? 'text.primary' : 'divider',
                                                '&:hover': { bgcolor: color, opacity: 0.85 },
                                            }}
                                            aria-label="Select color"
                                        >
                                            {form.customColor === color ? (
                                                <CheckRoundedIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: color === '#FFFFFF' ? 'text.primary' : theme.palette.common.white,
                                                    }}
                                                />
                                            ) : null}
                                        </IconButton>
                                    ))}
                                </Stack>
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    Icon
                                </Typography>
                                <Box sx={{ mt: 0.75 }}>
                                    <ToggleButtonGroup
                                        value={form.customIcon}
                                        exclusive
                                        onChange={handleIconChange}
                                        size="small"
                                        sx={{
                                            flexWrap: 'wrap',
                                            gap: 1,
                                            '& .MuiToggleButtonGroup-grouped': {
                                                borderRadius: '999px !important',
                                                minWidth: 34,
                                                width: 34,
                                                height: 34,
                                                p: 0,
                                                m: 0,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            },
                                            '& .MuiToggleButtonGroup-grouped.Mui-selected': {
                                                borderColor: darken(form.customColor, 0.35),
                                                bgcolor: form.customColor,
                                                color: selectedIconTextColor,
                                            },
                                        }}
                                    >
                                        {CUSTOM_EVENT_ICON_OPTIONS.map(({ value, label, Icon }) => (
                                            <ToggleButton
                                                key={value}
                                                value={value}
                                                aria-label={label}
                                                sx={{
                                                    borderRadius: '999px',
                                                    '&.Mui-selected': {
                                                        bgcolor: form.customColor,
                                                        color: selectedIconTextColor,
                                                    },
                                                }}
                                            >
                                                <Icon sx={{ fontSize: 16 }} />
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Reminders</Typography>
                        <Stack spacing={1.25}>
                            {form.reminders.map((reminder, index) => (
                                <Box key={`reminder-${index}`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                                    <Stack spacing={1.25}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                label="Minutes before"
                                                type="number"
                                                value={reminder.minutesBefore}
                                                onChange={(e) => handleReminderChange(index, 'minutesBefore', Number(e.target.value))}
                                                inputProps={{ min: 0 }}
                                                sx={{ width: 140 }}
                                            />
                                            <Button
                                                size="small"
                                                color="inherit"
                                                startIcon={<DeleteOutlineIcon />}
                                                onClick={handleRemoveReminder(index)}
                                                disabled={form.reminders.length <= 1}
                                            >
                                                Remove
                                            </Button>
                                        </Stack>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                            <FormControlLabel
                                                control={<Checkbox checked={Boolean(reminder.channels?.inApp)} onChange={handleReminderChannelToggle(index, 'inApp')} />}
                                                label="In-app"
                                            />
                                            <FormControlLabel
                                                control={<Checkbox checked={Boolean(reminder.channels?.browser)} onChange={handleReminderChannelToggle(index, 'browser')} />}
                                                label="Browser"
                                            />
                                            <FormControlLabel
                                                control={<Checkbox checked={Boolean(reminder.channels?.push)} onChange={handleReminderChannelToggle(index, 'push')} />}
                                                label="Push"
                                            />
                                        </Stack>
                                        {permissionNotice ? (
                                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                                {permissionNotice}
                                            </Alert>
                                        ) : null}
                                    </Stack>
                                </Box>
                            ))}
                            <Button size="small" startIcon={<AddIcon />} onClick={handleAddReminder} sx={{ alignSelf: 'flex-start', borderRadius: 999 }}>
                                Add custom event
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
                {isEditing ? (
                    <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onDelete?.(event)}>
                        Delete
                    </Button>
                ) : null}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!form.title || !form.localDate || !form.localTime} sx={{ borderRadius: 999 }}>
                    {isEditing ? 'Save changes' : 'Add custom event'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CustomEventDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    event: PropTypes.shape({
        id: PropTypes.string,
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
    }),
    defaultTimezone: PropTypes.string.isRequired,
    onRequestBrowserPermission: PropTypes.func,
    zIndexOverride: PropTypes.number,
};
