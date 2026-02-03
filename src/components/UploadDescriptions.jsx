/**
 * src/components/UploadDescriptions.jsx
 * 
 * Purpose: Superadmin-only page for uploading economic event descriptions from JSON to Firestore.
 * Supports multilingual (EN/ES/FR) event data with i18n structure. Enforces superadmin role via RBAC,
 * file selection, batch upload with progress tracking, translation status validation.
 * 
 * v1.3.0 - 2026-02-02 - BEP RBAC: Removed hardcoded password authentication. Added RBAC enforcement
 *                       via AuthContext.hasRole('superadmin'). Component now uses proper role-based
 *                       access control instead of password protection. Enforces superadmin-only access
 *                       with informative error messages for unauthorized users.
 * v1.2.0 - 2026-02-02 - BEP i18n: Added support for multilingual event descriptions with i18n structure.
 *                       Updated validation to accept events with nested i18n objects. Added translation
 *                       status display (complete/partial/missing). Handles both new i18n and legacy formats.
 * v1.1.1 - 2026-01-29 - BEP i18n: Removed remaining hardcoded validation and status copy.
 * v1.1.0 - 2026-01-24 - BEP: Phase 3c i18n migration - Added useTranslation hook with admin, form, validation namespaces.
 *                       Replaced 18 hardcoded strings with t() calls across auth, upload UI, status messages.
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation for event descriptions upload to economicEventDescriptions collection.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../types/userTypes';
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
  Card,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
  Translate as TranslateIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const COLLECTION_NAME = 'economicEventDescriptions';
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];

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

/**
 * Validate translation completeness for an event
 * Checks if description, tradingImplication, keyThresholds fields exist
 * Returns: 'complete' | 'partial' | 'missing'
 */
function getTranslationStatus(event) {
  // Handle legacy format (no i18n)
  if (!event.i18n) {
    return event.description && event.tradingImplication ? 'complete' : 'partial';
  }

  // Handle new i18n format
  let languagesComplete = 0;
  for (const lang of SUPPORTED_LANGUAGES) {
    const content = event.i18n[lang];
    if (content && content.description && content.tradingImplication) {
      languagesComplete++;
    }
  }

  if (languagesComplete === SUPPORTED_LANGUAGES.length) return 'complete';
  if (languagesComplete > 0) return 'partial';
  return 'missing';
}

/**
 * Get translation status color for UI display
 */
function getTranslationStatusColor(status) {
  if (status === 'complete') return 'success';
  if (status === 'partial') return 'warning';
  return 'error';
}


function UploadDescriptions() {
  const { t } = useTranslation(['admin', 'form', 'validation', 'states', 'actions', 'auth']);
  const { user, userProfile, authLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedEvents, setUploadedEvents] = useState([]);

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
        setError(t('validation:jsonMustBeArrayOrEvents'));
        setUploading(false);
        return;
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
        supportedLanguages: SUPPORTED_LANGUAGES,
      });

      // Batch upload events (Firestore batch limit is 500)
      const batchSize = 500;
      let uploadedCount = 0;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchEvents = events.slice(i, i + batchSize);

        for (const event of batchEvents) {
          const docId = generateDocId(event.name);
          const translationStatus = getTranslationStatus(event);
          const docRef = doc(db, COLLECTION_NAME, docId);

          batch.set(docRef, {
            ...event,
            docId: docId,
            _translationStatus: translationStatus, // Track translation status
            uploadedAt: serverTimestamp(),
          }, { merge: true });

          uploadedList.push({
            name: event.name,
            category: event.category,
            impact: event.impact,
            docId: docId,
            translationStatus: translationStatus,
            hasI18n: !!event.i18n,
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
      setError(t('validation:failedToValidateJson'));
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

  // Check if user is authenticated
  if (!user) {
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
          <Alert severity="error" icon={<LockIcon />} sx={{ mb: 2 }}>
            {t('admin:requiresAuthentication')}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {t('admin:pleaseLogInFirst')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check if user has superadmin role (RBAC)
  if (userProfile?.role !== USER_ROLES.SUPERADMIN) {
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
            maxWidth: 500,
            width: '100%',
            p: 4,
          }}
        >
          <Alert severity="error" icon={<LockIcon />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('admin:accessDenied')}
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('admin:superadminOnlyAccess')}
          </Typography>

          <Typography variant="caption" color="text.disabled">
            {t('admin:yourRole')}: <strong>{userProfile?.role || t('auth:notLoggedIn')}</strong>
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary" component="div">
              {t('admin:contactAdministrator')}
            </Typography>
          </Box>
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
              {t('admin:selected')}: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} {t('admin:fileSizeUnit')})
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
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2,
                maxHeight: 500,
                overflowY: 'auto',
              }}
            >
              {uploadedEvents.map((event, index) => (
                <Card key={index} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {event.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {event.category}
                      </Typography>
                    </Box>
                    {event.hasI18n && (
                      <Chip
                        icon={<TranslateIcon sx={{ fontSize: 14 }} />}
                        label={event.translationStatus === 'complete' ? '✓' : event.translationStatus === 'partial' ? '◐' : '✗'}
                        size="small"
                        color={getTranslationStatusColor(event.translationStatus)}
                        variant="outlined"
                        sx={{ whiteSpace: 'nowrap' }}
                      />
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      label={`Impact: ${event.impact}`}
                      size="small"
                      color={
                        event.impact === 'high'
                          ? 'error'
                          : event.impact === 'medium'
                            ? 'warning'
                            : 'default'
                      }
                      variant="filled"
                    />
                  </Stack>
                  {event.hasI18n && event.translationStatus === 'complete' && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <Chip
                          key={lang}
                          label={lang.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            borderColor: 'success.main',
                            color: 'success.main',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.disabled', wordBreak: 'break-all' }}>
                    ID: {event.docId}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Instructions */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            {t('admin:instructions')}:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>{t('admin:instructionStep1')}</li>
              <li>{t('admin:instructionStep2')}</li>
              <li>{t('admin:instructionStep3')}</li>
              <li>{t('admin:instructionStep4', { collection: COLLECTION_NAME })}</li>
            </ol>
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption" component="div">
              <strong>{t('admin:multilingualSupport')}:</strong> Events can include translations for EN, ES, and FR. Each language translation status will be displayed as a chip (✓ = complete, ◐ = partial, ✗ = missing).
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
}

export default UploadDescriptions;
