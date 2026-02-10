/**
 * src/components/ClockEventsFilters.jsx
 *
 * Purpose: Unified event filter bar used on both /clock and /calendar pages.
 * Renders currencies, impacts, favorites, and optional date-preset controls.
 * STATELESS for all filters — reads directly from SettingsContext eventFilters,
 * writes via a single onChange callback. No local copies, no bidirectional sync,
 * no infinite-loop risk. All filter state including datePreset persists via
 * SettingsContext (localStorage + Firestore) for consistency across sessions.
 * BEP: Mobile-first, responsive, compact layout.
 *
 * Changelog:
 * v2.3.0 - 2026-02-09 - BEP DEFAULT PRESET: Changed default datePreset fallback from 'today'
 *                        to 'thisWeek' for consistency with useCalendarData and to provide broader
 *                        market context. When user hasn't persisted a date preference, calendar
 *                        defaults to 7-day view instead of 1-day view.
 * v2.2.0 - 2026-02-08 - BEP PERSISTENCE FIX: Moved datePreset from local state to
 *                        eventFilters in SettingsContext. Now reads datePreset from
 *                        eventFilters (SettingsContext) instead of useState, ensuring
 *                        consistency with currencies/impacts. DatePreset now persists
 *                        across navigation and page reloads via localStorage/Firestore.
 *                        handleDatePresetChange now sends datePreset in onChange payload.
 *                        All filter fields (currencies, impacts, favoritesOnly, datePreset)
 *                        now follow the same BEP persistence pattern.
 * v2.1.0 - 2026-02-07 - BEP LOADING STATE: Added disabled prop to disable all filter controls
 *                        (currencies, impacts, favorites, date presets) during event data loading.
 *                        ClockPage/Calendar2Page pass isLoadingEvents from ClockEventsOverlay
 *                        to prevent user filter changes during data refresh. All buttons/selects
 *                        show cursor:not-allowed + opacity:0.5. Clear button hidden when disabled.
 *                        Improves UX by preventing concurrent filter changes during load.
 * v2.0.0 - 2026-02-07 - CONSOLIDATION: Eliminated local filter state for currencies/impacts/
 *                        favoritesOnly. Component now reads directly from SettingsContext and
 *                        delegates changes via onChange callback. Added showDateFilter prop
 *                        with DATE_PRESETS + calculateDateRange for /calendar use. Shared by
 *                        both /clock (App.jsx) and /calendar (Calendar2Page). Removes all
 *                        bidirectional sync code — no isIncomingSyncRef, no incoming sync
 *                        effects, no feedback loops.
 * v1.0.1 - 2026-02-07 - BUGFIX: Fixed infinite update loop (isIncomingSyncRef).
 * v1.0.0 - 2026-02-07 - Initial implementation (extracted from Calendar2Page)
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ClearIcon from '@mui/icons-material/Clear';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { getEventCurrencies } from '../services/economicEventsService';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const DATE_PRESETS = [
    { key: 'today', labelKey: 'filter:datePresets.today' },
    { key: 'tomorrow', labelKey: 'filter:datePresets.tomorrow' },
    { key: 'thisWeek', labelKey: 'filter:datePresets.thisWeek' },
    { key: 'nextWeek', labelKey: 'filter:datePresets.nextWeek' },
    { key: 'thisMonth', labelKey: 'filter:datePresets.thisMonth' },
];

const IMPACT_OPTIONS = [
    { value: 'Strong Data', labelKey: 'filter:impacts.strongData' },
    { value: 'Moderate Data', labelKey: 'filter:impacts.moderateData' },
    { value: 'Weak Data', labelKey: 'filter:impacts.weakData' },
    { value: 'My Events', labelKey: 'filter:impacts.myEvents' },
    { value: 'Data Not Loaded', labelKey: 'filter:impacts.dataNotLoaded' },
    { value: 'Non-Economic', labelKey: 'filter:impacts.nonEconomic' },
];

const IMPACT_COLORS = {
    'Strong Data': '#d32f2f',
    'Moderate Data': '#f57c00',
    'Weak Data': '#F2C94C',
    'My Events': '#42a5f5',
    'Data Not Loaded': '#C7B8A4',
    'Non-Economic': '#9e9e9e',
};

// ============================================================================
// HELPERS
// ============================================================================

/** Convert a date-preset key + timezone into { startDate, endDate } UTC range */
const calculateDateRange = (preset, timezone) => {
    const { year, month, day, dayOfWeek } = getDatePartsInTimezone(timezone);
    const createDate = (y, m, d, endOfDay = false) => {
        if (endOfDay) {
            const nextDayStart = getUtcDateForTimezone(timezone, y, m, d + 1, { hour: 0, minute: 0, second: 0, millisecond: 0 });
            return new Date(nextDayStart.getTime() - 1000);
        }
        return getUtcDateForTimezone(timezone, y, m, d, { endOfDay: false });
    };
    switch (preset) {
        case 'today':
            return { startDate: createDate(year, month, day), endDate: createDate(year, month, day, true) };
        case 'tomorrow':
            return { startDate: createDate(year, month, day + 1), endDate: createDate(year, month, day + 1, true) };
        case 'thisWeek': {
            const s = day - dayOfWeek;
            return { startDate: createDate(year, month, s), endDate: createDate(year, month, s + 6, true) };
        }
        case 'nextWeek': {
            const e = day + (6 - dayOfWeek);
            const ns = e + 1;
            return { startDate: createDate(year, month, ns), endDate: createDate(year, month, ns + 6, true) };
        }
        case 'thisMonth': {
            const first = getUtcDateForTimezone(timezone, year, month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1);
            const lastDay = new Date(first.getTime() - 86400000).getDate();
            return { startDate: createDate(year, month, 1), endDate: createDate(year, month, lastDay, true) };
        }
        default:
            return null;
    }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Clearable Select wrapper with X button */
const ClearableSelect = ({ value, onChange, children, sx, label, disabled = false, ...props }) => {
    const hasValue = Array.isArray(value) && value.length > 0;
    return (
        <FormControl size="small" sx={{ position: 'relative', ...sx }}>
            <InputLabel>{label}</InputLabel>
            <Select
                {...props}
                value={value}
                onChange={onChange}
                label={label}
                disabled={disabled}
                endAdornment={!disabled && hasValue && (
                    <Box
                        component="button"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange({ target: { value: [] } });
                        }}
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1,
                            p: 0.25,
                            border: 'none',
                            bgcolor: 'transparent',
                            cursor: 'pointer',
                            borderRadius: 0.5,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                        }}
                        title="Clear selection"
                    >
                        <ClearIcon sx={{ fontSize: '1.2rem' }} />
                    </Box>
                )}
            >
                {children}
            </Select>
        </FormControl>
    );
};

ClearableSelect.displayName = 'ClearableSelect';
ClearableSelect.propTypes = {
    value: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node,
    sx: PropTypes.object,
    disabled: PropTypes.bool,
    label: PropTypes.string,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified filter bar for /clock and /calendar pages.
 *
 * @param {Function}  onChange        — Called with a partial filter object on change.
 *                                      Parent decides how to persist (updateEventFilters / applyFilters).
 * @param {boolean}   showDateFilter  — When true, renders a date-preset selector (for /calendar).
 * @param {string}    timezone        — Used for date-range calculation when showDateFilter is true.
 * @param {boolean}   disabled        — When true, disables all interactive elements (filters). Used during data loading.
 * @param {object}    stackProps      — Additional props spread onto the outer Stack.
 */
export default function ClockEventsFilters({
    onChange,
    showDateFilter = false,
    timezone,
    disabled = false,
    ...stackProps
}) {
    const { t } = useTranslation(['filter', 'calendar', 'common']);
    const theme = useTheme();
    const { eventFilters } = useSettingsSafe();

    // ─── Derived directly from SettingsContext (single source of truth) ───
    // BEP: Read all filter values including datePreset from eventFilters for consistency
    // No local copies — all state persists via SettingsContext (localStorage + Firestore)
    const selectedCurrencies = eventFilters?.currencies || [];
    const selectedImpacts = eventFilters?.impacts || [];
    const favoritesOnly = eventFilters?.favoritesOnly ?? false;
    const datePreset = eventFilters?.datePreset || 'thisWeek';

    // ─── Local state (UI-only concepts) ───
    const [availableCurrencies, setAvailableCurrencies] = useState([]);

    // Load available currencies once on mount
    useEffect(() => {
        getEventCurrencies({ useCanonical: true })
            .then((result) => {
                const currencies = result?.data || result || [];
                const list = Array.isArray(currencies) ? currencies : [];
                const filtered = list.filter(c => c && c !== 'ALL');

                // BEP: Sort with USD first, EUR second, rest alphabetically
                const sorted = filtered.sort((a, b) => {
                    if (a === 'USD') return -1;
                    if (b === 'USD') return 1;
                    if (a === 'EUR') return -1;
                    if (b === 'EUR') return 1;
                    return a.localeCompare(b);
                });

                setAvailableCurrencies(sorted);
            })
            .catch((err) => {
                console.error('Failed to load currencies:', err);
            });
    }, []);

    // ─── Change handlers (delegate to parent via onChange) ───
    const handleCurrencyChange = (e) => {
        const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
        onChange?.({ currencies: val });
    };

    const handleImpactChange = (e) => {
        const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
        onChange?.({ impacts: val });
    };

    const handleFavoritesToggle = () => {
        onChange?.({ favoritesOnly: !favoritesOnly });
    };

    const handleDatePresetChange = (e) => {
        const preset = e.target.value;
        if (!timezone) return;
        const range = calculateDateRange(preset, timezone);
        if (range) {
            // BEP: Persist datePreset along with calculated date range via eventFilters
            onChange?.({ datePreset: preset, startDate: range.startDate, endDate: range.endDate });
        }
    };

    return (
        <Stack
            direction="row"
            spacing={{ xs: 1, sm: 1.5 }}
            sx={{ mb: 2.5, overflowX: 'auto', overflowY: 'hidden' }}
            flexWrap="wrap"
            useFlexGap
            {...stackProps}
        >
            {/* Favorites Toggle */}
            <Box
                component="button"
                onClick={handleFavoritesToggle}
                disabled={disabled}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: favoritesOnly ? 'primary.main' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'),
                    bgcolor: favoritesOnly ? 'primary.main' : 'transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s ease-in-out',
                    padding: 0,
                    '&:hover': {
                        borderColor: disabled ? 'inherit' : 'primary.main',
                        bgcolor: disabled ? 'transparent' : (favoritesOnly ? 'primary.dark' : 'action.hover'),
                    },
                }}
                title={t('common:favorites')}
            >
                {favoritesOnly ? (
                    <FavoriteIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
                ) : (
                    <FavoriteBorderIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                )}
            </Box>

            {/* Date Preset (calendar only) */}
            {showDateFilter && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>{t('filter:date')}</InputLabel>
                    <Select
                        value={datePreset}
                        label={t('filter:date')}
                        onChange={handleDatePresetChange}
                        disabled={disabled}
                    >
                        {DATE_PRESETS.map((p) => (
                            <MenuItem key={p.key} value={p.key}>
                                {t(p.labelKey, p.key)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* Currencies Multi-Select */}
            <ClearableSelect
                value={selectedCurrencies}
                onChange={handleCurrencyChange}
                label={t('calendar:currency')}
                sx={{ minWidth: { xs: 110, sm: 160 }, flex: 1 }}
                disabled={disabled}
                multiple
                renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {selected.slice(0, 2).map((code) => {
                            const flag = getCurrencyFlag(code);
                            return (
                                <Chip
                                    key={code}
                                    label={code}
                                    size="small"
                                    avatar={
                                        flag ? (
                                            <Box
                                                component="img"
                                                loading="lazy"
                                                width="16"
                                                height="12"
                                                src={`https://flagcdn.com/w20/${flag}.png`}
                                                alt={code}
                                                sx={{ borderRadius: 0.25 }}
                                            />
                                        ) : undefined
                                    }
                                />
                            );
                        })}
                        {selected.length > 2 && (
                            <Chip label={`+${selected.length - 2}`} size="small" />
                        )}
                    </Stack>
                )}
            >
                {availableCurrencies.map((code) => {
                    const flag = getCurrencyFlag(code);
                    return (
                        <MenuItem key={code} value={code}>
                            {flag && (
                                <Box
                                    component="img"
                                    loading="lazy"
                                    width="20"
                                    height="15"
                                    src={`https://flagcdn.com/w20/${flag}.png`}
                                    alt={code}
                                    sx={{ mr: 1, borderRadius: 0.25 }}
                                />
                            )}
                            {code}
                        </MenuItem>
                    );
                })}
            </ClearableSelect>

            {/* Impact Multi-Select */}
            <ClearableSelect
                value={selectedImpacts}
                onChange={handleImpactChange}
                label={t('filter:labels.impacts')}
                sx={{ minWidth: { xs: 110, sm: 160 }, flex: 1 }}
                disabled={disabled}
                multiple
                renderValue={(selected) => (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {selected.slice(0, 2).map((impact) => (
                            <Chip
                                key={impact}
                                label={t(
                                    IMPACT_OPTIONS.find(o => o.value === impact)
                                        ?.labelKey || 'filter:impacts.strongData',
                                    impact
                                )}
                                size="small"
                                icon={
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            bgcolor: IMPACT_COLORS[impact],
                                            ml: 0.5,
                                        }}
                                    />
                                }
                            />
                        ))}
                        {selected.length > 2 && (
                            <Chip label={`+${selected.length - 2}`} size="small" />
                        )}
                    </Stack>
                )}
            >
                {IMPACT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Box
                            sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: IMPACT_COLORS[option.value],
                                mr: 1,
                                flexShrink: 0,
                            }}
                        />
                        {t(option.labelKey, option.value)}
                    </MenuItem>
                ))}
            </ClearableSelect>
        </Stack>
    );
}

ClockEventsFilters.propTypes = {
    onChange: PropTypes.func,
    showDateFilter: PropTypes.bool,
    timezone: PropTypes.string,
    disabled: PropTypes.bool,
};

ClockEventsFilters.defaultProps = {
    onChange: null,
    showDateFilter: false,
    timezone: null,
    disabled: false,
};
