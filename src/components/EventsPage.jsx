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
  Tooltip as MuiTooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import EventsTable from './EventsTable';
import EventsTimeline2 from './EventsTimeline2';
import EventsFilters2 from './EventsFilters2';
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
const EventsPage = React.forwardRef(({ embedded = false, onEventsUpdate }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      console.log(`📅 [EventsPage] Current date/time: ${now.toISOString()} (${now.toLocaleString()})`);
      
      const startDate = new Date(now.getTime()); // Clone to avoid mutation
      startDate.setDate(startDate.getDate() - 14); // 14 days back (matches cache)
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now.getTime()); // Clone to avoid mutation
      endDate.setDate(endDate.getDate() + 8); // 8 days forward (matches cache)
      endDate.setHours(23, 59, 59, 999);
      
      console.log('📅 [EventsPage] Setting initial date range (cache-optimized):', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysBack: 14,
        daysForward: 8,
      });
      
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
      console.log('📅 [EventsPage] Using existing date range:', {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      });
      fetchEvents();
    }
  }, []); // Run only on mount

  /**
   * Fetch events when news source changes
   * Cache is source-isolated, so switching loads from new source's cache instantly
   */
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      console.log(`📡 [EventsPage.useEffect-newsSource] News source changed to: ${newsSource}`);
      console.log(`📦 [EventsPage.useEffect-newsSource] Loading events from ${newsSource} cache...`);
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

    console.log(`📊 [EventsPage.fetchEvents] Fetching events for source: ${newsSource}`);
    console.log(`📅 [EventsPage.fetchEvents] Date range: ${activeFilters.startDate?.toISOString()} to ${activeFilters.endDate?.toISOString()}`);

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
        
        // Notify parent (for drawer integration)
        if (onEventsUpdate) {
          onEventsUpdate(sortedEvents.length, updatedTime);
        }
        
        console.log(`✅ [EventsPage] Loaded ${sortedEvents.length} events from ${newsSource}`);
        console.log('📊 [EventsPage] Sample event:', sortedEvents[0]);
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
    console.log(`🔄 [EventsPage.handleRefresh] Manual refresh triggered for source: ${newsSource}`);
    console.log(`📦 [EventsPage.handleRefresh] Invalidating cache for ${newsSource}...`);
    
    // Invalidate cache to force fresh data
    const { invalidateCache } = await import('../services/eventsCache');
    invalidateCache(newsSource);
    
    console.log(`✅ [EventsPage.handleRefresh] Cache invalidated, refetching events...`);
    // Refetch events
    fetchEvents();
  }, [newsSource, fetchEvents]);

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
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: { xs: 2, sm: 3 },
              }}
            >
              {/* Back Button */}
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

              {/* Title */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    mb: 0.5,
                  }}
                >
                  Economic Events
                </Typography>
                {lastUpdated && (
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    Last updated: {lastUpdated.toLocaleString()}
                  </Typography>
                )}
              </Box>

              {/* Event Count Badge */}
              {!loading && events.length > 0 && (
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 0.5,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                  >
                    {events.length.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.9,
                      fontSize: '0.75rem',
                    }}
                  >
                    Events
                  </Typography>
                </Box>
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
          mt: embedded ? 0 : 3, 
          px: embedded ? { xs: 1.5, sm: 2 } : 0,
          pb: embedded ? 2 : 0,
          flex: embedded ? 1 : 'initial',
          overflow: embedded ? 'auto' : 'visible',
          display: embedded ? 'flex' : 'block',
          flexDirection: embedded ? 'column' : 'initial',
        }}
      >
        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            mb: embedded ? 2 : 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <EventsFilters2
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApply={handleFiltersApply}
            loading={loading}
            timezone={selectedTimezone}
            newsSource={newsSource}
          />
        </Paper>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: embedded ? 2 : 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            flexShrink: 0,
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
          {activeTab === TAB_VALUES.TIMELINE && (
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
                onVisibleCountChange={() => {}}
              />
            </Paper>
          )}
          
          {activeTab === TAB_VALUES.TABLE && (
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
    </Box>
  );
});

EventsPage.displayName = 'EventsPage';

export default EventsPage;
