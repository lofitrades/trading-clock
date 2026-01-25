// src/components/UnlockModal.jsx
/**
 * src/components/UnlockModal.jsx
 * 
 * Purpose: Feature unlock promotion modal for non-authenticated users.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-24 - Phase 3 i18n migration: Unlock promotion strings (dialogs namespace - 4 strings EN/ES/FR)
 * v1.0.1 - 2026-01-14 - CRITICAL FIX: Updated backdrop z-index to 1699 and paper z-index to 1701 to ensure modal blocks clicks and properly layers above AppBar (1400) and SettingsSidebar2 (1600).
 * v1.0.0 - Initial implementation
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';

export default function UnlockModal({ onClose, onSignUp }) {
  const { t } = useTranslation(['dialogs', 'actions']);
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
        paper: { sx: { zIndex: 1701 } },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        {t('dialogs:unlockProTitle')}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ textAlign: 'center', mb: 2 }}>
          {t('dialogs:unlockProMessage')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexDirection: 'column', gap: 1, padding: '16px 24px' }}>
        <Button onClick={onSignUp} variant="contained" color="primary" fullWidth>
          {t('dialogs:createFreeAccount')}
        </Button>
        <Button onClick={onClose} variant="text" color="primary">
          {t('actions:close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
