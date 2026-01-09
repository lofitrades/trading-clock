/**
 * src/components/AuthModal.jsx
 * 
 * Purpose: Enterprise-grade authentication modal for passwordless login.
 * Clean, mobile-first design with email magic link authentication.
 * 
 * Features:
 * - Passwordless email link authentication (magic links)
 * - Social auth (Google, X/Twitter placeholder)
 * - Clean, centered design inspired by enterprise apps
 * - Email verification states
 * - Mobile-first responsive design
 * - Integration with forgot password flow
 * 
 * Note: AuthModal2.jsx offers a more CTA-driven, benefit-focused design variant.
 * 
 * Changelog:
 * v2.0.8 - 2026-01-08 - Reverted to Firebase sendSignInLinkToEmail with custom SMTP; removed SendGrid Cloud Function dependency
 * v2.0.7 - 2025-12-17 - Allow magic link to auto-link with existing Google accounts instead of blocking cross-provider emails
 * v2.0.6 - 2025-12-17 - Centralized magic link continue URL to production https://time2.trade/ with secure dev fallback
 * v2.0.5 - 2025-12-17 - Enhanced UX: improved spacing, visual hierarchy, and button styling
 * v2.0.4 - 2025-12-17 - Fixed overlay flash on open by using single z-index on Dialog following MUI best practices
 * v2.0.3 - 2025-12-17 - Increased z-index to 2000/2001 for highest stacking order above all drawers; App.jsx now closes all drawers before opening auth
 * v2.0.2 - 2025-12-16 - Raised dialog z-index above settings drawer and overlays for reliable stacking order
 * v2.0.1 - 2025-12-16 - ESLint compliance: PropTypes and escaped strings
 * v2.0.0 - 2025-12-16 - Complete redesign with passwordless auth, removed Facebook
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  Alert,
  Stack,
  Link,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import XIcon from '@mui/icons-material/X';
import {
  sendSignInLinkToEmail,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import { getMagicLinkActionCodeSettings } from '../utils/authLinkSettings';
import ForgotPasswordModal from './ForgotPasswordModal';

function EmailSentModal({ email, onClose }) {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 2000 }}
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'success.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
          }}
        >
          <Typography variant="h3" sx={{ filter: 'grayscale(1) brightness(2)' }}>✉️</Typography>
        </Box>

        <Typography variant="h5" gutterBottom fontWeight="700">
          Check your email
        </Typography>

        <Box
          sx={{
            p: 2,
            mt: 2,
            mb: 3,
            bgcolor: 'action.hover',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {email}
        </Box>

        <Stack spacing={2} sx={{ textAlign: 'left', mb: 3 }}>
          <Box>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              Click the link in the email to sign in.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subject: <strong>Sign in to Time 2 Trade</strong>
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              📬 Not in your inbox? Check your <strong>spam folder</strong>.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Look for emails from noreply@time2.trade
            </Typography>
          </Box>

          <Divider />

          <Typography variant="caption" color="text.secondary">
            ⏱️ This link expires in <strong>60 minutes</strong> and can only be used once.
          </Typography>
        </Stack>

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
    </Dialog >
  );
}

function VerifyingModal({ onClose }) {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 2000 }}
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Verifying your email...
        </Typography>
        <Typography color="text.secondary">
          Please wait while we sign you in.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState('');

  // Email link sign-in is now handled globally by EmailLinkHandler component

  // Rate limiting: Check for existing cooldown on mount and when modal opens
  useEffect(() => {
    if (!open) return;

    const lastSendTime = localStorage.getItem('magicLinkLastSent');
    const lastEmail = localStorage.getItem('magicLinkEmail');

    if (lastSendTime && lastEmail) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSendTime)) / 1000);
      const remaining = Math.max(0, 60 - elapsed);

      if (remaining > 0) {
        setCooldownSeconds(remaining);
        setLastSentEmail(lastEmail);
        setEmail(lastEmail); // Pre-fill the email field
      } else {
        // Cooldown expired, clear old data
        localStorage.removeItem('magicLinkLastSent');
        localStorage.removeItem('magicLinkEmail');
      }
    }
  }, [open]);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          // Cooldown complete
          localStorage.removeItem('magicLinkLastSent');
          localStorage.removeItem('magicLinkEmail');
          setLastSentEmail('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Enforce cooldown
    if (cooldownSeconds > 0) {
      setErrorMsg(`Please wait ${cooldownSeconds} seconds before requesting a new link.`);
      return;
    }

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      // Set cooldown and persist to localStorage
      const now = Date.now();
      localStorage.setItem('magicLinkLastSent', now.toString());
      localStorage.setItem('magicLinkEmail', email);
      setCooldownSeconds(60);
      setLastSentEmail(email);

      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('isNewUser', isSignup.toString());

      setShowEmailSentModal(true);
    } catch (error) {
      console.error('[AuthModal] Send email link failed:', error.code, error.message);

      if (error.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (error.code === 'auth/unauthorized-continue-uri') {
        setErrorMsg(`Domain not authorized. Add "${window.location.hostname}" to Firebase Console → Authentication → Settings → Authorized domains`);
      } else {
        setErrorMsg(getFriendlyErrorMessage(error.code) + ` (${error.code})`);
      }
    }
  };

  const handleSocialLogin = async (providerType) => {
    setErrorMsg('');
    setSuccessMsg('');

    let provider;
    try {
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerType === 'twitter') {
        provider = new TwitterAuthProvider();
        // X/Twitter placeholder - show message
        setErrorMsg('Twitter/X login coming soon!');
        return;
      }

      await signInWithPopup(auth, provider);
      setSuccessMsg(getSuccessMessage('login'));
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err.code));
    }
  };

  if (showForgotModal) {
    return <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />;
  }

  if (showEmailSentModal) {
    return <EmailSentModal email={email} onClose={() => { setShowEmailSentModal(false); onClose(); }} />;
  }

  if (showVerifyingModal) {
    return <VerifyingModal onClose={() => setShowVerifyingModal(false)} />;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 2000 }}
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
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
        {/* Logo/Brand */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2.5,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              T2T
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 1 }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {isSignup
              ? 'Get started with Time 2 Trade - no password required!'
              : 'Sign in to access your trading clock and sessions.'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Already used Google with this email? We will link this magic link to that account automatically.
          </Typography>
        </Box>

        {/* Social Login Buttons */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => handleSocialLogin('google')}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              textTransform: 'none',
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<XIcon />}
            onClick={() => handleSocialLogin('twitter')}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              textTransform: 'none',
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Continue with X
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            or
          </Typography>
        </Divider>

        {/* Email Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              type="email"
              label="Enter your email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              disabled={cooldownSeconds > 0}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            {/* Cooldown/Rate Limit Alert */}
            {cooldownSeconds > 0 && lastSentEmail && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="600" gutterBottom>
                  ✉️ Email already sent to {lastSentEmail}
                </Typography>
                <Typography variant="body2">
                  Resend available in <strong>{cooldownSeconds} seconds</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Check your inbox and spam folder while you wait.
                </Typography>
              </Alert>
            )}

            {errorMsg && (
              <Alert
                severity="error"
                onClose={() => setErrorMsg('')}
                sx={{ borderRadius: 2 }}
              >
                {errorMsg}
              </Alert>
            )}
            {successMsg && (
              <Alert
                severity="success"
                onClose={() => setSuccessMsg('')}
                sx={{ borderRadius: 2 }}
              >
                {successMsg}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={cooldownSeconds > 0}
              sx={{
                py: 1.75,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {cooldownSeconds > 0
                ? `Resend available in ${cooldownSeconds}s`
                : isSignup ? 'Create account' : 'Send sign-in link'
              }
            </Button>

            {isSignup && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="caption">
                  <strong>Password-free sign up!</strong> We&apos;ll email you a secure link.
                  Click it to create your account - no password needed.
                </Typography>
              </Alert>
            )}
          </Stack>
        </Box>

        {/* Signup/Login Toggle and Reset Password */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {isSignup ? 'Already have an account?' : 'First time here?'}
            {' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => {
                setIsSignup(!isSignup);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {isSignup ? 'Sign in' : 'Create account'}
            </Link>
          </Typography>

          {!isSignup && (
            <Link
              component="button"
              type="button"
              variant="caption"
              onClick={() => setShowForgotModal(true)}
              sx={{
                textDecoration: 'none',
                color: 'text.secondary',
                display: 'block',
                mt: 1,
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main',
                },
              }}
            >
              Need to reset your password?
            </Link>
          )}
        </Box>

        {/* Security Notice */}
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Protected by enterprise-grade encryption. All access is audited.
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="#"
              variant="caption"
              color="text.secondary"
              underline="hover"
            >
              Privacy Policy
            </Link>
            <Typography variant="caption" color="text.secondary">
              |
            </Typography>
            <Link
              href="#"
              variant="caption"
              color="text.secondary"
              underline="hover"
            >
              Terms of Use
            </Link>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

EmailSentModal.propTypes = {
  email: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

VerifyingModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

AuthModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
