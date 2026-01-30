/* src/components/ConfirmModal.jsx */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';

export default function ConfirmModal({
  open = false,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requirePassword = false,
  password = null,
}) {
  const { t } = useTranslation(['dialogs']);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleConfirm = () => {
    if (requirePassword && password) {
      if (inputPassword === password) {
        setPasswordError(false);
        setInputPassword('');
        onConfirm();
      } else {
        setPasswordError(true);
      }
    } else {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputPassword('');
    setPasswordError(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 1700 }}
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
        paper: { sx: { zIndex: 1700 } },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>{title}</DialogTitle>
      <DialogContent>
        {/* Don't wrap in Typography - message can already contain Typography components */}
        {typeof message === 'string' ? (
          <Typography sx={{ textAlign: 'center' }}>{message}</Typography>
        ) : (
          message
        )}

        {/* Password Input */}
        {requirePassword && password && (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              type="password"
              label={t('dialogs:enterPasswordToConfirm')}
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyPress={handleKeyPress}
              error={passwordError}
              helperText={passwordError ? t('dialogs:incorrectPassword') : ''}
              autoFocus
              sx={{ mt: 1 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-around', padding: '16px 24px' }}>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          {confirmText}
        </Button>
        <Button onClick={handleClose} variant="outlined" color="primary">
          {cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
