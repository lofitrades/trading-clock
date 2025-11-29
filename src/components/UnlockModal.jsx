// src/components/UnlockModal.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function UnlockModal({ onClose, onSignUp }) {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        Unlock Pro★ Features for free: $0
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ textAlign: 'center', mb: 2 }}>
          Create a free account to unlock full access to the pro features, including changing timezones and accessing premium settings.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, padding: '16px 24px' }}>
        <Button onClick={onSignUp} variant="contained" color="primary" fullWidth>
          Create Free Account
        </Button>
        <Button onClick={onClose} variant="text" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
