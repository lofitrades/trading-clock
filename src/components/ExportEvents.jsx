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

const EVENTS_COLLECTION = 'economicEventsCalendar';

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
   * Export all events from Firestore to JSON file
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      console.log('📊 Starting export of economic events...');

      // Query all documents in the collection
      const eventsRef = collection(db, EVENTS_COLLECTION);
      const snapshot = await getDocs(eventsRef);

      if (snapshot.empty) {
        throw new Error('No events found in the collection');
      }

      // Transform documents to JSON format
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings for JSON export
          date: data.date?.toDate?.().toISOString() || data.date,
          createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
        };
      });

      console.log(`✅ Exported ${events.length} events`);

      // Create JSON blob and download
      const jsonString = JSON.stringify(events, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `economic-events-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

      setResult({
        success: true,
        count: events.length,
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
          Export all economic events from the <code>{EVENTS_COLLECTION}</code> collection 
          to a JSON file. This will download all events with their metadata including dates, 
          currencies, impact levels, and event details.
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
            {exporting ? 'Exporting...' : 'Export All Events'}
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
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip 
                label={`${result.count.toLocaleString()} events`} 
                size="small" 
                color="success"
              />
              <Chip 
                label={new Date(result.timestamp).toLocaleString()} 
                size="small" 
                variant="outlined"
              />
            </Stack>
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
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Note:</strong> The exported JSON file will contain all fields from Firestore,
            with Timestamps converted to ISO 8601 strings for compatibility. The file will be
            automatically downloaded to your default downloads folder.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
