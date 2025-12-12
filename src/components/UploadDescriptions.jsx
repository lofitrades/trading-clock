import { useState, useEffect } from 'react';
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
      setPasswordError('Incorrect password. Please try again.');
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
        setError('Please select a valid JSON file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
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
        message: `Successfully uploaded ${uploadedCount} event descriptions to Firestore`,
        count: uploadedCount,
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload descriptions');
      setResult({
        success: false,
        message: 'Upload failed',
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
        <Typography>Loading...</Typography>
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
            You must be logged in to Firebase Authentication to upload event descriptions.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Please log in to your Firebase account first, then return to this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Current auth state: {firebaseUser ? 'Logged in' : 'Not logged in'}
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
            Logged in as: {firebaseUser.email}
          </Alert>
          
          <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
            Protected Page
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Please enter the password to access the upload page.
          </Typography>

          <form onSubmit={handlePasswordSubmit}>
            <TextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
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
              Submit
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
          Upload Economic Event Descriptions
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Select the <code>economicEventDescriptions.json</code> file to upload event descriptions to Firestore.
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
              Select JSON File
            </Button>
          </label>

          {selectedFile && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
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
          {uploading ? 'Uploading...' : 'Upload to Firestore'}
        </Button>

        {/* Progress Bar */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {Math.round(progress)}% Complete
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
              Uploaded Events ({uploadedEvents.length})
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
            Instructions:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Click "Select JSON File" and choose <code>economicEventDescriptions.json</code></li>
              <li>Click "Upload to Firestore" to start the upload</li>
              <li>Wait for the upload to complete</li>
              <li>The events will be stored in the <code>{COLLECTION_NAME}</code> collection</li>
            </ol>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default UploadDescriptions;
