/**
 * src/components/EmailLinkHandler.jsx
 * 
 * Purpose: Enhanced email link authentication handler with proper error handling.
 * Detects email links, handles expired/used links gracefully, and provides clean UX.
 * 
 * Features:
 * - Automatic email detection from localStorage
 * - Graceful handling of expired/used links
 * - Clean dialog for email confirmation (no browser prompts)
 * - Proper error messages for users
 * - "Request New Link" button for expired links
 * 
 * Changelog:
 * v1.4.0 - 2025-12-16 - Added "Request New Link" button and AuthModal integration
 * v1.3.0 - 2025-12-16 - Added proper error handling and clean email confirmation UI
 * v1.2.0 - 2025-12-16 - Don't navigate immediately, wait for auth state
 * v1.1.0 - 2025-12-16 - Made silent (no dialog), store isNewUser for WelcomeModal
 * v1.0.0 - 2025-12-16 - Initial implementation
 */

import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink, getAdditionalUserInfo } from 'firebase/auth';
import { auth } from '../firebase';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Typography, Alert, CircularProgress, Box } from '@mui/material';
import AuthModal from './AuthModal';

export default function EmailLinkHandler() {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handleEmailLink = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      // Email link detected
      const storedEmail = window.localStorage.getItem('emailForSignIn');

      if (!storedEmail) {
        // No email in storage - show dialog instead of browser prompt
        setShowEmailDialog(true);
        return;
      }

      // Email found in storage - proceed with sign-in
      await processSignIn(storedEmail);
    };

    handleEmailLink();
  }, []);

  const processSignIn = async (emailToUse) => {
    setIsProcessing(true);
    setError('');
    setIsLinkExpired(false);

    try {
      const result = await signInWithEmailLink(auth, emailToUse, window.location.href);
      
      const additionalUserInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalUserInfo?.isNewUser ?? false;

      // Store isNewUser flag for WelcomeModal (AuthContext will check this)
      if (isNewUser) {
        window.localStorage.setItem('showWelcomeModal', 'true');
      }

      // Clean up email
      window.localStorage.removeItem('emailForSignIn');
      
      // Clean URL (remove the oobCode and other params)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Close dialog if open
      setShowEmailDialog(false);
      
      // DON'T navigate - let AuthContext detect the auth state change
      // and handle user creation + welcome modal, then app will load naturally
      
    } catch (error) {
      console.error('[EmailLinkHandler] Sign-in failed:', error.code, error.message);
      
      // Handle specific error cases with user-friendly messages
      let errorMessage = '';
      let linkExpired = false;
      
      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This sign-in link has expired or has already been used. Please request a new one.';
        linkExpired = true;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address you entered is invalid. Please check and try again.';
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This sign-in link has expired. Please request a new one.';
        linkExpired = true;
      } else {
        errorMessage = `Sign-in failed: ${error.message}. Please request a new link.`;
        linkExpired = true;
      }
      
      setError(errorMessage);
      setIsLinkExpired(linkExpired);
      setIsProcessing(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    await processSignIn(email);
  };

  const handleCancel = () => {
    setShowEmailDialog(false);
    setError('');
    setIsLinkExpired(false);
    
    // Clean URL to remove email link parameters
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  };

  const handleRequestNewLink = () => {
    // Close current dialog
    setShowEmailDialog(false);
    setError('');
    setIsLinkExpired(false);
    
    // Clean URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    // Open AuthModal to request new link
    setShowAuthModal(true);
  };

  // Show AuthModal if user needs to request new link
  if (showAuthModal) {
    return <AuthModal onClose={() => setShowAuthModal(false)} />;
  }

  // Show email confirmation dialog if needed
  if (showEmailDialog) {
    return (
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        onClose={handleCancel}
        slotProps={{
          backdrop: { sx: { zIndex: 9999 } },
          paper: { sx: { zIndex: 10000, borderRadius: 3 } },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Confirm Your Email
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter the email address you used to request this sign-in link.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleEmailSubmit}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              disabled={isProcessing || isLinkExpired}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              {isLinkExpired ? (
                // Show "Request New Link" button for expired links
                <>
                  <Button
                    onClick={handleRequestNewLink}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    Request New Link
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    fullWidth
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                // Show normal confirm/cancel buttons
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    fullWidth
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isProcessing}
                  >
                    {isProcessing ? <CircularProgress size={24} /> : 'Confirm'}
                  </Button>
                </Box>
              )}
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Silent component when not showing dialog
  return null;
}
