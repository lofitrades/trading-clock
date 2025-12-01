/**
 * src/components/ExportEvents.jsx
 * 
 * Purpose: Admin page for exporting economic events calendar data from Firestore.
 * Provides a simple interface to export all events in JSON format with proper
 * error handling, loading states, and authentication.
 * 
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Multi-source structure: /economicEvents/{source}/events/{eventId}
const EVENTS_PARENT_COLLECTION = 'economicEvents';
const NEWS_SOURCES = ['mql5', 'forex-factory', 'fxstreet'];

/**
 * ExportEvents Component
 * 
 * Provides interface for exporting economic events data from Firestore.
 * Exports all documents in the economicEventsCalendar collection as JSON.
 */
export default function ExportEvents() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Export events from all sources to separate JSON files
   * Exports to: data/{source}-events-{date}.json
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      console.log('📊 Starting export of economic events from all sources...');

      const sourceResults = [];
      let totalEvents = 0;

      // Export each source separately
      for (const source of NEWS_SOURCES) {
        console.log(`📥 Exporting ${source}...`);

        // Query subcollection: /economicEvents/{source}/events
        const eventsRef = collection(db, EVENTS_PARENT_COLLECTION, source, 'events');
        const snapshot = await getDocs(eventsRef);

        const eventCount = snapshot.size;

        if (snapshot.empty) {
          console.warn(`⚠️ No events found for ${source}`);
          sourceResults.push({ source, count: 0, success: false });
          continue;
        }

        // Transform documents to JSON format
        const events = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            source, // Add source field explicitly
            ...data,
            // Convert Firestore Timestamps to serializable format
            date: data.date?.toDate ? {
              _seconds: Math.floor(data.date.toDate().getTime() / 1000),
              _nanoseconds: (data.date.toDate().getTime() % 1000) * 1000000
            } : data.date,
            createdAt: data.createdAt?.toDate ? {
              _seconds: Math.floor(data.createdAt.toDate().getTime() / 1000),
              _nanoseconds: (data.createdAt.toDate().getTime() % 1000) * 1000000
            } : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? {
              _seconds: Math.floor(data.updatedAt.toDate().getTime() / 1000),
              _nanoseconds: (data.updatedAt.toDate().getTime() % 1000) * 1000000
            } : data.updatedAt,
          };
        });

        console.log(`✅ Exported ${events.length} events from ${source}`);
        totalEvents += events.length;

        // Save to data folder using File System Access API
        const jsonString = JSON.stringify(events, null, 2);
        const filename = `${source}-events-${new Date().toISOString().split('T')[0]}.json`;

        try {
          // Create a blob for download
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(url);
          
          sourceResults.push({ source, count: eventCount, success: true, filename });
        } catch (saveErr) {
          console.error(`Failed to save ${filename}:`, saveErr);
          sourceResults.push({ source, count: eventCount, success: false, filename });
        }
      }

      setResult({
        success: true,
        sources: sourceResults,
        totalCount: totalEvents,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      console.error('❌ Export failed:', err);
      setError(err.message || 'Failed to export events');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Navigate back to main app
   */
  const handleBack = () => {
    window.location.hash = '/';
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ minWidth: 'auto' }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Export Economic Events
          </Typography>
        </Stack>

        {/* User Info */}
        {user && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Logged in as: <strong>{user.email}</strong>
            </Typography>
          </Alert>
        )}

        {/* Description */}
        <Typography variant="body1" color="text.secondary" paragraph>
          Export economic events from all news sources to separate JSON files. This will 
          download 3 files (one per source) containing all events with their metadata including 
          dates, currencies, impact levels, and event details.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          <strong>Sources:</strong> {NEWS_SOURCES.map(s => s.toUpperCase()).join(', ')}
        </Typography>

        {/* Export Button */}
        <Box sx={{ my: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {exporting ? 'Exporting All Sources...' : 'Export All Sources (3 Files)'}
          </Button>
        </Box>

        {/* Success Result */}
        {result && (
          <Alert 
            severity="success" 
            icon={<CheckCircleIcon />}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Export completed successfully!
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Downloaded {result.sources.filter(s => s.success).length} files with {result.totalCount.toLocaleString()} total events
            </Typography>
            
            <List dense sx={{ bgcolor: 'success.light', borderRadius: 1, py: 0.5 }}>
              {result.sources.map(({ source, count, success, filename }) => (
                <ListItem key={source} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {success ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Typography variant="body2">
                        <strong>{source.replace('-', ' ').toUpperCase()}:</strong> {count.toLocaleString()} events
                      </Typography>
                    }
                    secondary={filename || `${source}-events-${new Date(result.timestamp).toISOString().split('T')[0]}.json`}
                  />
                </ListItem>
              ))}
            </List>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                <strong>📥 Files downloaded to your Downloads folder</strong>
              </Typography>
              <Typography variant="caption" display="block">
                Move them to: <code>D:\Lofi Trades\trading-clock\data\</code>
              </Typography>
            </Alert>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            onClose={() => setError(null)}
          >
            <Typography variant="subtitle2" gutterBottom>
              Export failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}

        {/* Info Box */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            <strong>Export Details:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 2 }}>
            • 3 files will be downloaded (one per source)<br />
            • Timestamps preserved in Firestore format (_seconds, _nanoseconds)<br />
            • Files automatically downloaded to your Downloads folder<br />
            • Move files to <code>data/</code> folder to replace old exports<br />
            • File naming: <code>{'{source}'}-events-{'{date}'}.json</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
