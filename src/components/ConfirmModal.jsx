/* src/components/ConfirmModal.jsx */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Dialog open={true} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>Please Confirm</DialogTitle>
      <DialogContent>
        <Typography sx={{ textAlign: 'center' }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-around', padding: '16px 24px' }}>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirm
        </Button>
        <Button onClick={onCancel} variant="outlined" color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
