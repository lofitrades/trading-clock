// src/components/UnlockModal.jsx
/**
 * src/components/UnlockModal.jsx
 * 
 * Purpose: Feature unlock promotion modal for non-authenticated users.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-14 - CRITICAL FIX: Updated backdrop z-index to 1699 and paper z-index to 1701 to ensure modal blocks clicks and properly layers above AppBar (1400) and SettingsSidebar2 (1600).
 * v1.0.0 - Initial implementation
 */
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
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { zIndex: 1699 } },
        paper: { sx: { zIndex: 1701 } },
      }}
    >
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
