/**
 * src/components/EventsTable.jsx
 * 
 * Purpose: Enterprise-grade data table for economic events
 * Advanced table with sorting and pagination
 * 
 * Key Features:
 * - MUI Table with custom styling
 * - Columns: Date, Time, Currency (flag), Impact (icons), Event Name, Actual/Forecast/Previous, Action
 * - Sortable columns (click header to sort)
 * - Pagination (10/25/50/100 rows per page)
 * - Export functionality (CSV + JSON)
 * - Mobile card view toggle
 * - Loading skeletons and error states
 * - Opens EventModal on row click
 * - Keyboard navigation
 * - Accessibility compliant
 * 
 * Changelog:
 * v1.7.0 - 2025-12-12 - NEXT handling now highlights all simultaneous next events (same timestamp) instead of a single row.
 * v1.6.0 - 2025-12-12 - Added event notes control with loading state and shared actions column.
 * v1.5.0 - 2025-12-12 - Added favorites heart action with pending/loading states and auth-aware toggles.
 * v1.4.0 - 2025-12-11 - ENHANCEMENT: Added auto-scroll to next event functionality matching timeline behavior. Table now auto-scrolls and navigates to the correct page when drawer opens.
 * v1.3.0 - 2025-12-11 - ENHANCEMENT: Separated Actual, Forecast, and Previous into individual columns for better data visibility.
 * v1.2.4 - 2025-12-11 - ENHANCEMENT: Added floating 'Scroll to Next' button with dynamic up/down arrow. Added localStorage persistence for rowsPerPage selection.
 * v1.2.3 - 2025-12-11 - ENHANCEMENT: Added contextEvents prop for NEXT detection from unfiltered today+future events; NEXT row highlight is now accurate regardless of date filter.
 * v1.2.2 - 2025-12-11 - Gray out past events to mirror timeline past-state styling.
 * v1.2.1 - 2025-12-11 - Highlight next upcoming event row to match timeline UX.
 * v1.2.0 - 2025-12-11 - Removed toolbar title row and export actions for a cleaner embedded view.
 * v1.1.0 - 2025-12-11 - Removed card view and view toggle; always render table view (even on mobile).
 * v1.0.1 - 2025-12-08 - Fixed timezone handling: CSV export now uses user's selected timezone instead of hardcoded 'UTC', filename includes timezone
 * v1.0.0 - 2025-12-08 - Initial implementation
 */

import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Button,
  Chip,
  Typography,
  Menu,
  MenuItem,
  Skeleton,
  Alert,
  AlertTitle,
  alpha,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  CircularProgress,
  Stack,
} from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import {
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  FavoriteBorderOutlined as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  NoteAltOutlined as NoteAltOutlinedIcon,
  NoteAlt as NoteAltIcon,
} from '@mui/icons-material';
import EventModal from './EventModal';
import { formatTime, formatDate } from '../utils/dateUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Table columns configuration
 */
const COLUMNS = [
  { id: 'time', label: 'Time', sortable: true, minWidth: 100, align: 'left' },
  { id: 'currency', label: 'Currency', sortable: true, minWidth: 100, align: 'center' },
  { id: 'impact', label: 'Impact', sortable: true, minWidth: 100, align: 'center' },
  { id: 'name', label: 'Event Name', sortable: true, minWidth: 250, align: 'left' },
  { id: 'actual', label: 'Actual', sortable: false, minWidth: 80, align: 'center' },
  { id: 'forecast', label: 'Forecast', sortable: false, minWidth: 80, align: 'center' },
  { id: 'previous', label: 'Previous', sortable: false, minWidth: 80, align: 'center' },
  { id: 'action', label: '', sortable: false, minWidth: 90, align: 'center' },
];

/**
 * Mobile columns (reduced for smaller screens)
 */
const MOBILE_COLUMNS = ['time', 'currency', 'name', 'impact'];

/**
 * Tablet columns (reduced for medium screens)
 */
const TABLET_COLUMNS = ['time', 'currency', 'impact', 'name', 'actual', 'action'];

/**
 * Currency to country code mapping
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
 * Impact configuration
 */
const IMPACT_CONFIG = {
  strong: { icon: '!!!', color: 'error.main', label: 'High' },
  moderate: { icon: '!!', color: 'warning.main', label: 'Medium' },
  weak: { icon: '!', color: 'info.main', label: 'Low' },
  'non-economic': { icon: '~', color: 'grey.500', label: 'Non-Economic' },
  unknown: { icon: '?', color: 'grey.500', label: 'Unknown' },
};

const SPEECH_TITLE_REGEX = /(speaks|remarks|address|testifies|statement|press conference|hearing|meeting|vote)/i;

const hasMetricValue = (value) => {
  if (value === 0 || value === '0') return true;
  if (value === null || value === undefined) return false;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed === '-') return false;
  return true;
};

const isSpeechLikeEvent = (event) => {
  const category = `${event.category || event.Category || event.type || event.Type || event.eventType || event.EventType || ''}`.toLowerCase();
  const name = `${event.name || event.Name || ''}`;
  const categorySpeech = /speech|statement|address|testimony|press conference|hearing|meeting|vote/.test(category);
  const titleSpeech = SPEECH_TITLE_REGEX.test(name);
  const noMetrics = !hasMetricValue(event.actual) && !hasMetricValue(event.forecast) && !hasMetricValue(event.previous);
  return (categorySpeech || titleSpeech) && noMetrics;
};

const getSpeechSummary = (event) => {
  const name = event.name || event.Name || 'Scheduled remarks';
  const desc = event.description || event.Description || event.summary || event.Summary;
  if (desc) return desc;
  return `Scheduled remarks: ${name}`;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get impact config based on strength value
 */
const getImpactConfig = (strength) => {
  if (!strength) return IMPACT_CONFIG.unknown;
  
  const lower = strength.toLowerCase();
  if (lower.includes('strong') || lower.includes('high')) return IMPACT_CONFIG.strong;
  if (lower.includes('moderate') || lower.includes('medium')) return IMPACT_CONFIG.moderate;
  if (lower.includes('weak') || lower.includes('low')) return IMPACT_CONFIG.weak;
  if (lower.includes('non-economic')) return IMPACT_CONFIG['non-economic'];
  
  return IMPACT_CONFIG.unknown;
};

/**
 * Get country code for currency flag
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
};

/**
 * Convert a date/time value into the specified timezone.
 */
const toTimezoneDate = (value, timezone) => {
  if (!value) return null;
  const dateObj = value instanceof Date ? value : new Date(value);
  const localized = dateObj.toLocaleString('en-US', { timeZone: timezone });
  const parsed = new Date(localized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Determine if an event time has already passed in the target timezone.
 */
const isPastEvent = (date, timezone) => {
  const nowTz = toTimezoneDate(Date.now(), timezone);
  const eventTz = toTimezoneDate(date, timezone);
  if (!nowTz || !eventTz) return false;
  return eventTz.getTime() < nowTz.getTime();
};

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

/**
 * Loading Skeleton Row
 */
const SkeletonRow = memo(({ columnsCount }) => (
  <TableRow>
    {Array.from({ length: columnsCount }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton variant="text" width="100%" height={32} />
      </TableCell>
    ))}
  </TableRow>
));

SkeletonRow.displayName = 'SkeletonRow';

/**
 * Empty State Component
 */
const EmptyState = memo(() => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      px: 3,
    }}
  >
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No Events Found
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 400 }}>
      Try adjusting your filters or date range to see more events.
    </Typography>
  </Box>
));

EmptyState.displayName = 'EmptyState';

/**
 * Currency Flag Cell
 */
const CurrencyCell = memo(({ currency }) => {
  const countryCode = getCurrencyFlag(currency);
  
  if (!countryCode) {
    return (
      <Typography variant="body2" fontWeight={600}>
        {currency}
      </Typography>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        component="span"
        className={`fi fi-${countryCode}`}
        sx={{
          fontSize: 20,
          lineHeight: 1,
        }}
      />
      <Typography variant="body2" fontWeight={600}>
        {currency}
      </Typography>
    </Box>
  );
});

CurrencyCell.displayName = 'CurrencyCell';

/**
 * Impact Cell
 */
const ImpactCell = memo(({ strength }) => {
  const config = getImpactConfig(strength);
  
  return (
    <Chip
      label={config.icon}
      size="small"
      sx={{
        bgcolor: config.color,
        color: 'white',
        fontWeight: 700,
        minWidth: 48,
        fontFamily: 'monospace',
      }}
    />
  );
});

ImpactCell.displayName = 'ImpactCell';

/**
 * Data Values Cell (Actual / Forecast / Previous)
 */
const DataValuesCell = memo(({ event }) => {
  // Check if event is in the future
  const eventDate = new Date(event.date);
  const now = new Date();
  const isFuture = eventDate.getTime() > now.getTime();
  
  const actual = isFuture ? '—' : (event.actual || '—');
  const forecast = event.forecast || '—';
  const previous = event.previous || '—';
  
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
      <Typography
        variant="body2"
        fontWeight={700}
        color={actual !== '—' ? 'primary.main' : 'text.disabled'}
      >
        {actual}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        /
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {forecast}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        /
      </Typography>
      <Typography variant="body2">
        {previous}
      </Typography>
    </Box>
  );
});

DataValuesCell.displayName = 'DataValuesCell';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventsTable Component
 */
export default function EventsTable({
  events,
  contextEvents = null,
  loading,
  error,
  timezone,
  onRefresh,
  autoScrollToNextKey = null,
  isFavoriteEvent = () => false,
  onToggleFavorite = null,
  isFavoritePending = () => false,
  favoritesLoading = false,
  hasEventNotes = () => false,
  onOpenNotes = null,
  isEventNotesLoading = () => false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // ========== STATE ==========
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem('eventsTableRowsPerPage');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('asc');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollToNext, setShowScrollToNext] = useState(false);
  const [favoriteConfirm, setFavoriteConfirm] = useState({ anchor: null, event: null });
  const tableContainerRef = useRef(null);
  const lastScrollTokenRef = useRef(null);

  // ========== SORTING ==========
  const sortedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    
    const comparator = (a, b) => {
      let aValue, bValue;
      
      switch (orderBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'time':
          aValue = new Date(a.time || a.date).getTime();
          bValue = new Date(b.time || b.date).getTime();
          break;
        case 'currency':
          aValue = a.currency || '';
          bValue = b.currency || '';
          break;
        case 'impact':
          const impactOrder = { strong: 3, moderate: 2, weak: 1, unknown: 0 };
          const getImpactValue = (strength) => {
            const lower = (strength || '').toLowerCase();
            if (lower.includes('strong')) return impactOrder.strong;
            if (lower.includes('moderate')) return impactOrder.moderate;
            if (lower.includes('weak')) return impactOrder.weak;
            return impactOrder.unknown;
          };
          aValue = getImpactValue(a.strength);
          bValue = getImpactValue(b.strength);
          break;
        case 'name':
          aValue = a.Name || '';
          bValue = b.Name || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    };
    
    return [...events].sort(comparator);
  }, [events, orderBy, order]);

  /**
   * NEXT event detection using context events (today + future, unfiltered)
   * Falls back to sortedEvents if no contextEvents provided
   * CRITICAL: This ensures NEXT is always based on actual upcoming events,
   * not the user's selected date filter (e.g., "Past Week")
   */
  const nextEventMeta = useMemo(() => {
    const eventsForNext = contextEvents || events;
    if (!eventsForNext || eventsForNext.length === 0) return { ids: new Set(), firstId: null, time: null };

    const nowMs = Date.now();
    let earliest = null;

    eventsForNext.forEach((ev) => {
      const candidate = new Date(ev.time || ev.date).getTime();
      if (!Number.isFinite(candidate)) return;
      if (candidate >= nowMs) {
        if (earliest === null || candidate < earliest) {
          earliest = candidate;
        }
      }
    });

    if (earliest === null) return { ids: new Set(), firstId: null, time: null };

    const nextIdsArray = eventsForNext
      .filter((ev) => {
        const t = new Date(ev.time || ev.date).getTime();
        return Number.isFinite(t) && t === earliest;
      })
      .map((ev) => ev.id)
      .filter(Boolean);

    const ids = new Set(nextIdsArray);
    const firstId = nextIdsArray[0] || null;
    return { ids, firstId, time: earliest };
  }, [contextEvents, events]);

  // ========== AUTO SCROLL LOGIC ==========
  const targetToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object') {
      const { eventId, ts } = autoScrollToNextKey;
      if (eventId) return `${eventId}-${ts ?? 'na'}`;
    }
    return null;
  }, [autoScrollToNextKey]);

  const targetIdFromToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object' && autoScrollToNextKey.eventId) return autoScrollToNextKey.eventId;
    return null;
  }, [autoScrollToNextKey]);

  const targetIndex = useMemo(() => {
    if (!targetIdFromToken) return -1;
    return sortedEvents.findIndex((evt) => evt.id === targetIdFromToken);
  }, [sortedEvents, targetIdFromToken]);

  useEffect(() => {
    if (!nextEventMeta.time) return undefined;
    const id = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nextEventMeta.time]);

  /**
   * Track scroll position for floating 'Scroll to Next' button
   * Enterprise pattern: Show/hide based on scroll proximity to next event row
   * CRITICAL: Only show if next event is actually in the current paginated view
   */
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      setScrollPosition(container.scrollTop);
      
      // Show button if there's a next event and user is not already near it
      if (nextEventMeta.firstId) {
        // CRITICAL: Check if next event is in the current paginated rows
        const paginatedEvents = sortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        const isNextInPaginatedView = paginatedEvents.some((evt) => nextEventMeta.ids.has(evt.id));
        
        if (!isNextInPaginatedView) {
          setShowScrollToNext(false);
          return;
        }
        
        const nextRow = document.querySelector(`[data-event-id="${nextEventMeta.firstId}"]`);
        
        if (nextRow) {
          const containerRect = container.getBoundingClientRect();
          const rowRect = nextRow.getBoundingClientRect();
          const rowTop = rowRect.top - containerRect.top + container.scrollTop;
          const viewportCenter = container.scrollTop + containerRect.height / 2;
          const distanceFromCenter = Math.abs(rowTop - viewportCenter);
          
          // Show button if next event is more than 200px away from viewport center
          setShowScrollToNext(distanceFromCenter > 200);
        } else {
          setShowScrollToNext(false);
        }
      } else {
        setShowScrollToNext(false);
      }
    };

    handleScroll(); // Initial check
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [nextEventMeta.firstId, nextEventMeta.ids, page, rowsPerPage, sortedEvents]);

  /**
   * Reset scroll token when autoScrollToNextKey changes
   */
  useEffect(() => {
    lastScrollTokenRef.current = null;
  }, [autoScrollToNextKey]);

  /**
   * Auto-scroll to specific event when requested (via autoScrollToNextKey)
   * Enterprise pattern: Smooth scroll with page navigation if needed
   */
  useEffect(() => {
    if (!targetToken || !targetIdFromToken) return;
    if (lastScrollTokenRef.current === targetToken) return;

    const targetEvent = sortedEvents.find((evt) => evt.id === targetIdFromToken);
    if (!targetEvent) return;

    // Find which page the target event is on
    const eventIndex = sortedEvents.indexOf(targetEvent);
    const targetPage = Math.floor(eventIndex / rowsPerPage);

    // Navigate to the correct page if needed
    if (targetPage !== page) {
      setPage(targetPage);
    }

    // Scroll to the target row after DOM update
    const scrollToTarget = () => {
      const targetRow = document.querySelector(`[data-event-id="${targetIdFromToken}"]`);
      
      if (targetRow && tableContainerRef.current) {
        const container = tableContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const rowRect = targetRow.getBoundingClientRect();
        const rowTop = rowRect.top - containerRect.top + container.scrollTop;
        const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);
        
        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        lastScrollTokenRef.current = targetToken;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToTarget);
    });
  }, [targetToken, targetIdFromToken, sortedEvents, page, rowsPerPage]);

  /**
   * Fallback: auto-scroll to next event when no explicit target is provided
   */
  useEffect(() => {
    if (loading) return;
    if (targetToken) return; // explicit target handled above
    if (lastScrollTokenRef.current === 'next-default') return;

    if (nextEventMeta.firstId) {
      const nextRow = document.querySelector(`[data-event-id="${nextEventMeta.firstId}"]`);
      
      if (nextRow && tableContainerRef.current) {
        const container = tableContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const rowRect = nextRow.getBoundingClientRect();
        const rowTop = rowRect.top - containerRect.top + container.scrollTop;
        const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);
        
        container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        lastScrollTokenRef.current = 'next-default';
      }
    }
  }, [nextEventMeta.firstId, targetToken, loading]);

  const nextCountdownLabel = useMemo(() => {
    if (!nextEventMeta.time) return null;
    const diff = Math.max(0, nextEventMeta.time - countdownNow);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }, [countdownNow, nextEventMeta.time]);

  /**
   * Group events by date for table display
   */
  const groupedEvents = useMemo(() => {
    if (!sortedEvents || sortedEvents.length === 0) return {};
    
    const groups = {};
    sortedEvents.forEach(event => {
      const dateKey = formatDate(event.date, timezone);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return groups;
  }, [sortedEvents, timezone]);

  // ========== PAGINATION ==========
  const paginatedEvents = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedEvents.slice(start, end);
  }, [sortedEvents, page, rowsPerPage]);

  // ========== COLUMNS VISIBILITY ==========
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      return COLUMNS.filter(col => MOBILE_COLUMNS.includes(col.id) || col.id === 'action');
    }
    if (isTablet) {
      return COLUMNS.filter(col => TABLET_COLUMNS.includes(col.id));
    }
    return COLUMNS;
  }, [isMobile, isTablet]);

  // ========== HANDLERS ==========
  const handleSort = useCallback((columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  }, [orderBy, order]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    localStorage.setItem('eventsTableRowsPerPage', newRowsPerPage.toString());
    setPage(0);
  }, []);

  const handleRowClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleOpenNotes = useCallback((event, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (onOpenNotes) {
      onOpenNotes(event);
    }
  }, [onOpenNotes]);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleFavoriteToggle = useCallback((event, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!onToggleFavorite) return;
    if (favoritesLoading || isFavoritePending(event)) return;

    if (isFavoriteEvent(event)) {
      setFavoriteConfirm({ anchor: e?.currentTarget || null, event });
      return;
    }

    onToggleFavorite(event);
  }, [favoritesLoading, isFavoriteEvent, isFavoritePending, onToggleFavorite]);

  const handleFavoriteRemove = useCallback(() => {
    if (favoriteConfirm.event && onToggleFavorite) {
      onToggleFavorite(favoriteConfirm.event);
    }
    setFavoriteConfirm({ anchor: null, event: null });
  }, [favoriteConfirm, onToggleFavorite]);

  const handleFavoriteConfirmClose = useCallback(() => {
    setFavoriteConfirm({ anchor: null, event: null });
  }, []);

  /**
   * Scroll to next event row
   * Enterprise UX: Smooth scroll with center alignment for optimal viewing
   */
  const handleScrollToNext = useCallback(() => {
    if (!nextEventMeta.firstId) return;
    
    const nextRow = document.querySelector(`[data-event-id="${nextEventMeta.firstId}"]`);
    
    if (nextRow && tableContainerRef.current) {
      const container = tableContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const rowRect = nextRow.getBoundingClientRect();
      const rowTop = rowRect.top - containerRect.top + container.scrollTop;
      const scrollTo = rowTop - (containerRect.height / 2) + (rowRect.height / 2);
      
      container.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [nextEventMeta.firstId]);

  // ========== RENDER ==========

  // Error state
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button
          onClick={onRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <TableContainer ref={tableContainerRef} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    bgcolor: 'background.paper',
                    fontWeight: 700,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <SkeletonRow key={index} columnsCount={visibleColumns.length} />
              ))
            ) : paginatedEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
                const pageEvents = dateEvents.filter(event => paginatedEvents.includes(event));
                if (pageEvents.length === 0) return null;
                
                return (
                  <React.Fragment key={dateKey}>
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          py: 1,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        {dateKey}
                      </TableCell>
                    </TableRow>
                    
                    {pageEvents.map((event) => (
                      <TableRow
                        key={event.id}
                        data-event-id={event.id}
                        hover
                        onClick={() => handleRowClick(event)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: nextEventMeta.ids.has(event.id)
                            ? alpha(theme.palette.primary.main, 0.06)
                            : isPastEvent(event.time || event.date, timezone)
                              ? '#f5f5f5'
                              : 'transparent',
                          color: isPastEvent(event.time || event.date, timezone) ? '#424242' : 'inherit',
                          borderLeft: nextEventMeta.ids.has(event.id) ? `3px solid ${theme.palette.primary.main}` : 'none',
                          '& td, & th, & span, & p': {
                            color: 'inherit',
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        {(() => {
                            const speechNoMetrics = isSpeechLikeEvent(event);
                            const speechSummary = speechNoMetrics ? getSpeechSummary(event) : null;
                            const metricColumnsInView = visibleColumns.filter((c) => ['actual', 'forecast', 'previous'].includes(c.id)).map((c) => c.id);

                            return visibleColumns.map((column) => {
                              // Check if event is in the future for data values
                              const eventDate = new Date(event.date);
                              const now = new Date();
                              const isFuture = eventDate.getTime() > now.getTime();

                              // Merge metric columns into a single cell when speech has no data
                              if (speechNoMetrics && metricColumnsInView.length > 0) {
                                if (column.id === 'actual') {
                                  return (
                                    <TableCell key={column.id} align="left" colSpan={metricColumnsInView.length}>
                                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        {speechSummary}
                                      </Typography>
                                    </TableCell>
                                  );
                                }
                                if (['forecast', 'previous'].includes(column.id)) {
                                  return null;
                                }
                              }

                              // Mobile/tablet fallback: add speech summary under name when metric columns are hidden
                              const shouldShowInlineSpeech = speechNoMetrics && metricColumnsInView.length === 0 && column.id === 'name';

                              return (
                                <TableCell key={column.id} align={column.align}>
                                  {column.id === 'time' && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                        {formatTime(event.time || event.date, timezone)}
                                      </Typography>
                                      {nextEventMeta.ids.has(event.id) && (
                                        <Chip
                                          label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <AccessTimeIcon sx={{ fontSize: 16 }} />
                                              <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                                {nextCountdownLabel || 'Next'}
                                              </Typography>
                                            </Box>
                                          }
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          sx={{ height: 24, fontWeight: 700 }}
                                        />
                                      )}
                                    </Box>
                                  )}
                                  {column.id === 'currency' && <CurrencyCell currency={event.currency} />}
                                  {column.id === 'impact' && <ImpactCell strength={event.strength} />}
                                  {column.id === 'name' && (
                                    <Typography variant="body2" fontWeight={500}>
                                      {event.Name}
                                    </Typography>
                                  )}
                                  {shouldShowInlineSpeech && speechSummary && (
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                      {speechSummary}
                                    </Typography>
                                  )}
                                  {column.id === 'actual' && !speechNoMetrics && (
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                      color={!isFuture && hasMetricValue(event.actual) ? 'primary.main' : 'text.disabled'}
                                    >
                                      {isFuture ? '—' : (hasMetricValue(event.actual) ? event.actual : '—')}
                                    </Typography>
                                  )}
                                  {column.id === 'forecast' && !speechNoMetrics && (
                                    <Typography variant="body2" fontWeight={600}>
                                      {hasMetricValue(event.forecast) ? event.forecast : '—'}
                                    </Typography>
                                  )}
                                  {column.id === 'previous' && !speechNoMetrics && (
                                    <Typography variant="body2">
                                      {hasMetricValue(event.previous) ? event.previous : '—'}
                                    </Typography>
                                  )}
                                  {column.id === 'action' && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                      <MuiTooltip
                                        title={isEventNotesLoading(event) ? 'Loading notes...' : (hasEventNotes(event) ? 'View notes' : 'Add note')}
                                        arrow
                                        placement="top"
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleOpenNotes(event, e)}
                                            disabled={isEventNotesLoading(event)}
                                            sx={{
                                              color: hasEventNotes(event) ? 'primary.main' : 'text.secondary',
                                              '&:hover': {
                                                color: 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                              },
                                              '&.Mui-disabled': {
                                                color: 'text.disabled',
                                              },
                                            }}
                                          >
                                            {isEventNotesLoading(event) ? (
                                              <CircularProgress size={18} thickness={5} />
                                            ) : hasEventNotes(event) ? (
                                              <NoteAltIcon fontSize="small" />
                                            ) : (
                                              <NoteAltOutlinedIcon fontSize="small" />
                                            )}
                                          </IconButton>
                                        </span>
                                      </MuiTooltip>

                                      <MuiTooltip
                                        title={favoritesLoading ? 'Loading favorites...' : (isFavoriteEvent(event) ? 'Remove from favorites' : 'Save to favorites')}
                                        arrow
                                        placement="top"
                                      >
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleFavoriteToggle(event, e)}
                                            disabled={favoritesLoading || isFavoritePending(event)}
                                            sx={{
                                              color: isFavoriteEvent(event) ? 'error.main' : 'text.secondary',
                                              '&:hover': {
                                                color: isFavoriteEvent(event) ? 'error.dark' : 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                              },
                                              '&.Mui-disabled': {
                                                color: 'text.disabled',
                                              },
                                            }}
                                          >
                                            {isFavoritePending(event) ? (
                                              <CircularProgress size={18} thickness={5} />
                                            ) : isFavoriteEvent(event) ? (
                                              <FavoriteIcon fontSize="small" />
                                            ) : (
                                              <FavoriteBorderIcon fontSize="small" />
                                            )}
                                          </IconButton>
                                        </span>
                                      </MuiTooltip>
                                    </Stack>
                                  )}
                                </TableCell>
                              );
                            });
                          })()}
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!loading && paginatedEvents.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={sortedEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      <Menu
        anchorEl={favoriteConfirm.anchor}
        open={Boolean(favoriteConfirm.anchor)}
        onClose={handleFavoriteConfirmClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        <MenuItem onClick={handleFavoriteRemove} sx={{ fontWeight: 700, color: 'error.main' }}>
          Remove favorite
        </MenuItem>
        <MenuItem onClick={handleFavoriteConfirmClose}>Cancel</MenuItem>
      </Menu>

      {/* Floating Scroll to Next Button */}
      {showScrollToNext && nextEventMeta.firstId && (() => {
        const container = tableContainerRef.current;
        const nextRow = container && document.querySelector(`[data-event-id="${nextEventMeta.firstId}"]`);
        
        let isNextAbove = false;
        if (container && nextRow) {
          const containerRect = container.getBoundingClientRect();
          const rowRect = nextRow.getBoundingClientRect();
          const rowTop = rowRect.top - containerRect.top + container.scrollTop;
          const viewportCenter = container.scrollTop + containerRect.height / 2;
          isNextAbove = rowTop < viewportCenter;
        }

        return (
          <Zoom in timeout={300}>
            <Fab
              color="primary"
              size="medium"
              onClick={handleScrollToNext}
              sx={{
                position: 'absolute',
                bottom: { xs: 72, sm: 80 },
                right: { xs: 16, sm: 24 },
                zIndex: 1000,
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 8,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <MuiTooltip 
                title={`Scroll to Next Event ${isNextAbove ? '(Above)' : '(Below)'}`} 
                arrow 
                placement="left"
              >
                {isNextAbove ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 28 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 28 }} />
                )}
              </MuiTooltip>
            </Fab>
          </Zoom>
        );
      })()}

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          open={Boolean(selectedEvent)}
          onClose={handleCloseModal}
          event={selectedEvent}
          timezone={timezone}
        />
      )}
    </Paper>
  );
}
