/**
 * src/components/EconomicEvents2.jsx
 * 
 * Purpose: Refactored economic events drawer embedding EventsPage component
 * Full-featured drawer with sync controls, filters, tabs, and event displays
 * 
 * Architecture:
 * - Header: Title + close/refresh buttons
 * - EventsPage: Complete page with filters, tabs (Table/Timeline), and events
 * - Footer: Event count, last updated timestamp, news source selector
 * 
 * Key Features:
 * - Embeds full EventsPage component (not separate Filters/Timeline)
 * - Source-aware caching with proper invalidation
 * - Guest preview with mock data
 * - Mobile-responsive drawer layout
 * 
 * Changelog:
 * v1.2.0 - 2025-12-09 - Added expand/collapse control to show full /events experience (tabs + header) within drawer at full width
 * v1.2.1 - 2025-12-09 - Hide back-to-clock control inside drawer
 * v1.2.2 - 2025-12-09 - Auto-scroll to next event when opening drawer
 * v1.2.3 - 2025-12-09 - Compact sticky header/tabs/filters layout in expanded mode for better vertical space
 * v1.1.0 - 2025-12-09 - Removed sync controls from drawer; sync actions now live on /events page header
 * v1.0.0 - 2025-12-08 - Initial implementation - refactored from EconomicEvents.jsx to embed EventsPage
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Tooltip,
  Alert,
  AlertTitle,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import { refreshEventsCache } from '../services/economicEventsService';
import NewsSourceSelector from './NewsSourceSelector';
import EventsPage from './EventsPage';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

// Mock data for guest users preview
const MOCK_EVENTS = [
  {
    id: 'mock-1',
    Name: 'Non-Farm Employment Change',
    currency: 'USD',
    category: 'Employment',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    actual: '227K',
    forecast: '200K',
    previous: '233K',
    strength: 'Strong Data',
  },
  {
    id: 'mock-2',
    Name: 'Unemployment Rate',
    currency: 'USD',
    category: 'Employment',
    date: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
    actual: '-',
    forecast: '4.2%',
    previous: '4.2%',
    strength: 'Strong Data',
  },
  {
    id: 'mock-3',
    Name: 'CPI m/m',
    currency: 'EUR',
    category: 'Inflation',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actual: '0.3%',
    forecast: '0.2%',
    previous: '0.4%',
    strength: 'Moderate Data',
  },
];

/**
 * EconomicEvents2 Component
 * Refactored drawer embedding full EventsPage component
 */
export default function EconomicEvents2({ open, onClose, timezone }) {
  const { newsSource, updateNewsSource } = useSettings();
  const { user } = useAuth();
  
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [autoScrollToken, setAutoScrollToken] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [eventsLastUpdated, setEventsLastUpdated] = useState(null);
  
  // Ref to EventsPage for triggering refresh
  const eventsPageRef = useRef(null);

  /**
   * Handle news source change
   * Updates SettingsContext (persisted) and triggers EventsPage refresh
   */
  const handleNewsSourceChange = (newSource) => {
    updateNewsSource(newSource);
    // EventsPage will auto-refresh via useEffect watching newsSource
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      // Invalidate cache for current source
      await refreshEventsCache(newsSource);
      
      // Trigger EventsPage refresh
      if (eventsPageRef.current?.handleRefresh) {
        eventsPageRef.current.handleRefresh();
      }
      setSyncSuccess(`Events refreshed from ${newsSource}.`);
      setTimeout(() => {
        setSyncSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('❌ [EconomicEvents2] Error refreshing events:', error);
      setSyncSuccess('Failed to refresh events. Please try again.');
      setTimeout(() => {
        setSyncSuccess(null);
      }, 3000);
    } finally {
      setRefreshing(false);
    }
  };

  // Trigger auto-scroll to next event whenever the drawer opens
  useEffect(() => {
    if (open && user) {
      setAutoScrollToken((prev) => prev + 1);
    }
  }, [open, user]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        left: expanded ? 0 : 'auto',
        height: '100vh',
        width: expanded ? '100%' : { xs: '100%', sm: 400, md: 480, lg: 520 },
        display: open ? 'flex' : 'none',
        flexDirection: 'column',
        zIndex: 1200,
        overflow: 'hidden',
      }}
    >
      {/* Header (hidden in expanded mode to avoid double headers) */}
      {!expanded && (
        <Box
          sx={{
            p: { xs: 1.25, sm: 1.75 },
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Economic Events
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {user && (
              <Tooltip title={expanded ? 'Collapse drawer' : 'Expand to full width'}>
                <span>
                  <IconButton
                    onClick={() => setExpanded(prev => !prev)}
                    sx={{ color: 'white' }}
                    size="small"
                  >
                    {expanded ? <CloseFullscreenIcon /> : <OpenInFullIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {/* Refresh Button - Only for authenticated users */}
            {user && (
              <Tooltip title="Refresh events">
                <span>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{ color: 'white' }}
                    size="small"
                  >
                    <RefreshIcon 
                      sx={{
                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton
                onClick={onClose}
                sx={{ color: 'white' }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Floating controls when expanded to keep close/collapse available */}
      {expanded && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: { xs: 8, sm: 23 },
            display: 'flex',
            gap: 0.75,
            zIndex: 1300,
            bgcolor: alpha('#000', 0.4),
            borderRadius: 1.5,
            p: 0.5,
            backdropFilter: 'blur(6px)',
            pointerEvents: 'auto',
          }}
        >
          {user && (
            <Tooltip title="Collapse drawer">
              <span>
                <IconButton
                  onClick={() => setExpanded(false)}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <CloseFullscreenIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {user && (
            <Tooltip title="Refresh events">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <RefreshIcon 
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Close">
            <IconButton
              onClick={onClose}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Sync Success Message - Only for authenticated users */}
      {user && syncSuccess && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.default' }}>
          <Alert severity={syncSuccess.includes('Error') ? 'error' : 'success'} sx={{ py: 0.5 }}>
            {syncSuccess}
          </Alert>
        </Box>
      )}

      {/* Main Content - EventsPage or Guest Message */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Guest User Message */}
        {!user && (
          <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            <Alert 
              severity="info" 
              sx={{ 
                '& .MuiAlert-message': {
                  width: '100%',
                }
              }}
            >
              <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                🔒 Authentication Required
              </AlertTitle>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Economic events are available to registered users only.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a free account or log in to access:
              </Typography>
              <Box component="ul" sx={{ textAlign: 'left', mt: 1.5, mb: 2 }}>
                <li>Real-time economic events calendar</li>
                <li>Advanced filtering by impact, currency, and type</li>
                <li>Event details with historical data</li>
                <li>Cloud sync across all your devices</li>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={onClose}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  Sign Up / Log In
                </Button>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Authenticated User - EventsPage (embedded vs full) */}
        {user && (
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: expanded ? 'background.default' : 'inherit',
            }}
          >
            <EventsPage 
              ref={eventsPageRef}
              embedded={!expanded}
              hideBackButton
              autoScrollToNextKey={autoScrollToken}
              compactMode={expanded}
              onEventsUpdate={(count, timestamp) => {
                setEventsCount(count);
                setEventsLastUpdated(timestamp);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Footer - Event Stats & News Source Selector - Only for authenticated users */}
      {user && !expanded && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Single Row: Event Stats + News Source Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Left: Event Stats */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {eventsCount.toLocaleString()} Events
              </Typography>
              {eventsLastUpdated && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Updated: {eventsLastUpdated.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            
            {/* Right: News Source Selector */}
            <Box sx={{ flexShrink: 0 }}>
              <NewsSourceSelector
                value={newsSource}
                onChange={handleNewsSourceChange}
              />
            </Box>
          </Box>
        </Box>
      )}

    </Paper>
  );
}
