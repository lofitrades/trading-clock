/* src/components/ForgotPasswordModal.jsx */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { auth } from '../firebase';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      setMessage(getSuccessMessage('password-reset'));
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Forgot Password</DialogTitle>
      <form onSubmit={handleReset}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          <TextField
            fullWidth
            type="email"
            label="Email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button onClick={onClose} variant="text" color="primary">
            Close
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
