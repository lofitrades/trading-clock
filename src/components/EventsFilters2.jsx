/**
 * src/components/EventsFilters2.jsx
 * 
 * Purpose: Enterprise-grade filter component for economic events
 * Optimized performance with memoization, improved UX with skeleton loading,
 * accessible design, and mobile-first responsive layout
 * 
 * Key Features:
 * - Smart date presets with visual indicators
 * - Virtualized filter lists for performance
 * - Optimistic UI updates with debouncing
 * - Accessible keyboard navigation
 * - Real-time filter count badges
 * - Smooth animations and transitions
 * 
 * Changelog:
 * v2.4.1 - 2025-12-08 - Fixed date calculations: always use fresh Date() dynamically, added timezone-aware logging, fixed 'This Week' calculation for accurate current week detection
 * v2.4.0 - 2025-12-08 - Fixed active filters display: now shows only applied filters (parent state) not unapplied local state, added localActivePreset for UI feedback during editing
 * v2.3.4 - 2025-11-30 - Simplified impact labels: removed "Impact" suffix (High, Medium, Low instead of High Impact, etc.)
 * v2.3.3 - 2025-11-30 - Impact chips: replaced tooltips with labels below chips (High, Medium, Low, Unknown, Non-Economic)
 * v2.3.2 - 2025-11-30 - Impact section: always 5 columns (one per impact level) on all screen sizes, reduced gap for mobile fit
 * v2.3.1 - 2025-11-30 - Fixed ImpactChip color resolution: added resolveColor helper to convert theme paths to actual color values
 * v2.3.0 - 2025-11-30 - Impact filters: chip-only UI with tooltips (mobile touch support), 2-column mobile, 4-column desktop layout
 * v2.2.0 - 2025-11-30 - Made currency filters dynamic: only show currencies that exist in Firestore (no static MAJOR_CURRENCIES merge)
 * v2.1.5 - 2025-11-30 - Restored bottom padding (100px/90px) to account for sticky button height - works with multiple expanded accordions
 * v2.1.4 - 2025-11-30 - Removed unnecessary bottom padding (pb: 0), sticky buttons handle spacing naturally [REVERTED]
 * v2.1.3 - 2025-11-30 - Increased bottom padding to 100px/90px (xs/sm) to properly account for sticky button container height
 * v2.1.2 - 2025-11-30 - Fixed accordion spacing: added pt=1.5 to all AccordionDetails, increased bottom padding (xs=96px, sm=80px)
 * v2.1.1 - 2025-11-30 - Improved spacing: bottom padding on all screen sizes (xs=72px, sm=64px) + increased accordion spacing (2.5 units)
 * v2.1.0 - 2025-11-30 - Mobile UX: Added bottom padding (72px) to filter content on xs to prevent overlap with sticky buttons
 * v2.0.9 - 2025-11-30 - Enhanced debugging and fixed thisWeek to use Date constructor consistently
 * v2.0.8 - 2025-11-30 - Fixed date range calculations: use Date constructor with explicit values to prevent time component issues
 * v2.0.7 - 2025-11-30 - Fixed date range calculations: create independent Date objects to prevent mutation issues
 * v2.0.6 - 2025-11-30 - Auto-collapse filter section after Apply/Reset/Clear All/Quick Select actions
 * v2.0.5 - 2025-11-30 - UX improvements: Quick Select applies immediately, chip removal applies immediately, Clear All visible when expanded
 * v2.0.4 - 2025-11-30 - Fixed hasChanges false positive on mount/reset: syncs localFilters with parent
 * v2.0.3 - 2025-11-30 - Default date range (4 weeks) not shown as active filter on mount/reset
 * v2.0.2 - 2025-11-30 - Reset button now returns to initial mount state (4 weeks around today)
 * v2.0.1 - 2025-11-30 - Fixed hasChanges logic: compares local vs saved filters for accurate state
 * v2.0.0 - 2025-11-29 - Enterprise refactor with performance optimizations
 * v1.0.0 - 2025-11-29 - Initial implementation
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Badge,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Zoom,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getEventCategories, getEventCurrencies } from '../services/economicEventsService';
import { useSettings } from '../contexts/SettingsContext';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Currency to country code mapping for flag icons
 * Comprehensive list of major trading currencies
 */
const CURRENCY_TO_COUNTRY = {
  'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
  'AUD': 'au', 'CAD': 'ca', 'NZD': 'nz', 'CNY': 'cn', 'HKD': 'hk',
  'SGD': 'sg', 'SEK': 'se', 'NOK': 'no', 'DKK': 'dk', 'PLN': 'pl',
  'CZK': 'cz', 'HUF': 'hu', 'RON': 'ro', 'TRY': 'tr', 'ZAR': 'za',
  'BRL': 'br', 'MXN': 'mx', 'INR': 'in', 'KRW': 'kr', 'RUB': 'ru',
  'THB': 'th', 'IDR': 'id', 'MYR': 'my', 'PHP': 'ph', 'ILS': 'il',
  'CLP': 'cl', 'ARS': 'ar', 'COP': 'co', 'PEN': 'pe', 'VND': 'vn',
};

/**
 * Major trading currencies (fallback list)
 * Ensures all major currencies appear in filter even if no events exist
 * Ordered by trading volume/importance
 */
const MAJOR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF',  // Major forex pairs
  'AUD', 'CAD', 'NZD',                 // Commodity currencies
  'CNY', 'HKD', 'SGD',                 // Asia-Pacific
  'SEK', 'NOK', 'DKK',                 // Scandinavian
  'PLN', 'CZK', 'HUF',                 // Central Europe
  'BRL', 'MXN', 'ARS',                 // Latin America
  'INR', 'KRW', 'IDR',                 // Emerging Asia
  'ZAR', 'TRY', 'RUB',                 // Emerging markets
];

/**
 * Get country code for currency flag
 * @param {string} currency - Currency code
 * @returns {string|null} Country code or null
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
};

/**
 * Impact levels configuration
 * Matches Firestore 'strength' field values from MQL5 API
 * Icons match the timeline display: !!! = High, !! = Medium, ! = Low, ? = Unknown, ~ = Non-Economic
 */
const IMPACT_LEVELS = [
  { 
    value: 'Strong Data', 
    label: 'High', 
    color: 'error.main',
    icon: '!!!',
    description: 'Major market-moving events'
  },
  { 
    value: 'Moderate Data', 
    label: 'Medium', 
    color: 'warning.main',
    icon: '!!',
    description: 'Significant but moderate effect'
  },
  { 
    value: 'Weak Data', 
    label: 'Low', 
    color: 'info.main',
    icon: '!',
    description: 'Minor market impact'
  },
  { 
    value: 'Data Not Loaded', 
    label: 'Unknown', 
    color: 'grey.500',
    icon: '?',
    description: 'Future events - impact TBD'
  },
  { 
    value: 'Non-Eco...', 
    label: 'Non-Eco...', 
    color: 'grey.500',
    icon: '~',
    description: 'Non-economic events'
  },
];

/**
 * Date preset configurations
 * Organized by category for better UX
 */
const DATE_PRESETS = {
  quick: [
    { key: 'today', label: 'Today', icon: '📅' },
    { key: 'tomorrow', label: 'Tomorrow', icon: '📆' },
  ],
  current: [
    { key: 'thisWeek', label: 'This Week', icon: '🗓️' },
    { key: 'thisMonth', label: 'This Month', icon: '📋' },
  ],
  upcoming: [
    { key: 'nextWeek', label: 'Next Week', icon: '⏭️' },
    { key: 'nextMonth', label: 'Next Month', icon: '⏩' },
  ],
  past: [
    { key: 'week', label: 'Past Week', icon: '⏮️' },
    { key: 'month', label: 'Past Month', icon: '⏪' },
  ],
};

// Animation durations for consistent UX
const ANIMATION_DURATION = {
  collapse: 300,
  fade: 200,
  zoom: 150,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current date components in a specific timezone
 * @param {string} timezone - IANA timezone
 * @returns {Object} Date components { year, month, day, dayOfWeek }
 */
const getDateInTimezone = (timezone) => {
  // IMPORTANT: Always create fresh Date() to get current date/time
  const now = new Date();
  
  console.log(`📅 [EventsFilters2] Getting date in timezone ${timezone}:`, {
    utcDate: now.toISOString(),
    localDate: now.toLocaleString('en-US', { timeZone: timezone }),
  });
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day').value);
  
  // Get day of week (0 = Sunday)
  const dayOfWeek = now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short' });
  const dayOfWeekMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  
  console.log(`📅 [EventsFilters2] Parsed date components:`, {
    year,
    month: month + 1, // Show 1-indexed for readability
    day,
    dayOfWeek,
    dayName: Object.keys(dayOfWeekMap).find(k => dayOfWeekMap[k] === dayOfWeekMap[dayOfWeek]),
  });
  
  return {
    year,
    month,
    day,
    dayOfWeek: dayOfWeekMap[dayOfWeek]
  };
};

/**
 * Create a Date object for a specific date at start or end of day in UTC
 * @param {number} year - Year
 * @param {number} month - Month (0-indexed)
 * @param {number} day - Day
 * @param {boolean} endOfDay - If true, set to 23:59:59.999, otherwise 00:00:00.000
 * @returns {Date} Date object in UTC
 */
const createUTCDate = (year, month, day, endOfDay = false) => {
  if (endOfDay) {
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  }
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
};

/**
 * Calculate date range for a preset (timezone-aware)
 * @param {string} preset - Preset key
 * @param {string} timezone - IANA timezone
 * @returns {{ startDate: Date, endDate: Date }} Date range
 */
const calculateDateRange = (preset, timezone) => {
  // Get current date in the selected timezone
  const { year, month, day, dayOfWeek } = getDateInTimezone(timezone);
  
  console.log(`📅 [calculateDateRange] Calculating '${preset}' range for timezone ${timezone}`);
  console.log(`📅 [calculateDateRange] Current date in TZ: ${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]})`);
  
  let startDate, endDate;

  switch (preset) {
    case 'today':
      startDate = createUTCDate(year, month, day, false);
      endDate = createUTCDate(year, month, day, true);
      break;

    case 'tomorrow':
      startDate = createUTCDate(year, month, day + 1, false);
      endDate = createUTCDate(year, month, day + 1, true);
      break;

    case 'thisWeek': {
      // This Week: Sunday to Saturday of current week
      const startDay = day - dayOfWeek; // Sunday of this week
      const endDay = day + (6 - dayOfWeek); // Saturday of this week
      startDate = createUTCDate(year, month, startDay, false);
      endDate = createUTCDate(year, month, endDay, true);
      console.log(`📅 [calculateDateRange] This Week: startDay=${startDay}, endDay=${endDay}, dayOfWeek=${dayOfWeek}`);
      console.log(`📅 [calculateDateRange] Result: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      break;
    }

    case 'thisMonth': {
      // This Month: 1st to last day of current month
      startDate = createUTCDate(year, month, 1, false);
      // Last day of month = day 0 of next month
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      endDate = createUTCDate(year, month, lastDay, true);
      break;
    }

    case 'nextWeek': {
      // Next Week: Sunday to Saturday of next week
      const daysUntilNextSunday = 7 - dayOfWeek;
      const startDay = day + daysUntilNextSunday;
      const endDay = startDay + 6;
      startDate = createUTCDate(year, month, startDay, false);
      endDate = createUTCDate(year, month, endDay, true);
      break;
    }

    case 'nextMonth': {
      // Next Month: 1st to last day of next month
      startDate = createUTCDate(year, month + 1, 1, false);
      // Last day of next month
      const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
      endDate = createUTCDate(year, month + 1, lastDay, true);
      break;
    }

    case 'week': {
      // Past Week: Sunday to Saturday of previous week
      const daysToLastSaturday = dayOfWeek + 1;
      const endDay = day - daysToLastSaturday; // Last Saturday
      const startDay = endDay - 6; // Sunday before that
      startDate = createUTCDate(year, month, startDay, false);
      endDate = createUTCDate(year, month, endDay, true);
      break;
    }

    case 'month': {
      // Past Month: 1st to last day of previous month
      startDate = createUTCDate(year, month - 1, 1, false);
      // Last day of previous month = day 0 of current month
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      endDate = createUTCDate(year, month - 1, lastDay, true);
      break;
    }

    default:
      return null;
  }

  return { startDate, endDate };
};

/**
 * Normalize date for comparison (removes time component)
 */
const normalizeDate = (date) => {
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Check if two dates represent the same day
 */
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Detect which preset matches the current date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {string} timezone - IANA timezone
 * @returns {string|null} Preset key or null
 */
const detectActivePreset = (startDate, endDate, timezone) => {
  if (!startDate || !endDate) return null;

  // Try each preset and compare date ranges
  for (const category of Object.values(DATE_PRESETS)) {
    for (const preset of category) {
      const range = calculateDateRange(preset.key, timezone);
      if (range) {
        const startMatch = isSameDay(normalizeDate(startDate), normalizeDate(range.startDate));
        const endMatch = isSameDay(normalizeDate(endDate), normalizeDate(range.endDate));
        
        if (startMatch && endMatch) {
          return preset.key;
        }
      }
    }
  }

  return null;
};

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

/**
 * Date Preset Chip - Memoized for performance
 */
const PresetChip = memo(({ preset, isActive, onClick }) => {
  const theme = useTheme();
  
  return (
    <Zoom in timeout={ANIMATION_DURATION.zoom}>
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}>
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </Box>
        }
        size="small"
        onClick={onClick}
        clickable
        sx={{
          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
          fontWeight: isActive ? 700 : 500,
          height: { xs: 36, sm: 32 }, // Mobile: 36px (accessible), Desktop: 32px (compact)
          minHeight: { xs: 36, sm: 32 }, // Ensure minimum touch target
          flex: '0 1 auto', // Flexible width, shrinks if needed
          bgcolor: isActive ? 'primary.main' : 'background.paper',
          color: isActive ? 'primary.contrastText' : 'text.primary',
          border: `1px solid ${isActive ? 'transparent' : theme.palette.divider}`,
          boxShadow: isActive ? theme.shadows[2] : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isActive ? 'scale(1.05)' : 'scale(1)',
          '&:hover': {
            bgcolor: isActive ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08),
            transform: 'scale(1.05)',
            boxShadow: theme.shadows[3],
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '& .MuiChip-label': {
            px: { xs: 1, sm: 1.25 },
            py: { xs: 0.5, sm: 0.25 },
          },
        }}
      />
    </Zoom>
  );
});

PresetChip.displayName = 'PresetChip';

/**
 * Impact Chip - Chip with label below
 * Mobile-first with clean vertical layout
 */
const ImpactChip = memo(({ 
  value, 
  label, 
  checked, 
  onChange, 
  color,
  icon,
  description 
}) => {
  const theme = useTheme();
  
  // Resolve theme color path to actual color value
  const resolveColor = (colorPath) => {
    if (!colorPath) return theme.palette.primary.main;
    
    // If already a hex/rgb color, return as-is
    if (colorPath.startsWith('#') || colorPath.startsWith('rgb')) {
      return colorPath;
    }
    
    // Parse theme path (e.g., 'error.main' -> theme.palette.error.main)
    const parts = colorPath.split('.');
    let resolved = theme.palette;
    
    for (const part of parts) {
      if (resolved && resolved[part] !== undefined) {
        resolved = resolved[part];
      } else {
        return theme.palette.primary.main; // Fallback
      }
    }
    
    return resolved;
  };
  
  const resolvedColor = resolveColor(color);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        cursor: 'pointer',
      }}
      onClick={onChange}
    >
      <Chip
        label={icon}
        variant={checked ? 'filled' : 'outlined'}
        sx={{
          height: { xs: 40, sm: 36 },
          minWidth: { xs: 64, sm: 56 },
          bgcolor: checked ? resolvedColor : 'transparent',
          borderColor: resolvedColor,
          borderWidth: 2,
          color: checked ? 'white' : resolvedColor,
          fontWeight: 700,
          fontSize: { xs: '1rem', sm: '0.875rem' },
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: checked ? resolvedColor : alpha(resolvedColor, 0.1),
            borderColor: resolvedColor,
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '& .MuiChip-label': {
            px: { xs: 2, sm: 1.5 },
            py: { xs: 1, sm: 0.75 },
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          fontSize: { xs: '0.65rem', sm: '0.7rem' },
          fontWeight: checked ? 600 : 500,
          color: checked ? resolvedColor : 'text.secondary',
          textAlign: 'center',
          lineHeight: 1.2,
          transition: 'all 0.2s ease',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
});

ImpactChip.displayName = 'ImpactChip';

/**
 * Filter Checkbox - Memoized for large lists
 */
const FilterCheckbox = memo(({ 
  value, 
  label, 
  checked, 
  onChange, 
  color,
  icon,
  description 
}) => {
  const theme = useTheme();
  
  const checkbox = (
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={checked}
          onChange={onChange}
          sx={{
            color: color || 'primary.main',
            '&.Mui-checked': {
              color: color || 'primary.main',
            },
            transition: 'all 0.2s ease',
          }}
        />
      }
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Chip
              label={icon}
              size="small"
              sx={{
                height: 22,
                minWidth: 32,
                bgcolor: color || 'primary.main',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                '& .MuiChip-label': {
                  px: 0.75,
                  py: 0,
                },
              }}
            />
          )}
          <Typography 
            component="span"
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              fontWeight: checked ? 600 : 400,
              transition: 'font-weight 0.2s ease',
            }}
          >
            {label}
          </Typography>
        </Box>
      }
      sx={{
        m: 0,
        p: 0.5,
        borderRadius: 1,
        transition: 'background-color 0.2s ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    />
  );

  return description ? (
    <MuiTooltip title={description} placement="right" arrow>
      {checkbox}
    </MuiTooltip>
  ) : checkbox;
});

FilterCheckbox.displayName = 'FilterCheckbox';

/**
 * Active Filter Chip - Memoized for filter display
 */
const ActiveFilterChip = memo(({ label, onDelete, color }) => {
  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Chip
        label={label}
        size="small"
        onDelete={onDelete}
        color={color}
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          height: { xs: 22, sm: 24 },
          '& .MuiChip-deleteIcon': {
            fontSize: '1rem',
            '&:hover': {
              color: 'error.main',
            },
          },
          animation: 'slideIn 0.2s ease-out',
          '@keyframes slideIn': {
            from: {
              opacity: 0,
              transform: 'translateX(-10px)',
            },
            to: {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
        }}
      />
    </Fade>
  );
});

ActiveFilterChip.displayName = 'ActiveFilterChip';

/**
 * Loading Skeleton for filter options
 */
const FilterSkeleton = memo(() => (
  <Stack spacing={0.5}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton 
        key={i} 
        variant="rectangular" 
        height={32} 
        sx={{ borderRadius: 1 }} 
        animation="wave"
      />
    ))}
  </Stack>
));

FilterSkeleton.displayName = 'FilterSkeleton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventsFilters2 - Enterprise-grade filter component
 */
export default function EventsFilters2({
  filters,
  onFiltersChange,
  onApply,
  loading = false,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  newsSource = 'mql5', // Default to MQL5 if not provided
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { eventFilters, updateEventFilters } = useSettings();

  // ========== STATE ==========
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [accordionExpanded, setAccordionExpanded] = useState({
    dateRange: true,
    impact: false,
    currencies: false,
  });

  // Local filter state - Start clean (empty state)
  const [localFilters, setLocalFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    currencies: [],
  });
  
  // Track if component has been initialized
  const [initialized, setInitialized] = useState(false);
  
  // Initialize on mount
  useEffect(() => {
    setInitialized(true);
  }, []);

  // ========== EFFECTS ==========

  /**
   * Dynamically recalculate date presets every day or when timezone changes
   * Ensures "Today", "This Week", etc. stay accurate
   */
  useEffect(() => {
    // Create a timer that fires at midnight to recalculate "Today", "This Week", etc.
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      // Recalculate if a preset is active
      const currentPreset = detectActivePreset(localFilters.startDate, localFilters.endDate, timezone);
      if (currentPreset) {
        console.log(`🔄 [EventsFilters2] Recalculating '${currentPreset}' preset at midnight`);
        const range = calculateDateRange(currentPreset, timezone);
        if (range) {
          const newFilters = {
            ...localFilters,
            startDate: range.startDate,
            endDate: range.endDate,
          };
          setLocalFilters(newFilters);
          updateEventFilters(newFilters);
          onFiltersChange(newFilters);
          if (onApply) onApply(newFilters);
        }
      }
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [localFilters, timezone, onFiltersChange, onApply, updateEventFilters]);

  /**
   * Sync localFilters with incoming filters prop (on mount and after reset)
   * This ensures hasChanges doesn't show false positives
   */
  useEffect(() => {
    if (filters) {
      setLocalFilters({
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        impacts: filters.impacts || [],
        currencies: filters.currencies || [],
      });
    }
  }, [filters.startDate, filters.endDate, filters.impacts?.length, filters.currencies?.length]);

  /**
   * Fetch filter options on mount and when newsSource changes
   * Categories and currencies are source-specific
   */
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);

      try {
        // Pass newsSource to service functions for correct subcollection queries
        const [categoriesResult, currenciesResult] = await Promise.allSettled([
          getEventCategories(newsSource),
          getEventCurrencies(newsSource),
        ]);

        if (categoriesResult.status === 'fulfilled' && categoriesResult.value.success) {
          setCategories(categoriesResult.value.data);
          console.log(`📋 [EventsFilters2] Loaded ${categoriesResult.value.data.length} categories from ${newsSource}`);
        } else {
          // Empty array on error - no categories shown if fetch fails
          console.warn(`⚠️ [EventsFilters2] Failed to fetch categories from ${newsSource}`);
          setCategories([]);
        }

        if (currenciesResult.status === 'fulfilled' && currenciesResult.value.success) {
          // Use only Firestore currencies (dynamic based on actual events)
          const firestoreCurrencies = currenciesResult.value.data || [];
          setCurrencies(firestoreCurrencies);
          console.log(`💱 [EventsFilters2] Loaded ${firestoreCurrencies.length} currencies from ${newsSource}`);
        } else {
          // Empty array on error - no currencies shown if fetch fails
          console.warn(`⚠️ [EventsFilters2] Failed to fetch currencies from ${newsSource}`);
          setCurrencies([]);
        }
      } catch (error) {
        console.error(`❌ [EventsFilters2] Error fetching options from ${newsSource}:`, error);
        // Empty array on error
        setCurrencies([]);
        setCategories([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [newsSource]); // Re-fetch when newsSource changes

  // ========== MEMOIZED VALUES ==========

  /**
   * Active preset detection - Use parent filters (applied state) for display
   */
  const activePreset = useMemo(() => {
    const presetKey = detectActivePreset(filters.startDate, filters.endDate, timezone);
    if (!presetKey) return null;

    // Find preset config
    for (const category of Object.values(DATE_PRESETS)) {
      const preset = category.find(p => p.key === presetKey);
      if (preset) return preset;
    }
    return null;
  }, [filters.startDate, filters.endDate, timezone]);

  /**
   * Local preset detection - For showing active state in UI during editing
   */
  const localActivePreset = useMemo(() => {
    const presetKey = detectActivePreset(localFilters.startDate, localFilters.endDate, timezone);
    if (!presetKey) return null;

    // Find preset config
    for (const category of Object.values(DATE_PRESETS)) {
      const preset = category.find(p => p.key === presetKey);
      if (preset) return preset;
    }
    return null;
  }, [localFilters.startDate, localFilters.endDate, timezone]);

  /**
   * Active filter count - Use parent filters (applied state) for display
   * Excludes the default 4-week date range (initial mount state)
   */
  const activeFilterCount = useMemo(() => {
    // Check if current date range is the default (2 weeks before/after today)
    const isDefaultDateRange = (() => {
      if (!filters.startDate || !filters.endDate) return true;
      
      const now = new Date();
      const expectedStart = new Date(now);
      expectedStart.setDate(now.getDate() - 14);
      expectedStart.setHours(0, 0, 0, 0);
      
      const expectedEnd = new Date(now);
      expectedEnd.setDate(now.getDate() + 14);
      expectedEnd.setHours(23, 59, 59, 999);
      
      const actualStart = new Date(filters.startDate);
      actualStart.setHours(0, 0, 0, 0);
      
      const actualEnd = new Date(filters.endDate);
      actualEnd.setHours(23, 59, 59, 999);
      
      // Allow 1 day tolerance for date comparisons
      const startDiff = Math.abs(actualStart - expectedStart) / (1000 * 60 * 60 * 24);
      const endDiff = Math.abs(actualEnd - expectedEnd) / (1000 * 60 * 60 * 24);
      
      return startDiff < 1 && endDiff < 1;
    })();
    
    // Don't count dates if they're the default range
    const dateCount = isDefaultDateRange ? 0 : (activePreset ? 1 : 
      (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0));
    
    return (
      dateCount +
      (filters.impacts?.length || 0) +
      (filters.currencies?.length || 0)
    );
  }, [filters, activePreset]);

  /**
   * Check if local filters differ from parent's filters (unapplied changes)
   * Only show changes if initialized to prevent false positives on mount
   */
  const hasChanges = useMemo(() => {
    if (!initialized) return false; // Never show changes on initial mount
    
    // Compare local filters with incoming filters prop (from parent)
    const parentFilters = filters || {
      startDate: null,
      endDate: null,
      impacts: [],
      eventTypes: [],
      currencies: [],
    };
    
    // Compare dates (convert to ISO strings for comparison)
    const localStartISO = localFilters.startDate?.toISOString() || null;
    const localEndISO = localFilters.endDate?.toISOString() || null;
    const parentStartISO = parentFilters.startDate?.toISOString?.() || parentFilters.startDate || null;
    const parentEndISO = parentFilters.endDate?.toISOString?.() || parentFilters.endDate || null;
    
    if (localStartISO !== parentStartISO || localEndISO !== parentEndISO) {
      return true;
    }
    
    // Compare arrays
    const arraysEqual = (arr1, arr2) => {
      if (!arr1 && !arr2) return true;
      if (!arr1 || !arr2) return false;
      if (arr1.length !== arr2.length) return false;
      return arr1.every(item => arr2.includes(item)) && arr2.every(item => arr1.includes(item));
    };
    
    if (!arraysEqual(localFilters.impacts, parentFilters.impacts)) return true;
    if (!arraysEqual(localFilters.eventTypes, parentFilters.eventTypes)) return true;
    if (!arraysEqual(localFilters.currencies, parentFilters.currencies)) return true;
    
    return false; // No changes detected
  }, [localFilters, filters, initialized]);

  // ========== CALLBACKS ==========

  /**
   * Update filter value
   */
  const handleFilterChange = useCallback((field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Toggle array value (for checkboxes)
   */
  const toggleArrayValue = useCallback((field, value) => {
    setLocalFilters(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      console.log(`🔧 [EventsFilters2] Toggle ${field}:`, {
        value,
        action: currentValues.includes(value) ? 'REMOVE' : 'ADD',
        before: currentValues,
        after: newValues,
      });
      
      return { ...prev, [field]: newValues };
    });
  }, []);

  /**
   * Remove filter value from active filters chip
   * Auto-applies immediately (enterprise UX: removing filters is instant)
   */
  const removeFilterImmediate = useCallback((field, value = null) => {
    const newFilters = { ...localFilters };
    
    if (value === null) {
      // Remove entire field (for date fields)
      newFilters[field] = null;
    } else {
      // Remove specific value from array
      const currentValues = newFilters[field] || [];
      newFilters[field] = currentValues.filter(v => v !== value);
    }
    
    console.log(`🗑️ [EventsFilters2] Remove filter ${field}:`, value, '- auto-applying');
    
    // Update local state
    setLocalFilters(newFilters);
    
    // Auto-apply immediately (removing filters is instant in enterprise UX)
    updateEventFilters(newFilters);
    onFiltersChange(newFilters);
    if (onApply) onApply(newFilters);
  }, [localFilters, onFiltersChange, onApply, updateEventFilters]);

  /**
   * Apply date preset (Quick Select)
   * Updates local state only - requires Apply button
   */
  const applyDatePreset = useCallback((presetKey) => {
    const range = calculateDateRange(presetKey, timezone);
    if (range) {
      const newFilters = {
        ...localFilters,
        startDate: range.startDate,
        endDate: range.endDate,
      };
      
      console.log(`📅 [EventsFilters2] Quick Select '${presetKey}' selected - click Apply to confirm`);
      
      // Update local state only - user must click Apply
      setLocalFilters(newFilters);
    }
  }, [localFilters, onFiltersChange, onApply, updateEventFilters, timezone]);

  /**
   * Apply filters and close panel
   */
  const handleApply = useCallback(() => {
    console.log(`🎯 [EventsFilters2] Applying filters:`, {
      dateRange: {
        start: localFilters.startDate?.toISOString(),
        end: localFilters.endDate?.toISOString(),
      },
      impacts: localFilters.impacts,
      eventTypes: localFilters.eventTypes,
      currencies: localFilters.currencies,
    });

    // Persist to context (localStorage + Firestore)
    updateEventFilters(localFilters);
    
    // Notify parent components
    onFiltersChange(localFilters);
    if (onApply) onApply(localFilters);
    
    setExpanded(false);
  }, [localFilters, onFiltersChange, onApply, updateEventFilters]);

  /**
   * Remove date range chip - Resets to initial mount state (4 weeks around today)
   * Preserves impacts and currencies
   * Auto-applies immediately (removing filters is instant)
   */
  const handleRemoveDateRange = useCallback(() => {
    // Calculate initial mount date range (2 weeks before to 2 weeks after)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 14); // 2 weeks before
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 14); // 2 weeks after
    endDate.setHours(23, 59, 59, 999);
    
    const resetFilters = {
      startDate,
      endDate,
      impacts: localFilters.impacts,
      currencies: localFilters.currencies,
    };

    console.log('🔄 [EventsFilters2] Reset date range only (preserving other filters) - auto-applying');
    
    // Update local state
    setLocalFilters(resetFilters);
    
    // Auto-apply immediately
    updateEventFilters(resetFilters);
    onFiltersChange(resetFilters);
    if (onApply) onApply(resetFilters);
  }, [localFilters.impacts, localFilters.currencies, onFiltersChange, onApply, updateEventFilters]);

  /**
   * Reset all filters - Resets to initial mount state (4 weeks around today)
   */
  const handleReset = useCallback(() => {
    // Calculate initial mount date range (2 weeks before to 2 weeks after)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 14); // 2 weeks before
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 14); // 2 weeks after
    endDate.setHours(23, 59, 59, 999);
    
    const resetFilters = {
      startDate,
      endDate,
      impacts: [],
      currencies: [],
    };

    console.log('🔄 [EventsFilters2] Reset to initial mount state (4 weeks around today)');
    
    // Update local state
    setLocalFilters(resetFilters);
    
    // Persist to context (localStorage + Firestore)
    updateEventFilters(resetFilters);
    
    // Notify parent components
    onFiltersChange(resetFilters);
    if (onApply) onApply(resetFilters);
    
    // Collapse filter section after resetting
    setExpanded(false);
  }, [onFiltersChange, onApply, updateEventFilters]);

  /**
   * Toggle accordion section
   */
  const toggleAccordion = useCallback((section) => {
    setAccordionExpanded(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // ========== RENDER ==========

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* ========== FILTER HEADER ========== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.default, 0.95),
        }}
      >
        <Button
          onClick={() => setExpanded(!expanded)}
          startIcon={<FilterListIcon />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
            minHeight: { xs: 44, sm: 36 }, // Accessible touch target on mobile
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          Filters
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasChanges && !expanded && (
            <Fade in>
              <Chip
                icon={<CheckCircleIcon />}
                label="Changes"
                size="small"
                color="warning"
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            </Fade>
          )}
          
          {activeFilterCount > 0 && (
            <Fade in>
              <Button
                onClick={handleReset}
                startIcon={<RestartAltIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  minHeight: { xs: 36, sm: 32 },
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                Clear All
              </Button>
            </Fade>
          )}
        </Box>
      </Box>

      {/* ========== FILTER PANEL ========== */}
      <Collapse in={expanded} timeout={ANIMATION_DURATION.collapse}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: { xs: 'calc(100vh - 200px)', sm: '60vh' },
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Scrollable Filter Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
              p: { xs: 1.5, sm: 2.5 },
              pb: { xs: '100px', sm: '90px' }, // Space for sticky buttons: xs=48px button+24px padding+1px border+27px extra, sm=40px button+32px padding+1px border+17px extra
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 4,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.5),
                },
              },
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack spacing={2.5} sx={{ width: '100%', maxWidth: '100%' }}>
              {/* ========== DATE RANGE SECTION ========== */}
              <Accordion
                expanded={accordionExpanded.dateRange}
                onChange={() => toggleAccordion('dateRange')}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 48,
                    px: { xs: 1.5, sm: 2 },
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Date Range
                    </Typography>
                    {activePreset && (
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{activePreset.icon}</span>
                            <span>{activePreset.label}</span>
                          </Box>
                        }
                        size="small"
                        color="primary"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5, pb: 2 }}>
                  <Stack spacing={2}>
                    {/* Quick Actions */}
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600}
                        sx={{ mb: 1, display: 'block' }}
                      >
                        Quick Select
                      </Typography>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          flexWrap: 'wrap', 
                          gap: 0.75,
                          width: '100%',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                        }}
                      >
                        {Object.values(DATE_PRESETS).flat().map(preset => (
                          <PresetChip
                            key={preset.key}
                            preset={preset}
                            isActive={localActivePreset?.key === preset.key}
                            onClick={() => applyDatePreset(preset.key)}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Custom Date Range */}
                    <Box sx={{ width: '100%' }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600}
                        sx={{ mb: 1, display: 'block' }}
                      >
                        Custom Range
                      </Typography>
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={1.5}
                        sx={{ width: '100%' }}
                      >
                        <DatePicker
                          label="Start Date"
                          value={localFilters.startDate}
                          onChange={(date) => handleFilterChange('startDate', date)}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                minWidth: 0, // Allow shrinking on mobile
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: 'background.paper',
                                },
                              },
                            },
                          }}
                        />
                        <DatePicker
                          label="End Date"
                          value={localFilters.endDate}
                          onChange={(date) => handleFilterChange('endDate', date)}
                          minDate={localFilters.startDate}
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                minWidth: 0, // Allow shrinking on mobile
                                '& .MuiOutlinedInput-root': {
                                  bgcolor: 'background.paper',
                                },
                              },
                            },
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* ========== IMPACT SECTION ========== */}
              <Accordion
                expanded={accordionExpanded.impact}
                onChange={() => toggleAccordion('impact')}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: alpha(theme.palette.warning.main, 0.03),
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 48,
                    px: { xs: 1.5, sm: 2 },
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Expected Impact
                    </Typography>
                    {localFilters.impacts?.length > 0 && (
                      <Chip
                        label={localFilters.impacts.length}
                        size="small"
                        color="warning"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          minWidth: 24,
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5, pb: 2 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)', // Always 5 columns (one for each impact level)
                      gap: { xs: 1, sm: 1.5 },
                      width: '100%',
                      justifyItems: 'center',
                    }}
                  >
                    {IMPACT_LEVELS.map(({ value, label, color, icon, description }) => (
                      <ImpactChip
                        key={value}
                        value={value}
                        label={label}
                        checked={localFilters.impacts?.includes(value) || false}
                        onChange={() => toggleArrayValue('impacts', value)}
                        color={color}
                        icon={icon}
                        description={description}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* ========== CURRENCIES SECTION ========== */}
              <Accordion
                expanded={accordionExpanded.currencies}
                onChange={() => toggleAccordion('currencies')}
                disableGutters
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: alpha(theme.palette.success.main, 0.03),
                  borderRadius: 1.5,
                  width: '100%',
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 48,
                    px: { xs: 1.5, sm: 2 },
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <AttachMoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Currencies
                    </Typography>
                    {localFilters.currencies?.length > 0 && (
                      <Chip
                        label={localFilters.currencies.length}
                        size="small"
                        color="success"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          minWidth: 24,
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 1.5, pb: 2 }}>
                  {loadingOptions ? (
                    <FilterSkeleton />
                  ) : (
                    <FormGroup>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { 
                            xs: 'repeat(2, 1fr)',  // Mobile: 2 columns
                            sm: 'repeat(3, 1fr)',  // Tablet: 3 columns
                          },
                          gap: 0.5,
                          width: '100%',
                          maxWidth: '100%',
                          overflow: 'hidden',
                        }}
                      >
                        {currencies.map((currency) => {
                          const countryCode = getCurrencyFlag(currency);
                          return (
                            <FilterCheckbox
                              key={currency}
                              value={currency}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  {countryCode && (
                                    <Box
                                      component="span"
                                      className={`fi fi-${countryCode}`}
                                      sx={{
                                        fontSize: 16,
                                        lineHeight: 1,
                                      }}
                                    />
                                  )}
                                  <span>{currency}</span>
                                </Box>
                              }
                              checked={localFilters.currencies?.includes(currency) || false}
                              onChange={() => toggleArrayValue('currencies', currency)}
                            />
                          );
                        })}
                      </Box>
                    </FormGroup>
                  )}
                </AccordionDetails>
              </Accordion>
              </Stack>
            </LocalizationProvider>
          </Box>

          {/* ========== ACTION BUTTONS (STICKY) ========== */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              p: { xs: 1.5, sm: 2 },
              boxShadow: theme.shadows[4],
              zIndex: 1,
            }}
          >
            <Stack 
              direction="row" 
              spacing={1.5}
            >
              <Button
                variant="contained"
                fullWidth
                onClick={handleApply}
                disabled={loading || !hasChanges}
                startIcon={loading ? <CircularProgress size={18} /> : <CheckCircleIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  py: { xs: 1.5, sm: 1.25 }, // Mobile: 48px height, Desktop: 40px
                  minHeight: { xs: 48, sm: 40 }, // Ensure WCAG compliance
                  boxShadow: hasChanges ? theme.shadows[4] : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {loading ? 'Applying...' : hasChanges ? 'Apply Changes' : 'Applied'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading || activeFilterCount === 0}
                startIcon={<RestartAltIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  minWidth: { xs: 90, sm: 100 },
                  py: { xs: 1.5, sm: 1.25 }, // Mobile: 48px height, Desktop: 40px
                  minHeight: { xs: 48, sm: 40 }, // Ensure WCAG compliance
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    borderColor: 'error.main',
                  },
                }}
              >
                Reset
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>

      {/* ========== ACTIVE FILTERS DISPLAY ========== */}
      {activeFilterCount > 0 && !expanded && (
        <Fade in timeout={ANIMATION_DURATION.fade}>
          <Box
            sx={{
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderBottom: 1,
              borderColor: 'divider',
              width: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <Stack 
              direction="row" 
              spacing={0.75} 
              sx={{ 
                flexWrap: 'wrap', 
                gap: 0.75,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography 
                variant="caption" 
                color="text.secondary" 
                fontWeight={700}
                sx={{ mr: 0.5 }}
              >
                Active ({activeFilterCount}):
              </Typography>
              
              {/* Date Range Chip */}
              {activePreset ? (
                <ActiveFilterChip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{activePreset.icon}</span>
                      <span>{activePreset.label}</span>
                    </Box>
                  }
                  onDelete={handleRemoveDateRange}
                  color="primary"
                />
              ) : (
                <>
                  {filters.startDate && (
                    <ActiveFilterChip
                      label={`From: ${filters.startDate.toLocaleDateString()}`}
                      onDelete={() => removeFilterImmediate('startDate')}
                    />
                  )}
                  {filters.endDate && (
                    <ActiveFilterChip
                      label={`To: ${filters.endDate.toLocaleDateString()}`}
                      onDelete={() => removeFilterImmediate('endDate')}
                    />
                  )}
                </>
              )}

              {/* Impact Chips */}
              {filters.impacts?.map((impact) => {
                const impactConfig = IMPACT_LEVELS.find(i => i.value === impact);
                // Resolve theme color path to actual color value
                const getColorValue = (colorPath) => {
                  if (!colorPath) return theme.palette.grey[500];
                  const [category, shade] = colorPath.split('.');
                  return theme.palette[category]?.[shade] || theme.palette.grey[500];
                };
                const impactColor = getColorValue(impactConfig?.color);
                
                return (
                  <Chip
                    key={impact}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip
                          label={impactConfig?.icon}
                          size="small"
                          sx={{
                            height: 18,
                            minWidth: 28,
                            bgcolor: impactConfig?.color || 'grey.500',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            '& .MuiChip-label': {
                              px: 0.5,
                              py: 0,
                            },
                          }}
                        />
                        <span>{impactConfig?.label || impact}</span>
                      </Box>
                    }
                    size="small"
                    onDelete={() => removeFilterImmediate('impacts', impact)}
                    sx={{
                      bgcolor: alpha(impactColor, 0.15),
                      color: impactColor,
                      border: `1px solid ${alpha(impactColor, 0.3)}`,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 22, sm: 24 },
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        fontSize: '1rem',
                        color: alpha(impactColor, 0.7),
                        '&:hover': {
                          color: impactColor,
                        },
                      },
                      animation: 'slideIn 0.2s ease-out',
                      '@keyframes slideIn': {
                        from: {
                          opacity: 0,
                          transform: 'translateX(-10px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                      },
                    }}
                  />
                );
              })}

              {/* Event Type section removed - no longer showing chips */}
              {filters.eventTypes?.length > 0 && (
                <Chip
                  label="Legacy filters cleared"
                  size="small"
                  color="info"
                  sx={{ display: 'none' }} // Hidden - for backward compatibility
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 28, sm: 24 }, // Larger on mobile for better touch
                    minHeight: { xs: 28, sm: 24 },
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setExpanded(true);
                    setAccordionExpanded(prev => ({ ...prev, eventType: true }));
                  }}
                />
              )}

              {/* Currency Chips (show first 3 + count) */}
              {filters.currencies?.slice(0, 3).map((currency) => (
                <ActiveFilterChip
                  key={currency}
                  label={currency}
                  onDelete={() => removeFilterImmediate('currencies', currency)}
                  color="success"
                />
              ))}
              {filters.currencies?.length > 3 && (
                <Chip
                  label={`+${filters.currencies.length - 3} more`}
                  size="small"
                  color="success"
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 28, sm: 24 }, // Larger on mobile for better touch
                    minHeight: { xs: 28, sm: 24 },
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setExpanded(true);
                    setAccordionExpanded(prev => ({ ...prev, currencies: true }));
                  }}
                />
              )}
            </Stack>
          </Box>
        </Fade>
      )}
    </Box>
  );
}
