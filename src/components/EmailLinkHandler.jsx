/**
 * src/components/EmailLinkHandler.jsx
 * 
 * Purpose: Enhanced email link authentication handler with enterprise-grade UX.
 * Intercepts magic link clicks and shows full-screen verification before mounting app.
 * 
 * Features:
 * - Full-screen verifying modal during authentication
 * - Automatic email detection from localStorage
 * - Graceful handling of expired/used links
 * - Success confirmation modal before redirecting
 * - Clean error handling with "Request New Link" option
 * - Enterprise-quality copywriting and visual design
 * 
 * Changelog:
 * v1.9.0 - 2026-01-24 - i18n migration: added useTranslation hook for dialogs + states namespaces
 * v1.8.0 - 2026-01-23 - Migrated from AuthModal to AuthModal2 with proper open prop; removed legacy AuthModal.jsx dependency
 * v1.7.0 - 2026-01-08 - Extended magicLinkProcessing timeout to 8s to eliminate loading screen during welcome modal display; prevents auto-unmounting per enterprise best practices
 * v1.6.0 - 2026-01-08 - Added full-screen verifying modal with success confirmation following enterprise magic link UX patterns
 * v1.5.0 - 2025-12-17 - Sign out existing sessions before magic link sign-in and create profiles for new users to prevent cross-account logins
 * v1.4.0 - 2025-12-16 - Added "Request New Link" button and AuthModal integration
 * v1.3.0 - 2025-12-16 - Added proper error handling and clean email confirmation UI
 * v1.2.0 - 2025-12-16 - Don't navigate immediately, wait for auth state
 * v1.1.0 - 2025-12-16 - Made silent (no dialog), store isNewUser for WelcomeModal
 * v1.0.0 - 2025-12-16 - Initial implementation
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isSignInWithEmailLink, signInWithEmailLink, getAdditionalUserInfo, signOut, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { getMagicLinkActionCodeSettings } from '../utils/authLinkSettings';
import { Dialog, DialogContent, DialogTitle, TextField, Button, Typography, Alert, CircularProgress, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AuthModal2 from './AuthModal2';
import { createUserProfileSafely } from '../utils/userProfileUtils';

export default function EmailLinkHandler() {
  const { t } = useTranslation(['dialogs', 'states', 'actions']);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendSending, setResendSending] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);

  // Loader is handled independently; modals render above loader using high z-index

  useEffect(() => {
    const handleEmailLink = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        return;
      }

      // Email link detected - show verifying modal immediately
      const storedEmail = window.localStorage.getItem('emailForSignIn');

      if (!storedEmail) {
        // No email in storage - show dialog to collect email
        setShowEmailDialog(true);
        return;
      }

      // Show full-screen verifying modal before processing
      setShowVerifyingModal(true);
      setUserEmail(storedEmail);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 800));

      // Email found in storage - proceed with sign-in
      await processSignIn(storedEmail);
    };

    handleEmailLink();
  }, []);

  const processSignIn = async (emailToUse) => {
    setIsProcessing(true);
    setError('');
    setIsLinkExpired(false);

    // Timeout guard to prevent infinite verifying state
    const TIMEOUT_MS = 15000;
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('auth/timeout')), TIMEOUT_MS);
    });

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }

      // ESSENTIAL: Sign in with email link (the critical auth operation)
      const result = await Promise.race([
        signInWithEmailLink(auth, emailToUse, window.location.href),
        timeoutPromise,
      ]);

      window.clearTimeout(timeoutId);

      // Validate stored email matches authenticated user to prevent tampering
      if (result.user.email?.toLowerCase() !== emailToUse.toLowerCase()) {
        throw new Error('Email mismatch: stored email does not match authenticated user');
      }

      const additionalUserInfo = getAdditionalUserInfo(result);
      const newUser = additionalUserInfo?.isNewUser ?? false;
      setIsNewUser(newUser);

      // SHOW SUCCESS IMMEDIATELY - essential auth is complete
      setShowVerifyingModal(false);
      setShowSuccessModal(true);
      setShowEmailDialog(false);
      setIsProcessing(false);
      setAuthComplete(true);

      // Keep success modal brief, then clear flags
      setTimeout(() => {
        setShowSuccessModal(false);
        setAuthComplete(false);
      }, 1500);

      // BACKGROUND: Handle non-essential tasks without blocking UI
      // Profile creation and cleanup happen asynchronously in the background
      (async () => {
        try {
          if (newUser) {
            await createUserProfileSafely(result.user);
            window.localStorage.setItem('showWelcomeModal', 'true');
          }
        } catch (profileError) {
          console.error('[EmailLinkHandler] Profile creation failed:', profileError);
        } finally {
          // Clean up email and URL
          window.localStorage.removeItem('emailForSignIn');
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      })();

      // DON'T navigate - let AuthContext detect the auth state change
      // and handle user creation + welcome modal, then app will load naturally

    } catch (error) {
      console.error('[EmailLinkHandler] Sign-in failed:', error.code, error.message);

      window.clearTimeout(timeoutId);

      // Handle specific error cases with user-friendly messages
      let errorMessage = '';
      let linkExpired = false;

      if (error.code === 'auth/expired-action-code') {
        errorMessage = t('dialogs:linkExpiredAfter60Min');
        linkExpired = true;
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = t('dialogs:linkAlreadyUsed');
        linkExpired = true;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('dialogs:invalidEmailProvided');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('dialogs:networkError');
      } else if (error.message === 'auth/timeout') {
        errorMessage = t('dialogs:signingInTakingLonger');
      } else if (error.message === 'Email mismatch: stored email does not match authenticated user') {
        errorMessage = t('dialogs:securityCheckFailed');
        linkExpired = true;
      } else {
        errorMessage = t('dialogs:signInFailed', { error: error.message });
        linkExpired = true;
      }

      setError(errorMessage);
      setIsLinkExpired(linkExpired);
      setIsProcessing(false);
      setShowVerifyingModal(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError(t('dialogs:validateEmailAddress'));
      return;
    }

    // Show verifying modal when email is submitted manually
    setShowVerifyingModal(true);
    setUserEmail(email);
    await new Promise(resolve => setTimeout(resolve, 800));

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

  const handleRequestNewLink = async () => {
    setError('');
    setResendMessage('');
    setResendSending(true);

    // Prefer known email sources in order of reliability
    const targetEmail = userEmail || email || window.localStorage.getItem('emailForSignIn');

    if (!targetEmail) {
      setError(t('dialogs:enterEmailToRequestLink'));
      setResendSending(false);
      setIsLinkExpired(false);
      return;
    }

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();
      await sendSignInLinkToEmail(auth, targetEmail, actionCodeSettings);

      // Persist for subsequent link handling
      window.localStorage.setItem('emailForSignIn', targetEmail);

      setResendMessage(t('dialogs:newSignInLinkSentTo', { email: targetEmail }));
      setIsLinkExpired(false);
    } catch (sendError) {
      console.error('[EmailLinkHandler] Resend failed:', sendError.code, sendError.message);
      if (sendError.code === 'auth/too-many-requests') {
        setError(t('dialogs:tooManyRequestsWait'));
      } else if (sendError.code === 'auth/network-request-failed') {
        setError(t('dialogs:networkError'));
      } else {
        setError(t('dialogs:couldNotResendMagicLink'));
      }
    } finally {
      setResendSending(false);
    }
  };

  // Show full-screen verifying modal during authentication
  if (showVerifyingModal) {
    return (
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9998 } },
          paper: { sx: { zIndex: 9999, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } },
        }}
      >
        <DialogContent sx={{ p: 5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.7, transform: 'scale(1.05)' },
              },
            }}
          >
            <CircularProgress size={40} sx={{ color: 'common.white' }} />
          </Box>

          <Typography variant="h5" gutterBottom fontWeight="700">
            {t('dialogs:signingYouIn')}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t('dialogs:verifyingMagicLink')}
          </Typography>

          <Box
            sx={{
              p: 2,
              mt: 3,
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: 'primary.main',
              fontWeight: 600,
            }}
          >
            {userEmail}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
            {t('dialogs:pleaseWaitSecurelyAuthenticate')}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // Show success confirmation modal
  if (showSuccessModal) {
    return (
      <Dialog
        open={true}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9998 } },
          paper: { sx: { zIndex: 9999, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } },
        }}
      >
        <DialogContent sx={{ p: 5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 3,
              animation: 'successPop 0.5s ease-out',
              '@keyframes successPop': {
                '0%': { transform: 'scale(0)', opacity: 0 },
                '50%': { transform: 'scale(1.1)' },
                '100%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48, color: 'common.white' }} />
          </Box>

          <Typography variant="h5" gutterBottom fontWeight="700" color="success.main">
            {isNewUser ? t('dialogs:welcomeNew') : t('dialogs:welcomeBack')}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {isNewUser
              ? t('dialogs:accountCreatedSuccessfully')
              : t('dialogs:signedInSuccessfully')}
          </Typography>

          <Box
            sx={{
              p: 2,
              mt: 3,
              bgcolor: 'rgba(46, 125, 50, 0.08)',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: 'success.main',
              fontWeight: 600,
            }}
          >
            {userEmail}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
            {t('dialogs:loadingTradingClock')}
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  // Show AuthModal2 if user needs to request new link
  if (showAuthModal) {
    return <AuthModal2 open={true} onClose={() => setShowAuthModal(false)} />;
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
            {t('dialogs:confirmYourEmail')}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('dialogs:enterEmailUsedForLink')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {resendMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {resendMessage}
            </Alert>
          )}

          <form onSubmit={handleEmailSubmit}>
            <TextField
              fullWidth
              type="email"
              label={t('dialogs:emailAddress')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              disabled={isProcessing || isLinkExpired || (resendMessage && !error)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              {resendMessage && !error ? (
                // Show "Got it" button after successful resend
                <Button
                  onClick={handleCancel}
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  {t('dialogs:gotIt')}
                </Button>
              ) : isLinkExpired ? (
                // Show "Request New Link" button for expired links
                <>
                  <Button
                    onClick={handleRequestNewLink}
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={resendSending}
                  >
                    {resendSending ? t('dialogs:sending') : t('dialogs:requestNewLink')}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outlined"
                    fullWidth
                    disabled={resendSending}
                  >
                    {t('actions:cancel')}
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
                    {t('actions:cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isProcessing}
                  >
                    {isProcessing ? <CircularProgress size={24} /> : t('dialogs:confirm')}
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
