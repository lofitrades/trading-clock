/**
 * src/components/UploadDescriptions.jsx
 * 
 * Purpose: Admin-only page for uploading economic event descriptions from JSON to Firestore.
 * Handles password authentication, file selection, batch upload with progress tracking.
 * 
 * v1.1.0 - 2026-01-24 - BEP: Phase 3c i18n migration - Added useTranslation hook with admin, form, validation namespaces.
 *                       Replaced 18 hardcoded strings with t() calls across auth, upload UI, status messages.
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation for event descriptions upload to economicEventDescriptions collection.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Input,
  TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const COLLECTION_NAME = 'economicEventDescriptions';

/**
 * Generate document ID from event name
 * Uses lowercase, replaces spaces with underscores, removes special chars
 */
function generateDocId(eventName) {
  return eventName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 100); // Firestore doc ID limit
}

function UploadDescriptions() {
  const { t } = useTranslation(['admin', 'form', 'validation']);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedEvents, setUploadedEvents] = useState([]);

  const CORRECT_PASSWORD = '9876543210';

  // Check Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError(t('validation:incorrectPassword'));
      setPassword('');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/json') {
        setSelectedFile(file);
        setError(null);
        setResult(null);
        setUploadedEvents([]);
      } else {
        setError(t('validation:invalidFileType'));
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError(t('validation:selectFileFirst'));
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);
    setUploadedEvents([]);

    try {
      // Read the file
      const fileContent = await selectedFile.text();
      const data = JSON.parse(fileContent);

      if (!data.events || !Array.isArray(data.events)) {
        throw new Error('Invalid JSON structure: missing "events" array');
      }

      const events = data.events;
      const totalEvents = events.length;
      const uploadedList = [];

      // Upload metadata document
      const metadataRef = doc(db, COLLECTION_NAME, '_metadata');
      await setDoc(metadataRef, {
        ...data.metadata,
        uploadedAt: serverTimestamp(),
        uploadedBy: 'admin',
        totalEvents: totalEvents,
      });

      // Batch upload events (Firestore batch limit is 500)
      const batchSize = 500;
      let uploadedCount = 0;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchEvents = events.slice(i, i + batchSize);

        for (const event of batchEvents) {
          const docId = generateDocId(event.name);
          const docRef = doc(db, COLLECTION_NAME, docId);

          batch.set(docRef, {
            ...event,
            docId: docId,
            uploadedAt: serverTimestamp(),
          }, { merge: true });

          uploadedList.push({
            name: event.name,
            category: event.category,
            impact: event.impact,
            docId: docId,
          });
        }

        await batch.commit();
        uploadedCount += batchEvents.length;
        setProgress((uploadedCount / totalEvents) * 100);
      }

      setUploadedEvents(uploadedList);
      setResult({
        success: true,
        message: t('admin:uploadSuccessful', { count: uploadedCount }),
        count: uploadedCount,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || t('admin:uploadFailed'));
      setResult({
        success: false,
        message: t('admin:uploadFailed'),
      });
    } finally {
      setUploading(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>{t('states:loading')}</Typography>
      </Box>
    );
  }

  // Check if user is logged in to Firebase
  if (!firebaseUser) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Paper elevation={3} sx={{ maxWidth: 500, width: '100%', p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('admin:requiresAuthentication')}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {t('admin:pleaseLogInFirst')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('admin:currentAuthState')}: {firebaseUser ? t('auth:loggedIn') : t('auth:notLoggedIn')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: 400,
            width: '100%',
            p: 4,
          }}
        >
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('admin:loggedInAs')}: {firebaseUser.email}
          </Alert>

          <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
            {t('admin:protectedPage')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            {t('admin:enterPasswordMessage')}
          </Typography>

          <form onSubmit={handlePasswordSubmit}>
            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('form:enterPassword')}
              fullWidth
              autoFocus
              variant="outlined"
              sx={{ mb: 2 }}
            />

            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              {t('actions:submit')}
            </Button>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 800,
          mx: 'auto',
          p: 4,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          {t('admin:uploadEventDescriptions')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('admin:selectJsonFileMessage')}
        </Typography>

        {/* File Selection */}
        <Box sx={{ mb: 3 }}>
          <Input
            type="file"
            inputProps={{ accept: '.json' }}
            onChange={handleFileSelect}
            sx={{ display: 'none' }}
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FolderIcon />}
              disabled={uploading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {t('form:selectJsonFile')}
            </Button>
          </label>

          {selectedFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('admin:selected')}: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
            </Alert>
          )}
        </Box>

        {/* Upload Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          fullWidth
          sx={{ mb: 3 }}
        >
          {uploading ? t('admin:uploading') : t('admin:uploadToFirestore')}
        </Button>

        {/* Progress Bar */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {Math.round(progress)}% {t('states:complete')}
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {result && result.success && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            {result.message}
          </Alert>
        )}

        {/* Uploaded Events List */}
        {uploadedEvents.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {t('admin:uploadedEvents', { count: uploadedEvents.length })}
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
              <List dense>
                {uploadedEvents.map((event, index) => (
                  <ListItem key={index} divider={index < uploadedEvents.length - 1}>
                    <ListItemText
                      primary={event.name}
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            label={event.category}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={event.impact}
                            size="small"
                            color={
                              event.impact === 'high'
                                ? 'error'
                                : event.impact === 'medium'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                          <Chip
                            label={event.docId}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {/* Instructions */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('admin:instructions')}:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>{t('admin:instructionStep1')}</li>
              <li>{t('admin:instructionStep2')}</li>
              <li>{t('admin:instructionStep3')}</li>
              <li>{t('admin:instructionStep4', { collection: COLLECTION_NAME })}</li>
            </ol>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default UploadDescriptions;
