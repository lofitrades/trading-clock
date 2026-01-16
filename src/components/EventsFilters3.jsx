/**
 * src/components/EventsFilters3.jsx
 * 
 * Purpose: Chip-based dropdown filter bar for economic events with always-on date range,
 * quick preset selection, streamlined multi-select impacts/currencies, and search functionality.
 * 
 * Key Features:
 * - Single-row filter chips with dropdown popovers
 * - Timezone-aware date presets (Today default, Yesterday, Tomorrow, This Week)
 * - Multi-select impacts and currencies with instant apply on every change
 * - Search functionality with debounced auto-search (400ms)
 * - Expandable search row with accordion-like UX
 * - Persistent settings via SettingsContext and parent callbacks
 * - Filter changes sync to /app clock canvas (impacts, currencies, favorites)
 * - Fully responsive: wraps on xs/sm, single-row on md+
 * 
 * Changelog:
 * v1.3.24 - 2026-01-14 - CONTRAST-AWARE RESET: Add textColor prop to apply session-based background contrast color to Reset button; when textColor is provided, Reset button uses it instead of default text.secondary for proper visibility on dark session backgrounds.
 * v1.3.23 - 2026-01-14 - CENTER FILTERS ON XS: Simplify justifyContent to always use 'center' when centerFilters={true} across all breakpoints (xs, sm, md+). Remove responsive breakpoints to center filter elements horizontally on extra-small screens as well.
 * v1.3.22 - 2026-01-14 - CENTER FILTERS ON SM: Update justifyContent to center filter elements horizontally on sm breakpoint when centerFilters={true}; now { xs: 'flex-start', sm: 'center', md: 'center' } for responsive centering on tablets and above.
 * v1.3.21 - 2026-01-14 - ENTERPRISE LAYOUT AUDIT FIX: Simplify width calculation to width: 100% + box-sizing: border-box instead of calc-based widths. Padding now handled entirely by parent container on xs/sm; component only pads on md+. This follows enterprise fixed-positioning best practices where parent uses left/right for viewport spanning with box-sizing: border-box.
 * v1.3.20 - 2026-01-14 - ENTERPRISE MOBILE-FIRST WIDTH FIX: Reduce padding on xs/sm (0.75/1 → 0.5/0.75) and use calc-based width to prevent overflow when rendered in fixed-position containers. Use minWidth:0 on outer Stack to prevent flex children from overflowing. Responsive gap reduction (0.75/1 → 0.5/0.75) for tighter mobile layout. Full viewport responsiveness following enterprise best practices.
 * v1.3.19 - 2026-01-14 - LAYOUT FIX: Restructure filter Stack with nested inner container so Reset button is included in centering calculations. Outer Stack handles mobile scrolling; inner Stack (all chips + Reset) treated as single unit for width and centering, ensuring proper alignment on md+ with centerFilters=true.
 * v1.3.18 - 2026-01-13 - IMPROVED CHIP STYLING: Update ChipButton so active filter chips display primary.main background with white text; inactive chips remain white with divider border; better visual feedback when filters are applied.
 * v1.3.17 - 2026-01-13 - Add optional showSearchFilter prop (defaults to true) and centerFilters prop (defaults to false) to customize filter bar; showSearchFilter hides search icon/button; centerFilters centers chips horizontally on md+ (flex-start on xs/sm for scroll); update inactive chip styling to white background for better visibility.
 * v1.3.16 - 2026-01-13 - Add optional showDateFilter prop (defaults to true) to conditionally hide date chip; allows /app page to hide date range filter while keeping impact/currency/search/favorites filters visible.
 * v1.3.15 - 2026-01-13 - RESPONSIVE: Add responsive flexWrap (wrap on xs/sm, nowrap on md+), responsive gap/spacing, responsive padding for full-width support on all breakpoints; prevent horizontal scroll via overflowX visibility control.
 * v1.3.14 - 2026-01-13 - Document cross-page filter sync: filter changes persist to SettingsContext and apply to both /calendar table and /app clock canvas (impacts, currencies, favorites).
 * v1.3.13 - 2026-01-13 - BUGFIX: Added z-index 1700 to filter popovers so they render above drawer (z-index 1600) for proper layering.
 * v1.3.12 - 2026-01-08 - Comprehensive auth gating: all filter actions (date, impact, currency, search, favorites) show AuthModal2 and prevent UI state changes for non-authenticated users.
 * v1.3.11 - 2026-01-08 - Gate search and favorite filter icons for non-authenticated users: show AuthModal2 on click instead of allowing filter functionality.
 * v1.3.10 - 2026-01-08 - Fix instant-apply compatibility for all hosts, remove special-cased reset labeling, and satisfy ESLint PropTypes + hook dependency requirements.
 * v1.3.9 - 2026-01-08 - Auto-apply currency and impact filters immediately on change; removed Apply/Save controls in favor of live filtering aligned with date presets.
 * v1.3.8 - 2026-01-06 - Fixed calculateDateRange to use timezone-safe end-of-day calculation (next day start - 1 second) preventing single-day presets from bleeding into the next calendar day.
 * v1.3.7 - 2026-01-06 - Allow hosts to provide a defaultPreset (defaults to Today) so pages can seed ranges like This Week without altering reset UX.
 * v1.3.6 - 2025-12-18 - When exactly one impact is selected, collapsed impact chip adopts that impact color with contrast-safe text.
 * v1.3.5 - 2025-12-18 - Compute text color via isColorDark for selected impact chips to ensure contrast on all impact backgrounds.
 * v1.3.4 - 2025-12-18 - Use explicit impact hex fills (red/orange/yellow/taupe/gray) so selected chips never fall back to gray; dark text on all fills.
 * v1.3.3 - 2025-12-18 - When selected, impact filter chips fill with their impact color (no gray); dark text for readability.
 * v1.3.2 - 2025-12-18 - Align low-impact chip color with centralized yellow palette; unknown remains taupe.
 * v1.3.0 - 2025-12-15 - Added search functionality with circular search icon, expandable search row, debounced auto-search (400ms), and search within filtered events.
 * v1.2.2 - 2025-12-15 - Changed default date range from 'This Week' to 'Today' for mount, reset, and refresh scenarios.
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

import PropTypes from 'prop-types';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getEventCurrencies } from '../services/economicEventsService';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';
import { isColorDark } from '../utils/clockUtils';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { useAuth } from '../contexts/AuthContext';
import AuthModal2 from './AuthModal2';

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
  'Strong Data': { borderColor: '#d32f2f', bgcolor: '#d32f2f' },
  'Moderate Data': { borderColor: '#f57c00', bgcolor: '#f57c00' },
  'Weak Data': { borderColor: '#F2C94C', bgcolor: '#F2C94C' },
  'Data Not Loaded': { borderColor: '#C7B8A4', bgcolor: '#C7B8A4' },
  'Non-Economic': { borderColor: '#9e9e9e', bgcolor: '#9e9e9e' },
};

const getImpactTextColor = (impactValue) => {
  const bg = impactChipStyle[impactValue]?.bgcolor;
  if (!bg) return 'text.primary';
  return isColorDark(bg) ? '#fff' : '#000';
};

const getImpactSummaryColors = (impacts = []) => {
  if (impacts.length !== 1) return null;
  const selected = impacts[0];
  const style = impactChipStyle[selected];
  if (!style?.bgcolor) return null;
  return {
    background: style.bgcolor,
    text: getImpactTextColor(selected),
  };
};

// ============================================================================
// HELPERS
// ============================================================================

const calculateDateRange = (preset, timezone) => {
  const { year, month, day, dayOfWeek } = getDatePartsInTimezone(timezone);
  const createDate = (y, m, d, endOfDay = false) => {
    if (endOfDay) {
      // Create start of NEXT day, then subtract 1 second to stay within the target day
      // This ensures we don't bleed into the next calendar day in the target timezone
      const nextDayStart = getUtcDateForTimezone(timezone, y, m, d + 1, { hour: 0, minute: 0, second: 0, millisecond: 0 });
      return new Date(nextDayStart.getTime() - 1000); // End at 23:59:59 of target day
    }
    return getUtcDateForTimezone(timezone, y, m, d, { endOfDay: false });
  };

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

const getAnchorPosition = (target) => {
  if (typeof window === 'undefined') return null;
  if (!target || !(target instanceof Element)) return null;
  const rect = target.getBoundingClientRect?.();
  if (!rect) return null;
  return { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX };
};

function ChipButton({ label, onClick, active, colorOverride }) {
  const customActive = Boolean(active && colorOverride);
  return (
    <Chip
      label={label}
      onClick={onClick}
      icon={<ExpandMoreIcon />}
      variant={active ? 'filled' : 'outlined'}
      color={customActive ? 'default' : active ? 'primary' : 'default'}
      sx={{
        borderRadius: 999,
        fontWeight: 700,
        height: 40,
        px: 0.75,
        flexShrink: 0,
        bgcolor: customActive ? colorOverride.background : (active ? 'primary.main' : '#fff'),
        color: customActive ? colorOverride.text : (active ? '#fff' : 'text.primary'),
        borderColor: customActive ? colorOverride.background : (active ? 'primary.main' : 'divider'),
        '& .MuiChip-icon': { fontSize: 18, color: customActive ? colorOverride.text : (active ? '#fff' : undefined) },
        '& .MuiChip-label': { display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' },
        '&.MuiChip-filled': customActive
          ? { bgcolor: colorOverride.background, color: colorOverride.text }
          : (active ? { bgcolor: 'primary.main', color: '#fff' } : undefined),
        '&.MuiChip-filledDefault': customActive
          ? { bgcolor: colorOverride.background, color: colorOverride.text }
          : (active ? { bgcolor: 'primary.main', color: '#fff' } : undefined),
        '&:hover': customActive ? { bgcolor: colorOverride.background } : (active ? { bgcolor: 'primary.dark' } : undefined),
      }}
    />
  );
}

ChipButton.propTypes = {
  label: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
  colorOverride: PropTypes.shape({
    background: PropTypes.string,
    text: PropTypes.string,
  }),
};

ChipButton.defaultProps = {
  active: false,
  colorOverride: null,
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
  defaultPreset = 'today',
  showDateFilter = true,
  showSearchFilter = true,
  centerFilters = false,
  textColor = null,
}) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    currencies: [],
    favoritesOnly: false,
    searchQuery: '',
  });
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const searchDebounceTimerRef = useRef(null);
  const [currencies, setCurrencies] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [anchorDatePos, setAnchorDatePos] = useState(null);
  const [anchorImpactPos, setAnchorImpactPos] = useState(null);
  const [anchorCurrencyPos, setAnchorCurrencyPos] = useState(null);

  const anchorOpen = Boolean(anchorDatePos || anchorImpactPos || anchorCurrencyPos);

  const defaultRange = useMemo(() => calculateDateRange(defaultPreset, timezone), [defaultPreset, timezone]);

  useEffect(() => {
    const startDate = filters?.startDate || defaultRange?.startDate || null;
    const endDate = filters?.endDate || defaultRange?.endDate || null;
    setLocalFilters({
      startDate,
      endDate,
      impacts: filters?.impacts || [],
      currencies: filters?.currencies || [],
      favoritesOnly: filters?.favoritesOnly || false,
      searchQuery: filters?.searchQuery || '',
    });
  }, [filters?.startDate, filters?.endDate, filters?.impacts, filters?.currencies, filters?.favoritesOnly, filters?.searchQuery, defaultRange?.startDate, defaultRange?.endDate]);

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

  const handleReset = useCallback(() => {
    const resetRange = calculateDateRange(defaultPreset, timezone) || defaultRange;
    const resetFilters = {
      startDate: resetRange?.startDate || null,
      endDate: resetRange?.endDate || null,
      impacts: [],
      currencies: [],
      favoritesOnly: false,
      searchQuery: '',
    };
    setLocalFilters(resetFilters);
    applyAndPersist(resetFilters);
    setAnchorImpactPos(null);
    setAnchorCurrencyPos(null);
    setAnchorDatePos(null);
    setSearchExpanded(false);
  }, [applyAndPersist, defaultPreset, defaultRange, timezone]);

  const setDatePreset = useCallback(
    (presetKey) => {
      if (!user) {
        setAnchorDatePos(null);
        setShowAuthModal(true);
        return;
      }
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
    [applyAndPersist, defaultRange, timezone, user],
  );

  const toggleImpact = useCallback((impactValue) => {
    if (!user) {
      setAnchorImpactPos(null);
      setShowAuthModal(true);
      return;
    }
    setLocalFilters((prev) => {
      const exists = prev.impacts.includes(impactValue);
      const impacts = exists ? prev.impacts.filter((v) => v !== impactValue) : [...prev.impacts, impactValue];
      const next = { ...prev, impacts };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist, user]);

  const toggleCurrency = useCallback((currency) => {
    if (!user) {
      setAnchorCurrencyPos(null);
      setShowAuthModal(true);
      return;
    }
    setLocalFilters((prev) => {
      const exists = prev.currencies.includes(currency);
      const currenciesNext = exists ? prev.currencies.filter((c) => c !== currency) : [...prev.currencies, currency];
      const next = { ...prev, currencies: currenciesNext };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist, user]);

  const toggleFavoritesOnly = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setLocalFilters((prev) => {
      const next = { ...prev, favoritesOnly: !prev.favoritesOnly };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist, user]);

  const clearImpacts = useCallback(() => {
    if (!user) {
      setAnchorImpactPos(null);
      setShowAuthModal(true);
      return;
    }
    setLocalFilters((prev) => {
      const next = { ...prev, impacts: [] };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist, user]);

  const clearCurrencies = useCallback(() => {
    if (!user) {
      setAnchorCurrencyPos(null);
      setShowAuthModal(true);
      return;
    }
    setLocalFilters((prev) => {
      const next = { ...prev, currencies: [] };
      applyAndPersist(next);
      return next;
    });
  }, [applyAndPersist, user]);

  // ========== SEARCH HANDLERS ==========

  const toggleSearchExpanded = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSearchExpanded((prev) => {
      const next = !prev;
      if (next) {
        // Auto-focus search input when expanded
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      }
      return next;
    });
  }, [user]);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setLocalFilters((prev) => ({ ...prev, searchQuery: value }));

    // Clear existing debounce timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    // Debounced auto-apply (enterprise best practice: 400ms for search)
    searchDebounceTimerRef.current = setTimeout(() => {
      applyAndPersist({
        startDate: localFilters.startDate,
        endDate: localFilters.endDate,
        impacts: localFilters.impacts,
        currencies: localFilters.currencies,
        favoritesOnly: localFilters.favoritesOnly,
        searchQuery: value,
      });
    }, 400);
  }, [applyAndPersist, localFilters.startDate, localFilters.endDate, localFilters.impacts, localFilters.currencies, localFilters.favoritesOnly]);

  const handleClearSearch = useCallback(() => {
    setLocalFilters((prev) => ({ ...prev, searchQuery: '' }));
    applyAndPersist({
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
      impacts: localFilters.impacts,
      currencies: localFilters.currencies,
      favoritesOnly: localFilters.favoritesOnly,
      searchQuery: '',
    });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [applyAndPersist, localFilters.startDate, localFilters.endDate, localFilters.impacts, localFilters.currencies, localFilters.favoritesOnly]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
      }
    };
  }, []);

  const activePreset = useMemo(
    () => detectActivePreset(localFilters.startDate, localFilters.endDate, timezone),
    [localFilters.startDate, localFilters.endDate, timezone],
  );

  const activePresetKey = activePreset?.key || null;

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      localFilters.impacts.length ||
      localFilters.currencies.length ||
      localFilters.favoritesOnly ||
      localFilters.searchQuery ||
      (activePresetKey && activePresetKey !== defaultPreset),
    );
  }, [activePresetKey, defaultPreset, localFilters.currencies.length, localFilters.favoritesOnly, localFilters.impacts.length, localFilters.searchQuery]);

  const showResetInline = hasActiveFilters && !anchorOpen;

  const dateLabel = activePreset ? `${activePreset.icon} ${activePreset.label}` : 'Date Range';

  const resetLabel = 'Reset filters';

  const impactsLabel = useMemo(() => {
    if (!localFilters.impacts?.length) return 'All impacts';
    if (localFilters.impacts.length <= 2) {
      return localFilters.impacts.map((i) => impactLabelMap[i] || i).join(', ');
    }
    return `${localFilters.impacts.length} impacts`;
  }, [localFilters.impacts]);

  const impactSummaryColors = useMemo(() => getImpactSummaryColors(localFilters.impacts), [localFilters.impacts]);

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

  const renderDatePopover = () => (
    <Popover
      open={Boolean(anchorDatePos)}
      anchorReference="anchorPosition"
      anchorPosition={anchorDatePos || undefined}
      anchorEl={null}
      onClose={() => setAnchorDatePos(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{
        root: { sx: { zIndex: 1700 } },
      }}
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
      slotProps={{
        root: { sx: { zIndex: 1700 } },
      }}
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
                color="default"
                variant={localFilters.impacts.includes(impactValue) ? 'filled' : 'outlined'}
                onClick={() => toggleImpact(impactValue)}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderColor: impactChipStyle[impactValue]?.borderColor,
                  color: localFilters.impacts.includes(impactValue)
                    ? getImpactTextColor(impactValue)
                    : impactChipStyle[impactValue]?.borderColor,
                  bgcolor: localFilters.impacts.includes(impactValue)
                    ? impactChipStyle[impactValue]?.bgcolor
                    : 'transparent',
                  '&.MuiChip-filled': {
                    bgcolor: impactChipStyle[impactValue]?.bgcolor,
                    color: getImpactTextColor(impactValue),
                  },
                  '&.MuiChip-filledDefault': {
                    bgcolor: impactChipStyle[impactValue]?.bgcolor,
                    color: getImpactTextColor(impactValue),
                  },
                  '&.MuiChip-outlined': {
                    bgcolor: 'transparent',
                  },
                }}
              />
            ))}
          </Stack>
          <Stack spacing={0.75} sx={{ width: '100%' }}>
            {['Non-Economic', 'Data Not Loaded'].map((impactValue) => (
              <Chip
                key={impactValue}
                label={`${impactIconMap[impactValue] || ''} ${impactLabelMap[impactValue] || impactValue}`.trim()}
                color="default"
                variant={localFilters.impacts.includes(impactValue) ? 'filled' : 'outlined'}
                onClick={() => toggleImpact(impactValue)}
                sx={{
                  fontWeight: 700,
                  height: 34,
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderColor: impactChipStyle[impactValue]?.borderColor,
                  color: localFilters.impacts.includes(impactValue) ? impactChipStyle[impactValue]?.color : impactChipStyle[impactValue]?.color,
                  bgcolor: localFilters.impacts.includes(impactValue)
                    ? impactChipStyle[impactValue]?.bgcolor
                    : 'transparent',
                  '&.MuiChip-filled': {
                    bgcolor: impactChipStyle[impactValue]?.bgcolor,
                    color: impactChipStyle[impactValue]?.color,
                  },
                  '&.MuiChip-filledDefault': {
                    bgcolor: impactChipStyle[impactValue]?.bgcolor,
                    color: impactChipStyle[impactValue]?.color,
                  },
                  '&.MuiChip-outlined': {
                    bgcolor: 'transparent',
                  },
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
          <Button onClick={() => setAnchorImpactPos(null)} size="small" sx={{ textTransform: 'none' }}>
            Close
          </Button>
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
      slotProps={{
        root: { sx: { zIndex: 1700 } },
      }}
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
          <Button onClick={() => setAnchorCurrencyPos(null)} size="small" sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );

  return (
    <Box
      sx={{
        // Mobile-first: parent fixed container handles padding on xs/sm, component pads on md+
        p: 0,
        mb: actionOffset ? actionOffset / 2 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 0.5, sm: 0.75, md: 1.25 },
        position: 'relative',
        borderRadius: 0,
        border: 'none',
        borderColor: 'transparent',
        bgcolor: 'transparent',
        boxShadow: 'none',
        // Enterprise: width 100% with box-sizing border-box respects parent constraints
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Outer container for scrolling on mobile */}
      <Stack
        direction="row"
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          alignItems: 'center',
          justifyContent: centerFilters ? 'center' : 'flex-start',
          pb: { xs: 0.25, md: 0 },
          width: '100%',
          minWidth: 0,
          '&::-webkit-scrollbar': {
            height: 2,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(0,0,0,0.12)',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.2)',
            },
          },
          // For Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.12) transparent',
        }}
      >
        {/* Inner container: all filter controls treated as a single unit for centering and scroll width */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 0.75, md: 1 }}
          sx={{
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: 'auto',
          }}
        >
          {showSearchFilter && (
            <Tooltip title={searchExpanded ? 'Close search' : 'Search events'}>
              <span>
                <IconButton
                  onClick={toggleSearchExpanded}
                  size="small"
                  color={searchExpanded || localFilters.searchQuery ? 'primary' : 'default'}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: searchExpanded || localFilters.searchQuery ? 'primary.main' : 'divider',
                    bgcolor: searchExpanded || localFilters.searchQuery ? 'primary.lighter' : 'background.paper',
                    flexShrink: 0,
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
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
                  flexShrink: 0,
                }}
              >
                {localFilters.favoritesOnly ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          {showDateFilter && (
            <ChipButton
              label={dateLabel}
              onClick={(event) => setAnchorDatePos(getAnchorPosition(event.currentTarget))}
              active={Boolean(activePreset)}
            />
          )}
          <ChipButton
            label={currencyLabel}
            onClick={(event) => setAnchorCurrencyPos(getAnchorPosition(event.currentTarget))}
            active={Boolean(localFilters.currencies.length)}
          />
          <ChipButton
            label={impactsLabel}
            onClick={(event) => setAnchorImpactPos(getAnchorPosition(event.currentTarget))}
            active={Boolean(localFilters.impacts.length)}
            colorOverride={impactSummaryColors}
          />

          {showResetInline && (
            <Tooltip title={resetLabel}>
              <span>
                <Box
                  component="button"
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  aria-label="Reset filters"
                  sx={{
                    ml: 0.5,
                    flexShrink: 0,
                    appearance: 'none',
                    border: 'none',
                    bgcolor: 'transparent',
                    p: 0,
                    m: 0,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      color: textColor || 'text.secondary',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      '&:hover': loading
                        ? undefined
                        : {
                          bgcolor: 'action.hover',
                          color: textColor || 'text.primary',
                        },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Reset
                    </Typography>
                  </Stack>
                </Box>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Expandable Search Row */}
      <Collapse in={searchExpanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            bgcolor: 'transparent',
            boxShadow: 1,
            width: '100%',
          }}
        >
          <TextField
            inputRef={searchInputRef}
            fullWidth
            size="small"
            placeholder="Search by name, currency, or notes..."
            value={localFilters.searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: localFilters.searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
              },
            }}
          />
          {localFilters.searchQuery && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: { xs: 0.5, sm: 0.75 }, ml: { xs: 0.25, sm: 0.5 } }}
            >
              Searching within filtered events...
            </Typography>
          )}
        </Box>
      </Collapse>

      {renderDatePopover()}
      {renderImpactPopover()}
      {renderCurrencyPopover()}

      <AuthModal2
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </Box>
  );
}

EventsFilters3.propTypes = {
  filters: PropTypes.shape({
    startDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
    endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.number]),
    impacts: PropTypes.arrayOf(PropTypes.string),
    currencies: PropTypes.arrayOf(PropTypes.string),
    favoritesOnly: PropTypes.bool,
    searchQuery: PropTypes.string,
  }),
  onFiltersChange: PropTypes.func.isRequired,
  onApply: PropTypes.func,
  loading: PropTypes.bool,
  timezone: PropTypes.string,
  newsSource: PropTypes.string,
  actionOffset: PropTypes.number,
  defaultPreset: PropTypes.oneOf(DATE_PRESETS.map((preset) => preset.key)),
  showDateFilter: PropTypes.bool,
  showSearchFilter: PropTypes.bool,
  centerFilters: PropTypes.bool,
  textColor: PropTypes.string,
  stickyZIndex: PropTypes.number,
  stickyTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object]),
};

EventsFilters3.defaultProps = {
  filters: null,
  onApply: null,
  loading: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  newsSource: 'mql5',
  actionOffset: 0,
  defaultPreset: 'today',
  showDateFilter: true,
  showSearchFilter: true,
  centerFilters: false,
  textColor: null,
  stickyZIndex: 1000,
  stickyTop: 0,
};
