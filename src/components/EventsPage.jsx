/**
 * src/components/EventsPage.jsx
 * 
 * Purpose: Main events page with tabbed interface for Table and Timeline views
 * Enterprise-grade data table with advanced filtering, sorting, pagination, and export
 * 
 * Key Features:
 * - Tabbed interface (Table view / Timeline view)
 * - Integrated EventsFilters2 for advanced filtering
 * - Smart data loading (2 weeks on mount, expand based on filters)
 * - 1-year max date range validation
 * - Export functionality (CSV + JSON)
 * - Mobile responsive with card view toggle
 * - URL parameter sync for shareable links
 * - Keyboard navigation and accessibility
 * 
 * Changelog:
 * v1.2.7 - 2025-12-09 - Filters in compact mode now occupy full viewport height when expanded for maximum usability
 * v1.2.6 - 2025-12-09 - Remove unnecessary filter scrolling on large screens; keep sticky clamp only on smaller viewports
 * v1.2.5 - 2025-12-09 - Header and tabs now scroll with the page; only filters stay fixed in compact mode
 * v1.2.4 - 2025-12-09 - Sticky filters now span full viewport width and pin to the top in compact mode
 * v1.2.3 - 2025-12-09 - Added autoScrollToNextKey prop to allow drawer to auto-scroll timeline to next event
 * v1.2.2 - 2025-12-09 - Header event count now reflects visible timeline items (pagination aware via onVisibleCountChange)
 * v1.2.1 - 2025-12-09 - Added hideBackButton option for embedded/full-width drawer usage
 * v1.2.0 - 2025-12-09 - Moved sync controls to /events header (initial sync + multi-source calendar) and kept drawer timeline-only
 * v1.1.1 - 2025-12-09 - Embedded drawer shows timeline only (no tabs/table) to maximize vertical space
 * v1.1.0 - 2025-12-08 - Added embedded mode: forwardRef for refresh control, skip URL updates, hide header, adjust container styling for drawer integration
 * v1.0.2 - 2025-12-08 - Added comprehensive source-tracking logging to fetchEvents, handleRefresh, and newsSource useEffect for better debugging
 * v1.0.1 - 2025-12-08 - Fixed initial date range: always use fresh Date() dynamically, added current date logging for debugging
 * v1.0.0 - 2025-12-08 - Initial implementation
 */

import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Button,
  Tooltip as MuiTooltip,
  Alert,
  AlertTitle,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SyncIcon from '@mui/icons-material/Sync';
import EventsTable from './EventsTable';
import EventsTimeline2 from './EventsTimeline2';
import EventsFilters2 from './EventsFilters2';
import ConfirmModal from './ConfirmModal';
import SyncCalendarModal from './SyncCalendarModal';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByDateRange } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';

// ============================================================================
// CONSTANTS
// ============================================================================

const TAB_VALUES = {
  TABLE: 'table',
  TIMELINE: 'timeline',
};

const MAX_DATE_RANGE_DAYS = 365; // 1 year maximum

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventsPage Component
 * Main page for viewing and managing economic events
 * Can be standalone (/events route) or embedded in drawer
 */
const EventsPage = React.forwardRef(({ embedded = false, onEventsUpdate, hideBackButton = false, autoScrollToNextKey = null, compactMode = false }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { eventFilters, newsSource, selectedTimezone } = useSettings();
  const { user } = useAuth();

  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState(
    searchParams.get('view') || TAB_VALUES.TIMELINE
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showInitialSyncConfirm, setShowInitialSyncConfirm] = useState(false);

  // Filter state - Initialize from SettingsContext or URL params
  const [filters, setFilters] = useState(() => {
    // Try to load from URL params first, then fall back to SettingsContext
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    return {
      startDate: startDateParam ? new Date(startDateParam) : (eventFilters.startDate || null),
      endDate: endDateParam ? new Date(endDateParam) : (eventFilters.endDate || null),
      impacts: eventFilters.impacts || [],
      eventTypes: eventFilters.eventTypes || [],
      currencies: eventFilters.currencies || [],
    };
  });

  // ========== EFFECTS ==========

  /**
   * Sync active tab with URL
   */
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && [TAB_VALUES.TABLE, TAB_VALUES.TIMELINE].includes(viewParam)) {
      setActiveTab(viewParam);
    }
  }, [searchParams]);

  /**
   * Initial data load - 2 weeks on mount (matches cache: 14d back + 8d forward for optimal performance)
   * Cache pre-loads this range, so queries will be instant from localStorage
   */
  useEffect(() => {
    if (!filters.startDate || !filters.endDate) {
      // Set default range matching cache optimization (14d back + 8d forward)
      // IMPORTANT: Always use fresh Date() to get current date
      const now = new Date(); // Fresh current date
      
      const startDate = new Date(now.getTime()); // Clone to avoid mutation
      startDate.setDate(startDate.getDate() - 14); // 14 days back (matches cache)
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now.getTime()); // Clone to avoid mutation
      endDate.setDate(endDate.getDate() + 8); // 8 days forward (matches cache)
      endDate.setHours(23, 59, 59, 999);
      
      const newFilters = {
        ...filters,
        startDate,
        endDate,
      };
      setFilters(newFilters);
      // Fetch with new filters immediately
      fetchEvents(newFilters);
    } else {
      // Load data with current filters
      fetchEvents();
    }
  }, []); // Run only on mount

  /**
   * Fetch events when news source changes
   * Cache is source-isolated, so switching loads from new source's cache instantly
   */
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchEvents();
    }
  }, [newsSource]); // Only depend on newsSource

  // ========== HANDLERS ==========

  /**
   * Fetch events with current filters
   */
  const fetchEvents = useCallback(async (filtersToUse = null) => {
    const activeFilters = filtersToUse || filters;
    
    // Validate date range
    if (!activeFilters.startDate || !activeFilters.endDate) {
      setLoading(false);
      setError('Please select a date range to view events.');
      return;
    }

    // Validate max range (1 year)
    const daysDiff = Math.ceil(
      (activeFilters.endDate - activeFilters.startDate) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      setError(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days (1 year). Current range: ${daysDiff} days.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getEventsByDateRange(
        activeFilters.startDate,
        activeFilters.endDate,
        {
          source: newsSource,
          impacts: activeFilters.impacts,
          eventTypes: activeFilters.eventTypes,
          currencies: activeFilters.currencies,
        }
      );

      if (result.success) {
        // Service already returns formatted events with both lowercase and PascalCase fields
        // Just sort them by time
        const sortedEvents = sortEventsByTime(result.data);
        
        const updatedTime = new Date();
        setEvents(sortedEvents);
        setLastUpdated(updatedTime);
        setVisibleCount(sortedEvents.length); // Prime count until timeline reports visible slice
        
        // Notify parent (for drawer integration)
        if (onEventsUpdate) {
          onEventsUpdate(sortedEvents.length, updatedTime);
        }
      } else {
        console.error('❌ [EventsPage] Failed to load events:', result.error);
        setError(result.error || 'Failed to load events');
        setEvents([]);
      }
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError(err.message || 'An unexpected error occurred');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, newsSource]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Update URL params for shareable links (skip when embedded)
    if (!embedded) {
      const params = new URLSearchParams(searchParams);
      if (newFilters.startDate) {
        params.set('startDate', newFilters.startDate.toISOString());
      }
      if (newFilters.endDate) {
        params.set('endDate', newFilters.endDate.toISOString());
      }
      setSearchParams(params, { replace: true });
    }
  }, [embedded, searchParams, setSearchParams]);

  /**
   * Handle filter apply
   */
  const handleFiltersApply = useCallback((appliedFilters) => {
    fetchEvents(appliedFilters);
  }, [fetchEvents]);

  /**
   * Handle manual refresh - force cache invalidation and refetch
   */
  const handleRefresh = useCallback(async () => {
    // Invalidate cache to force fresh data
    const { invalidateCache } = await import('../services/eventsCache');
    invalidateCache(newsSource);
    // Refetch events
    fetchEvents();
  }, [newsSource, fetchEvents]);

  /**
   * Track visible count from timeline (pagination-aware)
   */
  const handleVisibleCountChange = useCallback((count) => {
    setVisibleCount(count);
    if (onEventsUpdate) {
      onEventsUpdate(count, lastUpdated || new Date());
    }
  }, [onEventsUpdate, lastUpdated]);

  /**
   * Multi-source sync (calendar) via modal
   */
  const handleMultiSourceSync = useCallback(async (selectedSources) => {
    setSyncing(true);
    try {
      const { triggerManualSync } = await import('../services/economicEventsService');
      const result = await triggerManualSync({
        sources: selectedSources,
        dryRun: false,
      });

      if (result.success) {
        const totalRecords = result.data.totalRecordsUpserted || 0;
        setSyncSuccess(
          `Synced ${totalRecords.toLocaleString()} events from ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}!`
        );
        // Refresh data after sync
        fetchEvents();
        setTimeout(() => setSyncSuccess(null), 5000);
      }

      return result;
    } finally {
      setSyncing(false);
    }
  }, [fetchEvents]);

  /**
   * Initial historical sync (2 years back)
   */
  const handleInitialSync = useCallback(async () => {
    setShowInitialSyncConfirm(false);
    setSyncing(true);
    setSyncSuccess(null);

    try {
      const response = await fetch(
        'https://us-central1-time-2-trade-app.cloudfunctions.net/syncHistoricalEvents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sources: ['mql5', 'forex-factory', 'fxstreet'],
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        const totalRecords = result.totalRecordsUpserted || 0;
        const sourcesCount = result.totalSources || 0;
        setSyncSuccess(
          `Initial sync complete! Loaded ${totalRecords.toLocaleString()} historical events from ${sourcesCount} sources (2 years back to today).`
        );
        fetchEvents();
        setTimeout(() => setSyncSuccess(null), 10000);
      } else {
        setSyncSuccess(`Error: ${result.error || 'Initial sync failed'}`);
        setTimeout(() => setSyncSuccess(null), 5000);
      }
    } catch (error) {
      setSyncSuccess('Failed to connect to sync service. Please try again.');
      setTimeout(() => setSyncSuccess(null), 5000);
    }

    setSyncing(false);
  }, [fetchEvents]);

  // Expose handleRefresh to parent via ref
  useImperativeHandle(ref, () => ({
    handleRefresh,
  }), [handleRefresh]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    
    // Update URL (skip when embedded)
    if (!embedded) {
      const params = new URLSearchParams(searchParams);
      params.set('view', newValue);
      setSearchParams(params, { replace: true });
    }
  }, [embedded, searchParams, setSearchParams]);

  /**
   * Handle back navigation
   */
  const handleBackClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ========== RENDER ==========

  // Embedded drawer: force timeline view to reclaim vertical space
  const currentTab = embedded ? TAB_VALUES.TIMELINE : activeTab;
  const displayEventCount = currentTab === TAB_VALUES.TIMELINE
    ? (visibleCount || events.length)
    : events.length;
  const headerPaddingY = compactMode ? { xs: 1.25, sm: 1.75 } : { xs: 2, sm: 3 };
  const headerStickySx = {};
  const compactHeaderHeightPx = 72;
  const filtersStickyTop = compactMode ? 0 : 'auto';
  const tabsStickyTop = 'auto';
  const filtersMaxHeight = compactMode ? '100vh' : 'none';
  const filtersOverflow = compactMode ? 'auto' : 'visible';

  return (
    <Box
      sx={{
        minHeight: embedded ? 'auto' : '100vh',
        height: embedded ? '100%' : 'auto',
        bgcolor: 'background.default',
        pt: embedded ? { xs: 1.5, sm: 2 } : 0,
        pb: embedded ? 0 : 4,
        display: embedded ? 'flex' : 'block',
        flexDirection: embedded ? 'column' : 'initial',
        overflow: embedded ? 'hidden' : 'visible',
      }}
    >
      {/* Header - Only show when not embedded */}
      {!embedded && (
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0,
            borderBottom: `4px solid ${theme.palette.primary.dark}`,
            ...headerStickySx,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, py: headerPaddingY }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 1.5,
                  flexWrap: 'wrap',
                }}
              >
                {/* Back Button */}
                {!hideBackButton && (
                  <MuiTooltip title="Back to Clock" placement="bottom">
                    <IconButton
                      onClick={handleBackClick}
                      sx={{
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: alpha('#fff', 0.1),
                        },
                      }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  </MuiTooltip>
                )}

                {/* Title + Meta */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: compactMode ? { xs: '1.35rem', sm: '1.6rem' } : { xs: '1.6rem', sm: '2rem' },
                      letterSpacing: 0.2,
                    }}
                  >
                    Economic Events
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                    {!loading && displayEventCount > 0 && (
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.05rem' } }}
                      >
                        {displayEventCount.toLocaleString()} Events
                      </Typography>
                    )}
                    {lastUpdated && (
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.9,
                          fontSize: compactMode ? { xs: '0.75rem', sm: '0.82rem' } : { xs: '0.78rem', sm: '0.85rem' },
                        }}
                      >
                        Updated: {lastUpdated.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Actions */}
                {!embedded && user && (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1,
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, auto)' },
                      justifyContent: { xs: 'stretch', sm: 'flex-end' },
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    <Button
                      variant="contained"
                      color="warning"
                      size="medium"
                      startIcon={
                        <SyncIcon
                          sx={{
                            animation: syncing ? 'spin 1s linear infinite' : 'none',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' },
                            },
                          }}
                        />
                      }
                      disabled={syncing}
                      onClick={() => setShowInitialSyncConfirm(true)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: compactMode ? { xs: '0.85rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '0.95rem' },
                        py: compactMode ? { xs: 0.85, sm: 0.85 } : { xs: 1, sm: 0.9 },
                        px: compactMode ? { xs: 2.1, sm: 2.6 } : { xs: 2.5, sm: 3 },
                        width: '100%',
                        boxShadow: theme.shadows[4],
                      }}
                    >
                      Initial Sync
                    </Button>

                    <Button
                      variant="outlined"
                      color="inherit"
                      size="medium"
                      startIcon={
                        <SyncIcon
                          sx={{
                            animation: syncing ? 'spin 1s linear infinite' : 'none',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' },
                            },
                          }}
                        />
                      }
                      disabled={syncing}
                      onClick={() => setShowSyncModal(true)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: compactMode ? { xs: '0.85rem', sm: '0.9rem' } : { xs: '0.9rem', sm: '0.95rem' },
                        py: compactMode ? { xs: 0.85, sm: 0.85 } : { xs: 1, sm: 0.9 },
                        px: compactMode ? { xs: 2.1, sm: 2.6 } : { xs: 2.5, sm: 3 },
                        width: '100%',
                        borderWidth: 2,
                        color: 'primary.contrastText',
                        borderColor: 'primary.contrastText',
                        '&:hover': {
                          borderColor: 'primary.contrastText',
                          bgcolor: alpha('#ffffff', 0.12),
                        },
                      }}
                    >
                      Sync Calendar
                    </Button>
                  </Box>
                )}
              </Box>

              {!embedded && user && syncSuccess && (
                <Alert
                  severity={syncSuccess.startsWith('Error') ? 'error' : 'success'}
                  sx={{
                    bgcolor: alpha('#fff', 0.1),
                    color: 'primary.contrastText',
                    borderColor: alpha('#fff', 0.2),
                    '.MuiAlert-icon': { color: 'inherit' },
                  }}
                >
                  <AlertTitle>{syncSuccess.startsWith('Error') ? 'Sync Error' : 'Sync Complete'}</AlertTitle>
                  {syncSuccess}
                </Alert>
              )}
            </Box>
          </Container>
        </Paper>
      )}

      {/* Main Content */}
      <Box
        component={embedded ? 'div' : Container}
        {...(!embedded && { maxWidth: 'xl' })}
        sx={{ 
          mt: embedded ? 0 : (compactMode ? 1.5 : 3), 
          px: embedded ? { xs: 1.5, sm: 2 } : (compactMode ? { xs: 1, sm: 1.5 } : 0),
          pb: embedded ? 2 : 0,
          flex: embedded ? 1 : 'initial',
          overflow: embedded ? 'auto' : 'visible',
          display: embedded ? 'flex' : 'block',
          flexDirection: embedded ? 'column' : 'initial',
          position: 'relative',
        }}
      >
        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            mb: embedded ? 2 : (compactMode ? 1.5 : 3),
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: compactMode ? 0 : 2,
            flexShrink: 0,
            position: compactMode ? 'sticky' : 'static',
            top: filtersStickyTop,
            zIndex: compactMode ? 1180 : 'auto',
            bgcolor: 'background.paper',
            maxHeight: filtersMaxHeight,
            overflow: filtersOverflow,
            boxShadow: compactMode ? theme.shadows[3] : 'none',
            width: compactMode ? '100vw' : 'auto',
            maxWidth: compactMode ? '100vw' : 'none',
            ml: compactMode ? 'calc(50% - 50vw)' : 0,
            mr: compactMode ? 'calc(50% - 50vw)' : 0,
          }}
        >
          <EventsFilters2
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApply={handleFiltersApply}
            loading={loading}
            timezone={selectedTimezone}
            newsSource={newsSource}
            actionOffset={embedded ? (user ? 56 : 12) : 0}
          />
        </Paper>

        {/* Tabs */}
        {!embedded && (
          <Paper
            elevation={0}
            sx={{
              mb: compactMode ? 1.5 : 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              position: 'static',
              top: tabsStickyTop,
              zIndex: 'auto',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: { xs: 56, sm: 48 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                value={TAB_VALUES.TIMELINE}
                label="Timeline"
                icon={<TimelineIcon />}
                iconPosition="start"
              />
              <Tab
                value={TAB_VALUES.TABLE}
                label="Table"
                icon={<TableChartIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        )}

        {/* Content */}
        <Box 
          sx={{
            flex: embedded ? 1 : 'initial',
            overflow: embedded ? 'hidden' : 'visible',
            display: 'flex',
            flexDirection: 'column',
            minHeight: embedded ? 0 : 'auto',
          }}
        >
          {currentTab === TAB_VALUES.TIMELINE && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: embedded ? 'hidden' : 'auto',
                flex: embedded ? 1 : 'initial',
                display: embedded ? 'flex' : 'block',
                flexDirection: 'column',
              }}
            >
              <EventsTimeline2
                events={events}
                loading={loading}
                timezone={selectedTimezone}
                onVisibleCountChange={handleVisibleCountChange}
                autoScrollToNextKey={autoScrollToNextKey}
              />
            </Paper>
          )}
          
          {!embedded && currentTab === TAB_VALUES.TABLE && (
            <Box
              sx={{
                flex: embedded ? 1 : 'initial',
                overflow: embedded ? 'hidden' : 'visible',
                display: embedded ? 'flex' : 'block',
                flexDirection: 'column',
              }}
            >
              <EventsTable
                events={events}
                loading={loading}
                error={error}
                timezone={selectedTimezone}
                onRefresh={handleRefresh}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Sync Modals - non-embedded only */}
      {!embedded && user && (
        <>
          <SyncCalendarModal
            isOpen={showSyncModal}
            onClose={() => setShowSyncModal(false)}
            defaultSources={[newsSource]}
            onSync={handleMultiSourceSync}
          />

          <ConfirmModal
            open={showInitialSyncConfirm}
            onClose={() => setShowInitialSyncConfirm(false)}
            onConfirm={handleInitialSync}
            title="Initial Historical Sync - ALL Sources"
            message={
              <>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  This will fetch <strong>2 years of historical data</strong> (up to today) from <strong>all 3 news sources</strong>: MQL5, Forex Factory, and FXStreet.
                </Typography>
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700, mb: 2 }}>
                  ⚠️ HIGH API COST: This will use approximately <strong>9 API credits</strong> (3 credits × 3 sources)
                </Typography>
                <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    📊 What Gets Synced:
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                    • <strong>MQL5:</strong> ~8,500 historical events with categories
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                    • <strong>Forex Factory:</strong> ~13,500 historical events (best coverage)
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                    • <strong>FXStreet:</strong> Recent events only
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                    🔮 For Future Events:
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 1, fontStyle: 'italic' }}>
                    After initial sync, use <strong>"Sync Calendar"</strong> button to get upcoming scheduled events (next 30 days).
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  <strong>Note:</strong> For regular updates and future events, use the "Sync Calendar" button.
                </Typography>
              </>
            }
            confirmText="Sync All Sources"
            cancelText="Cancel"
            requirePassword={true}
            password="9876543210"
          />
        </>
      )}
    </Box>
  );
});

EventsPage.displayName = 'EventsPage';

export default EventsPage;
