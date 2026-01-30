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
 * v2.1.0 - 2026-01-24 - i18n migration: added useTranslation hook for dialogs + form + actions namespaces
 * v2.0.8 - 2026-01-15 - Remove redundant paper z-index overrides (Dialog root controls stacking).
 * v2.0.7 - 2026-01-15 - Raise modal/backdrop to top-level stack so AppBar never overlays it.
 * v2.0.5 - 2026-01-15 - Broadcast priority state so AccountModal hides while password reset is open.
 * v2.0.4 - 2026-01-15 - Raise ForgotPasswordModal z-index above AccountModal across all nested states.
 * v2.0.2 - 2026-01-15 - Modal layering: keep backdrop behind paper and ensure modal stacks above AppBar.
 * v2.0.1 - 2025-12-16 - Added PropTypes validation, removed unused helper import, and fixed apostrophe escape.
 * v2.0.0 - 2025-12-16 - Redesigned to match new enterprise authentication UI
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import { auth } from '../firebase';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFriendlyErrorMessage } from '../utils/messages';

function PasswordResetSentModal({ email, onClose }) {
  const { t } = useTranslation(['dialogs', 'actions']);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('t2t-modal-priority', { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('t2t-modal-priority', { detail: { active: false } }));
    };
  }, []);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 99999 }}
      slotProps={{
        backdrop: { sx: { ...BACKDROP_OVERLAY_SX, zIndex: 99998 } },
        paper: { sx: { borderRadius: 3, zIndex: 99999 } },
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
          {t('dialogs:passwordResetEmailSentTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('dialogs:passwordResetLinkSentTo')}
        </Typography>
        <Typography variant="body1" fontWeight="600" color="primary.main" paragraph>
          {email}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('dialogs:clickLinkResetPassword')}
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          {t('dialogs:gotIt')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function ForgotPasswordModal({ onClose }) {
  const { t } = useTranslation(['dialogs', 'form', 'validation', 'actions']);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('t2t-modal-priority', { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('t2t-modal-priority', { detail: { active: false } }));
    };
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setError(t('dialogs:noAccountExists'));
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
      sx={{ zIndex: 99999 }}
      slotProps={{
        backdrop: { sx: { ...BACKDROP_OVERLAY_SX, zIndex: 99998 } },
        paper: { sx: { borderRadius: 3, zIndex: 99999 } },
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
            <Typography variant="h4" sx={{ color: 'common.white', fontWeight: 'bold' }}>
              🔑
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            {t('dialogs:resetPassword')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dialogs:resetPasswordInstructions')}
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
              label={t('form:emailLabel')}
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
              {t('dialogs:sendResetLink')}
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
              {t('dialogs:backToLogin')}
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
