/**
 * src/components/ForgotPasswordModal.jsx
 * 
 * Purpose: Enterprise-grade password reset modal.
 * Clean, mobile-first design matching the updated authentication flow.
 * 
 * Features:
 * - Password reset via email
 * - Clean, centered design
 * - Mobile-first responsive design
 * - Success/error state handling
 * 
 * Changelog:
 * v2.0.1 - 2025-12-16 - Added PropTypes validation, removed unused helper import, and fixed apostrophe escape.
 * v2.0.0 - 2025-12-16 - Redesigned to match new enterprise authentication UI
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { auth } from '../firebase';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFriendlyErrorMessage } from '../utils/messages';

function PasswordResetSentModal({ email, onClose }) {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { zIndex: 1502 } },
        paper: { sx: { zIndex: 1503, borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2,
          }}
        >
          <Typography variant="h4">✓</Typography>
        </Box>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Password reset email sent
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          We sent a password reset link to:
        </Typography>
        <Typography variant="body1" fontWeight="600" color="primary.main" paragraph>
          {email}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Click the link in the email to reset your password. The link will expire in 60 minutes.
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setError('No account exists with that email.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setShowSuccessModal(true);
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  if (showSuccessModal) {
    return <PasswordResetSentModal email={email} onClose={onClose} />;
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { zIndex: 1502 } },
        paper: { sx: { zIndex: 1503, borderRadius: 3 } },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'text.secondary',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: { xs: 3, sm: 5 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2,
            }}
          >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              🔑
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Reset your password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email address and we&apos;ll send you a link
            <br />
            to reset your password.
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleReset}>
          <Stack spacing={2.5}>
            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError('')}
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}
            {message && (
              <Alert 
                severity="success" 
                onClose={() => setMessage('')}
                sx={{ borderRadius: 2 }}
              >
                {message}
              </Alert>
            )}

            <TextField
              fullWidth
              type="email"
              label="Enter your email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Send reset link
            </Button>

            <Button
              onClick={onClose}
              variant="text"
              color="primary"
              fullWidth
              sx={{
                textTransform: 'none',
              }}
            >
              Back to login
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

PasswordResetSentModal.propTypes = {
  email: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

ForgotPasswordModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
