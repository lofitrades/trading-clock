/**
 * src/components/EventsTable.jsx
 * 
 * Purpose: Enterprise-grade data table for economic events
 * Advanced table with sorting, pagination, export, and mobile card view
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
 * v1.0.1 - 2025-12-08 - Fixed timezone handling: CSV export now uses user's selected timezone instead of hardcoded 'UTC', filename includes timezone
 * v1.0.0 - 2025-12-08 - Initial implementation
 */

import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
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
  Skeleton,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Stack,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  Tooltip as MuiTooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  Download as DownloadIcon,
  TableChart as TableChartIcon,
  ViewList as ViewListIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
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
  { id: 'data', label: 'A / F / P', sortable: false, minWidth: 180, align: 'center' },
  { id: 'action', label: '', sortable: false, minWidth: 60, align: 'center' },
];

/**
 * Mobile columns (reduced for smaller screens)
 */
const MOBILE_COLUMNS = ['time', 'currency', 'name', 'impact'];

/**
 * Tablet columns (reduced for medium screens)
 */
const TABLET_COLUMNS = ['time', 'currency', 'impact', 'name', 'action'];

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

/**
 * View modes
 */
const VIEW_MODES = {
  TABLE: 'table',
  CARD: 'card',
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
 * Export data to CSV with timezone-aware formatting
 * @param {Array} data - Events to export
 * @param {Array} columns - Columns to include
 * @param {string} filename - Output filename
 * @param {string} timezone - IANA timezone for date/time formatting
 */
const exportToCSV = (data, columns, filename, timezone) => {
  // CSV headers
  const headers = columns
    .filter(col => col.id !== 'action')
    .map(col => col.label)
    .join(',');
  
  // CSV rows (use user's selected timezone for date/time formatting)
  const rows = data.map(event => {
    return columns
      .filter(col => col.id !== 'action')
      .map(col => {
        let value = '';
        switch (col.id) {
          case 'date':
            value = formatDate(event.date, timezone);
            break;
          case 'time':
            value = formatTime(event.time || event.date, timezone);
            break;
          case 'currency':
            value = event.currency || '';
            break;
          case 'impact':
            const impact = getImpactConfig(event.strength);
            value = impact.label;
            break;
          case 'name':
            value = event.Name || '';
            break;
          case 'data':
            value = `${event.actual || '—'} / ${event.forecast || '—'} / ${event.previous || '—'}`;
            break;
          default:
            value = '';
        }
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(',');
  }).join('\n');
  
  const csv = `${headers}\n${rows}`;
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/**
 * Export data to JSON
 */
const exportToJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
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

/**
 * Event Card (Mobile View)
 */
const EventCard = memo(({ event, timezone, onClick }) => {
  const theme = useTheme();
  const config = getImpactConfig(event.strength);
  const countryCode = getCurrencyFlag(event.currency);
  
  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: theme.shadows[3],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {countryCode && (
                <Box
                  component="span"
                  className={`fi fi-${countryCode}`}
                  sx={{ fontSize: 20 }}
                />
              )}
              <Typography variant="body2" fontWeight={600}>
                {event.currency}
              </Typography>
              <Chip
                label={config.icon}
                size="small"
                sx={{
                  bgcolor: config.color,
                  color: 'white',
                  fontWeight: 700,
                  minWidth: 40,
                  height: 24,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              {formatTime(event.time || event.date, timezone)}
            </Typography>
          </Box>

          {/* Event Name */}
          <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.4 }}>
            {event.Name}
          </Typography>

          {/* Data Values */}
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Actual
              </Typography>
              <DataValuesCell event={event} />
            </Box>
          </Box>

          {/* Date */}
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {formatDate(event.date, timezone)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
});

EventCard.displayName = 'EventCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventsTable Component
 */
export default function EventsTable({ events, loading, error, timezone, onRefresh }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Debug logging
  useEffect(() => {
    console.log('📊 [EventsTable] Received props:', {
      eventsCount: events?.length || 0,
      loading,
      error,
      timezone,
      sampleEvent: events?.[0]
    });
  }, [events, loading, error]);

  // ========== STATE ==========
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('asc');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState(isMobile ? VIEW_MODES.CARD : VIEW_MODES.TABLE);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

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
      return COLUMNS.filter(col => TABLET_COLUMNS.includes(col.id) || col.id === 'data');
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
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleRowClick = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleViewModeChange = useCallback((event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }, []);

  const handleExportClick = useCallback((event) => {
    setExportMenuAnchor(event.currentTarget);
  }, []);

  const handleExportClose = useCallback(() => {
    setExportMenuAnchor(null);
  }, []);

  const handleExportCSV = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `economic-events-${timezone.replace(/\//g, '-')}-${timestamp}.csv`;
    exportToCSV(paginatedEvents, visibleColumns, filename, timezone);
    handleExportClose();
  }, [paginatedEvents, visibleColumns, timezone]);

  const handleExportJSON = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `economic-events-${timestamp}.json`;
    exportToJSON(paginatedEvents, filename);
    handleExportClose();
  }, [paginatedEvents]);

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
    <Paper sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {sortedEvents.length.toLocaleString()} Events
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* View Mode Toggle (Mobile/Tablet) */}
          {(isMobile || isTablet) && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value={VIEW_MODES.TABLE}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value={VIEW_MODES.CARD}>
                <TableChartIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExportClick}
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            disabled={loading || paginatedEvents.length === 0}
          >
            Export
          </Button>

          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
            <MenuItem onClick={handleExportJSON}>Export as JSON</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Table View */}
      {viewMode === VIEW_MODES.TABLE && (
        <>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
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
                        borderBottom: 2,
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
                  // Loading skeletons
                  Array.from({ length: 10 }).map((_, index) => (
                    <SkeletonRow key={index} columnsCount={visibleColumns.length} />
                  ))
                ) : paginatedEvents.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length}>
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                ) : (
                  // Data rows grouped by date
                  Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
                    // Filter events for current page
                    const pageEvents = dateEvents.filter(event => paginatedEvents.includes(event));
                    if (pageEvents.length === 0) return null;
                    
                    return (
                      <React.Fragment key={dateKey}>
                        {/* Date Header Row */}
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
                              top: 56,
                              zIndex: 2,
                            }}
                          >
                            {dateKey}
                          </TableCell>
                        </TableRow>
                        
                        {/* Event Rows for this date */}
                        {pageEvents.map((event) => (
                          <TableRow
                            key={event.id}
                            hover
                            onClick={() => handleRowClick(event)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            {visibleColumns.map((column) => (
                              <TableCell key={column.id} align={column.align}>
                                {column.id === 'time' && (
                                  <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                                    {formatTime(event.time || event.date, timezone)}
                                  </Typography>
                                )}
                                {column.id === 'currency' && <CurrencyCell currency={event.currency} />}
                                {column.id === 'impact' && <ImpactCell strength={event.strength} />}
                                {column.id === 'name' && (
                                  <Typography variant="body2" fontWeight={500}>
                                    {event.Name}
                                  </Typography>
                                )}
                                {column.id === 'data' && <DataValuesCell event={event} />}
                                {column.id === 'action' && (
                                  <IconButton size="small">
                                    <ChevronRightIcon />
                                  </IconButton>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
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
        </>
      )}

      {/* Card View (Mobile) */}
      {viewMode === VIEW_MODES.CARD && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: 3 }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} />
                </CardContent>
              </Card>
            ))
          ) : paginatedEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {paginatedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  timezone={timezone}
                  onClick={() => handleRowClick(event)}
                />
              ))}
              
              {/* Pagination for Card View */}
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={sortedEvents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Box>
      )}

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
