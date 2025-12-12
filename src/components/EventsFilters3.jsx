/**
 * src/components/EventsFilters3.jsx
 * 
 * Purpose: Chip-based dropdown filter bar for economic events with always-on date range,
 * quick preset selection, and streamlined multi-select impacts/currencies.
 * 
 * Key Features:
 * - Single-row filter chips with dropdown popovers
 * - Timezone-aware date presets (This Week default, Today, Yesterday, Tomorrow)
 * - Multi-select impacts and currencies with quick clear/apply
 * - Persistent settings via SettingsContext and parent callbacks
 * 
 * Changelog:
 * v1.2.1 - 2025-12-12 - Tighten vertical spacing when filter chips wrap onto multiple rows.
 * v1.2.0 - 2025-12-12 - Add favorites-only toggle chip aligned with impact filter.
 * v1.1.8 - 2025-12-11 - Remove global clear-all filter chip and confirmation dialog per latest UX request.
 * v1.1.7 - 2025-12-11 - Reorder impact chips into left (High/Medium/Low) and right (Non-Economic/Unknown) columns; set currencies to three-column grid.
 * v1.1.6 - 2025-12-11 - Render impact and currency chips in two vertical columns for a denser mobile-first grid.
 * v1.1.5 - 2025-12-11 - Stack date presets vertically (one per row) for a mobile-first responsive layout.
 * v1.1.4 - 2025-12-11 - CRITICAL FIX: Remove fallback to parent filters in handleApply to prevent date reversion when changing impacts/currencies.
 * v1.1.3 - 2025-12-11 - Auto-apply date preset on click and simplify date popover (no footer buttons).
 * v1.1.2 - 2025-12-11 - Made container transparent and borderless (parent provides framing).
 * v1.1.1 - 2025-12-11 - Add pill spacing, impact color accents, and currency flags in the picker for a cleaner, modern UI.
 * v1.1.0 - 2025-12-11 - Refined UI spacing, responsive layout, and flag-enhanced currency chip for an Airbnb-like minimal filter bar.
 * v1.0.3 - 2025-12-11 - Switch popovers to anchorPosition (viewport coords) instead of anchorEl to eliminate invalid anchor warnings in hidden layouts.
 * v1.0.2 - 2025-12-11 - Hardened anchor validation (connected + visible) and auto-clearing to stop invalid anchorEl warnings.
 * v1.0.1 - 2025-12-11 - Guard popovers against stale anchors to avoid MUI anchorEl warnings when unmounted/hidden.
 * v1.0.0 - 2025-12-11 - Initial chip-based dropdown filter bar with mandatory date preset.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Chip,
  Stack,
  Button,
  Popover,
  Typography,
  Divider,
  Tooltip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { getEventCurrencies } from '../services/economicEventsService';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';
import { getCurrencyFlag } from './EventsTimeline2';

// ============================================================================
// CONSTANTS
// ============================================================================

const DATE_PRESETS = [
  { key: 'thisWeek', label: 'This Week', icon: '🗓️' },
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'yesterday', label: 'Yesterday', icon: '📅' },
  { key: 'tomorrow', label: 'Tomorrow', icon: '📆' },
];

const IMPACT_LEVELS = [
  { value: 'Strong Data', label: 'High', icon: '!!!' },
  { value: 'Moderate Data', label: 'Medium', icon: '!!' },
  { value: 'Weak Data', label: 'Low', icon: '!' },
  { value: 'Data Not Loaded', label: 'Unknown', icon: '?' },
  { value: 'Non-Economic', label: 'Non-Eco', icon: '~' },
];

const impactLabelMap = IMPACT_LEVELS.reduce((acc, curr) => {
  acc[curr.value] = curr.label;
  return acc;
}, {});

const impactIconMap = IMPACT_LEVELS.reduce((acc, curr) => {
  acc[curr.value] = curr.icon;
  return acc;
}, {});

const impactChipStyle = {
  'Strong Data': { borderColor: 'error.light', color: 'error.dark', bgcolor: 'error.lighter' },
  'Moderate Data': { borderColor: 'warning.light', color: 'warning.dark', bgcolor: 'warning.lighter' },
  'Weak Data': { borderColor: 'info.light', color: 'info.dark', bgcolor: 'info.lighter' },
  'Data Not Loaded': { borderColor: 'divider', color: 'text.secondary', bgcolor: 'background.paper' },
  'Non-Economic': { borderColor: 'success.light', color: 'success.dark', bgcolor: 'success.lighter' },
};

// ============================================================================
// HELPERS
// ============================================================================

const calculateDateRange = (preset, timezone) => {
  const { year, month, day, dayOfWeek } = getDatePartsInTimezone(timezone);
  const createDate = (y, m, d, endOfDay = false) => getUtcDateForTimezone(timezone, y, m, d, { endOfDay });

  switch (preset) {
    case 'today':
      return { startDate: createDate(year, month, day), endDate: createDate(year, month, day, true) };
    case 'yesterday':
      return { startDate: createDate(year, month, day - 1), endDate: createDate(year, month, day - 1, true) };
    case 'tomorrow':
      return { startDate: createDate(year, month, day + 1), endDate: createDate(year, month, day + 1, true) };
    case 'thisWeek': {
      const startDay = day - dayOfWeek;
      const endDay = day + (6 - dayOfWeek);
      return { startDate: createDate(year, month, startDay), endDate: createDate(year, month, endDay, true) };
    }
    default:
      return null;
  }
};

const detectActivePreset = (startDate, endDate, timezone) => {
  if (!startDate || !endDate) return null;
  return (
    DATE_PRESETS.find((preset) => {
      const range = calculateDateRange(preset.key, timezone);
      if (!range) return false;
      const startMatch = new Date(range.startDate).getTime() === new Date(startDate).getTime();
      const endMatch = new Date(range.endDate).getTime() === new Date(endDate).getTime();
      return startMatch && endMatch;
    }) || null
  );
};

const arraysEqual = (arr1 = [], arr2 = []) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((item) => arr2.includes(item)) && arr2.every((item) => arr1.includes(item));
};

const getAnchorPosition = (target) => {
  if (typeof window === 'undefined') return null;
  if (!target || !(target instanceof Element)) return null;
  const rect = target.getBoundingClientRect?.();
  if (!rect) return null;
  return { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function EventsFilters3({
  filters,
  onFiltersChange,
  onApply,
  loading = false,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  newsSource = 'mql5',
  actionOffset = 0,
}) {
  const [localFilters, setLocalFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    currencies: [],
    favoritesOnly: false,
  });
  const [currencies, setCurrencies] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const [anchorDatePos, setAnchorDatePos] = useState(null);
  const [anchorImpactPos, setAnchorImpactPos] = useState(null);
  const [anchorCurrencyPos, setAnchorCurrencyPos] = useState(null);

  const anchorOpen = Boolean(anchorDatePos || anchorImpactPos || anchorCurrencyPos);

  const defaultRange = useMemo(() => calculateDateRange('thisWeek', timezone), [timezone]);

  useEffect(() => {
    setInitialized(true);
  }, []);

  useEffect(() => {
    const startDate = filters?.startDate || defaultRange?.startDate || null;
    const endDate = filters?.endDate || defaultRange?.endDate || null;
    setLocalFilters({
      startDate,
      endDate,
      impacts: filters?.impacts || [],
      currencies: filters?.currencies || [],
      favoritesOnly: filters?.favoritesOnly || false,
    });
  }, [filters?.startDate, filters?.endDate, filters?.impacts, filters?.currencies, filters?.favoritesOnly, defaultRange?.startDate, defaultRange?.endDate]);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const currenciesResult = await getEventCurrencies({ source: newsSource, useCanonical: true });
        if (currenciesResult?.success) {
          const data = currenciesResult.data || [];
          const unique = Array.from(new Set(data));
          const reordered = ['USD', ...unique.filter((c) => c !== 'USD')];
          setCurrencies(reordered);
        } else {
          setCurrencies([]);
        }
      } catch (error) {
        console.error('❌ [EventsFilters3] Failed to fetch currencies', error);
        setCurrencies([]);
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, [newsSource]);

  const hasChanges = useMemo(() => {
    if (!initialized) return false;
    const parent = filters || { impacts: [], currencies: [], favoritesOnly: false };

    if (!arraysEqual(localFilters.impacts, parent.impacts)) return true;
    if (!arraysEqual(localFilters.currencies, parent.currencies)) return true;
    if (Boolean(localFilters.favoritesOnly) !== Boolean(parent.favoritesOnly)) return true;
    return false;
  }, [filters, initialized, localFilters]);

  const applyAndPersist = useCallback(
    (nextFilters) => {
      // Defer updates to avoid parent state changes during child render
      Promise.resolve().then(() => {
        onFiltersChange(nextFilters);
        if (onApply) onApply(nextFilters);
      });
    },
    [onApply, onFiltersChange],
  );

  const handleApply = useCallback(() => {
    // Apply current local filters (date already set via setDatePreset for presets)
    applyAndPersist({
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
      impacts: localFilters.impacts,
      currencies: localFilters.currencies,
      favoritesOnly: localFilters.favoritesOnly,
    });
    setAnchorDatePos(null);
    setAnchorImpactPos(null);
    setAnchorCurrencyPos(null);
  }, [applyAndPersist, localFilters.currencies, localFilters.impacts, localFilters.endDate, localFilters.startDate]);

  const handleReset = useCallback(() => {
    const resetRange = calculateDateRange('thisWeek', timezone) || defaultRange;
    const resetFilters = {
      startDate: resetRange?.startDate || null,
      endDate: resetRange?.endDate || null,
      impacts: [],
      currencies: [],
      favoritesOnly: false,
    };
    setLocalFilters(resetFilters);
    applyAndPersist(resetFilters);
    setAnchorImpactPos(null);
    setAnchorCurrencyPos(null);
    setAnchorDatePos(null);
  }, [applyAndPersist, defaultRange, timezone]);

  const setDatePreset = useCallback(
    (presetKey) => {
      const range = calculateDateRange(presetKey, timezone) || defaultRange;
      if (!range) return;

      setLocalFilters((prev) => {
        const next = {
          ...prev,
          startDate: range.startDate,
          endDate: range.endDate,
        };
        applyAndPersist(next);
        return next;
      });
      setAnchorDatePos(null);
    },
    [applyAndPersist, defaultRange, timezone],
  );

  const toggleImpact = useCallback((impactValue) => {
    setLocalFilters((prev) => {
      const exists = prev.impacts.includes(impactValue);
      const impacts = exists ? prev.impacts.filter((v) => v !== impactValue) : [...prev.impacts, impactValue];
      return { ...prev, impacts };
    });
  }, []);

  const toggleCurrency = useCallback((currency) => {
    setLocalFilters((prev) => {
      const exists = prev.currencies.includes(currency);
      const currenciesNext = exists ? prev.currencies.filter((c) => c !== currency) : [...prev.currencies, currency];
      return { ...prev, currencies: currenciesNext };
    });
  }, []);

  const toggleFavoritesOnly = useCallback(() => {
    setLocalFilters((prev) => {
      const next = { ...prev, favoritesOnly: !prev.favoritesOnly };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist]);

  const clearImpacts = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, impacts: [] }));
  }, []);

  const clearCurrencies = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, currencies: [] }));
  }, []);

  const activePreset = useMemo(
    () => detectActivePreset(localFilters.startDate, localFilters.endDate, timezone),
    [localFilters.startDate, localFilters.endDate, timezone],
  );

  const showActions = hasChanges && !anchorOpen;

  const dateLabel = activePreset ? `${activePreset.icon} ${activePreset.label}` : 'Date Range';

  const impactsLabel = useMemo(() => {
    if (!localFilters.impacts?.length) return 'All impacts';
    if (localFilters.impacts.length <= 2) {
      return localFilters.impacts.map((i) => impactLabelMap[i] || i).join(', ');
    }
    return `${localFilters.impacts.length} impacts`;
  }, [localFilters.impacts]);

  const currencyLabel = useMemo(() => {
    if (!localFilters.currencies?.length) return 'All currencies';
    const first = localFilters.currencies[0];
    const flagCode = getCurrencyFlag(first);
    const flag = flagCode ? (
      <Box
        component="span"
        className={`fi fi-${flagCode}`}
        sx={{ fontSize: 16, lineHeight: 1, mr: 0.5 }}
      />
    ) : null;

    if (localFilters.currencies.length === 1) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {flag}
          <Typography variant="body2" fontWeight={700} component="span">
            {first}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {flag}
        <Typography variant="body2" fontWeight={700} component="span">
          {`${localFilters.currencies.length} currencies`}
        </Typography>
      </Box>
    );
  }, [localFilters.currencies]);

  const ChipButton = ({ label, onClick, active }) => (
    <Chip
      label={label}
      onClick={onClick}
      icon={<ExpandMoreIcon />}
      variant={active ? 'filled' : 'outlined'}
      color={active ? 'primary' : 'default'}
      sx={{
        borderRadius: 999,
        fontWeight: 700,
        height: 40,
        px: 0.75,
        boxShadow: active ? 1 : 0,
        '& .MuiChip-icon': { fontSize: 18 },
        '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.5 },
      }}
    />
  );

  const renderDatePopover = () => (
    <Popover
      open={Boolean(anchorDatePos)}
      anchorReference="anchorPosition"
      anchorPosition={anchorDatePos || undefined}
      anchorEl={null}
      onClose={() => setAnchorDatePos(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{
        sx: {
          p: 2,
          width: 360,
          maxWidth: '90vw',
          borderRadius: 2,
          boxShadow: 6,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle1" fontWeight={800}>
          Date Range
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pick a preset to immediately update the calendar.
        </Typography>
        <Stack direction="column" spacing={0.75} sx={{ width: '100%' }}>
          {DATE_PRESETS.map((preset) => {
            const isActive = activePreset?.key === preset.key;
            return (
              <Chip
                key={preset.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </Box>
                }
                color={isActive ? 'primary' : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => setDatePreset(preset.key)}
                sx={{ fontWeight: 700, height: 36, width: '100%', justifyContent: 'flex-start' }}
              />
            );
          })}
        </Stack>
      </Stack>
    </Popover>
  );

  const renderImpactPopover = () => (
    <Popover
      open={Boolean(anchorImpactPos)}
      anchorReference="anchorPosition"
      anchorPosition={anchorImpactPos || undefined}
      anchorEl={null}
      onClose={() => setAnchorImpactPos(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{
        sx: {
          p: 2,
          width: 360,
          maxWidth: '90vw',
          borderRadius: 2,
          boxShadow: 6,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle1" fontWeight={800}>
          Impact Levels
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 0.75,
            alignItems: 'start',
          }}
        >
          <Stack spacing={0.75} sx={{ width: '100%' }}>
            {['Strong Data', 'Moderate Data', 'Weak Data'].map((impactValue) => (
              <Chip
                key={impactValue}
                label={`${impactIconMap[impactValue] || ''} ${impactLabelMap[impactValue] || impactValue}`.trim()}
                color={localFilters.impacts.includes(impactValue) ? 'primary' : 'default'}
                variant={localFilters.impacts.includes(impactValue) ? 'filled' : 'outlined'}
                onClick={() => toggleImpact(impactValue)}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderColor: impactChipStyle[impactValue]?.borderColor,
                  color: impactChipStyle[impactValue]?.color,
                  bgcolor: localFilters.impacts.includes(impactValue)
                    ? impactChipStyle[impactValue]?.bgcolor
                    : 'transparent',
                }}
              />
            ))}
          </Stack>
          <Stack spacing={0.75} sx={{ width: '100%' }}>
            {['Non-Economic', 'Data Not Loaded'].map((impactValue) => (
              <Chip
                key={impactValue}
                label={`${impactIconMap[impactValue] || ''} ${impactLabelMap[impactValue] || impactValue}`.trim()}
                color={localFilters.impacts.includes(impactValue) ? 'primary' : 'default'}
                variant={localFilters.impacts.includes(impactValue) ? 'filled' : 'outlined'}
                onClick={() => toggleImpact(impactValue)}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderColor: impactChipStyle[impactValue]?.borderColor,
                  color: impactChipStyle[impactValue]?.color,
                  bgcolor: localFilters.impacts.includes(impactValue)
                    ? impactChipStyle[impactValue]?.bgcolor
                    : 'transparent',
                }}
              />
            ))}
          </Stack>
        </Box>
        <Divider />
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button
            size="small"
            onClick={clearImpacts}
            color="error"
            sx={{ textTransform: 'none' }}
            disabled={!localFilters.impacts.length}
          >
            Clear
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setAnchorImpactPos(null)} size="small" sx={{ textTransform: 'none' }}>
              Close
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApply}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Apply Now
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Popover>
  );

  const renderCurrencyPopover = () => (
    <Popover
      open={Boolean(anchorCurrencyPos)}
      anchorReference="anchorPosition"
      anchorPosition={anchorCurrencyPos || undefined}
      anchorEl={null}
      onClose={() => setAnchorCurrencyPos(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      PaperProps={{
        sx: {
          p: 2,
          width: 420,
          maxWidth: '90vw',
          borderRadius: 2,
          boxShadow: 6,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle1" fontWeight={800}>
          Currencies
        </Typography>
        {optionsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading currencies...</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
              columnGap: 0.75,
              rowGap: 0.75,
            }}
          >
            {currencies.map((currency) => {
              const active = localFilters.currencies.includes(currency);
              const flagCode = getCurrencyFlag(currency);
              return (
                <Chip
                  key={currency}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {flagCode && (
                        <Box
                          component="span"
                          className={`fi fi-${flagCode}`}
                          sx={{ fontSize: 16, lineHeight: 1 }}
                        />
                      )}
                      <Typography variant="body2" fontWeight={700} component="span">
                        {currency}
                      </Typography>
                    </Box>
                  }
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  onClick={() => toggleCurrency(currency)}
                  sx={{ fontWeight: 700, height: 32, width: '100%', justifyContent: 'flex-start' }}
                />
              );
            })}
            {currencies.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No currencies available.
              </Typography>
            )}
          </Box>
        )}
        <Divider />
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button
            size="small"
            onClick={clearCurrencies}
            color="error"
            sx={{ textTransform: 'none' }}
            disabled={!localFilters.currencies.length}
          >
            Clear
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setAnchorCurrencyPos(null)} size="small" sx={{ textTransform: 'none' }}>
              Close
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleApply}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Apply Now
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Popover>
  );

  return (
    <Box
      sx={{
        p: { xs: 1.25, sm: 1.75 },
        mb: actionOffset ? actionOffset / 2 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        position: 'relative',
        borderRadius: 0,
        border: 'none',
        borderColor: 'transparent',
        bgcolor: 'transparent',
        boxShadow: 'none',
      }}
    >
      <Stack
        direction="row"
        spacing={0}
        rowGap={0.25}
        columnGap={1}
        flexWrap="wrap"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={0} rowGap={0.25} columnGap={1} flexWrap="wrap" alignItems="center">
          <ChipButton
            label={dateLabel}
            onClick={(event) => setAnchorDatePos(getAnchorPosition(event.currentTarget))}
            active={Boolean(activePreset)}
          />
          <ChipButton
            label={currencyLabel}
            onClick={(event) => setAnchorCurrencyPos(getAnchorPosition(event.currentTarget))}
            active={Boolean(localFilters.currencies.length)}
          />
          <ChipButton
            label={impactsLabel}
            onClick={(event) => setAnchorImpactPos(getAnchorPosition(event.currentTarget))}
            active={Boolean(localFilters.impacts.length)}
          />
          <Tooltip title={localFilters.favoritesOnly ? 'Showing favorites only' : 'Show favorites only'}>
            <span>
              <IconButton
                onClick={toggleFavoritesOnly}
                size="small"
                color={localFilters.favoritesOnly ? 'primary' : 'default'}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: localFilters.favoritesOnly ? 'primary.main' : 'divider',
                  bgcolor: localFilters.favoritesOnly ? 'primary.lighter' : 'background.paper',
                  boxShadow: localFilters.favoritesOnly ? 1 : 0,
                }}
              >
                {localFilters.favoritesOnly ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {showActions && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent={{ xs: 'flex-start', sm: 'flex-start' }}
          sx={{ pt: 0.5, rowGap: 1, columnGap: 1.5, flexWrap: 'wrap' }}
        >
          <Tooltip title={hasChanges ? 'Apply pending changes' : 'No changes to apply'}>
            <span style={{ width: '100%', display: 'flex', maxWidth: '100%' }}>
              <Button
                variant="contained"
                color="warning"
                size="small"
                fullWidth
                onClick={handleApply}
                disabled={loading || !hasChanges}
                startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  px: { xs: 1.75, sm: 2.25 },
                  py: { xs: 0.9, sm: 0.75 },
                  minWidth: { sm: 160 },
                  boxShadow: 2,
                }}
              >
                {loading ? 'Applying' : 'Apply Changes'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Reset to Today and clear filters">
            <span style={{ width: '100%', display: 'flex', maxWidth: '100%' }}>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={handleReset}
                disabled={loading}
                startIcon={<RestartAltIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.85, sm: 0.7 },
                  minWidth: { sm: 140 },
                  borderWidth: 2,
                }}
              >
                Reset
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}

      {renderDatePopover()}
      {renderImpactPopover()}
      {renderCurrencyPopover()}
    </Box>
  );
}
