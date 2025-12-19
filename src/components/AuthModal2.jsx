/**
 * src/components/AuthModal2.jsx
 * 
 * Purpose: Benefits showcase authentication modal - "See what you get for free"
 * Conversion-optimized design emphasizing free platform value and features.
 * 
 * Features:
 * - Hero section highlighting free features and benefits
 * - Visual showcase of platform capabilities with icons
 * - Passwordless email link authentication (magic links)
 * - Social auth (Google, X/Twitter)
 * - Green gradient design (trust, growth, money themes)
 * - Mobile-first responsive design
 * 
 * Changelog:
 * v1.1.2 - 2025-12-17 - Allow magic link to auto-link with existing Google accounts instead of blocking cross-provider emails
 * v1.1.1 - 2025-12-17 - Centralized magic link continue URL to production https://time2.trade/ with secure dev fallback
 * v1.1.0 - 2025-12-17 - Updated to green gradients and benefits-focused copy
 * v1.0.0 - 2025-12-17 - Initial CTA-driven implementation with modern web app design
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import XIcon from '@mui/icons-material/X';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PublicIcon from '@mui/icons-material/Public';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
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

function EmailSentModal({ email, isNewUser, onClose }) {
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
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#018786',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
            boxShadow: '0 8px 24px rgba(1, 135, 134, 0.3)',
          }}
        >
          <Typography variant="h3">✉️</Typography>
        </Box>
        <Typography variant="h5" gutterBottom fontWeight="700">
          Check your email
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We sent a secure sign-in link to:
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" fontWeight="600">
            {email}
          </Typography>
        </Paper>

        {isNewUser && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              🎉 Welcome to Time 2 Trade!
            </Typography>
            <Typography variant="body2" component="div" sx={{ mt: 1 }}>
              1. Check your inbox for our email<br />
              2. Click the sign-in link<br />
              3. You&apos;re in! No password needed 🚀
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          Click the link in the email to {isNewUser ? 'activate your account and sign in' : 'sign in'}.
          {' '}The link expires in 60 minutes.
        </Typography>

        <Alert severity="warning" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="600" gutterBottom>
            📬 Not seeing the email?
          </Typography>
          <Typography variant="body2" component="div">
            • Check your <strong>spam or junk folder</strong><br />
            • Look for &quot;noreply@time2trade-app.firebaseapp.com&quot;<br />
            • Mark as &quot;Not Spam&quot; for future emails
          </Typography>
        </Alert>

        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
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
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: '#018786',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        >
          <CloudSyncIcon sx={{ fontSize: 40, color: 'white' }} />
        </Box>
        <Typography variant="h6" gutterBottom fontWeight="600">
          Verifying your email...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we sign you in.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthModal2({ open, onClose, initialMode = 'signup' }) {
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState('');

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
        setEmail(lastEmail);
      } else {
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

    if (cooldownSeconds > 0) {
      setErrorMsg(`Please wait ${cooldownSeconds} seconds before requesting a new link.`);
      return;
    }

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      const now = Date.now();
      localStorage.setItem('magicLinkLastSent', now.toString());
      localStorage.setItem('magicLinkEmail', email);
      setCooldownSeconds(60);
      setLastSentEmail(email);

      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('isNewUser', isSignup.toString());

      setShowEmailSentModal(true);
    } catch (error) {
      console.error('[AuthModal2] Send email link failed:', error.code, error.message);

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
    return <EmailSentModal email={email} isNewUser={isSignup} onClose={() => { setShowEmailSentModal(false); onClose(); }} />;
  }

  if (showVerifyingModal) {
    return <VerifyingModal onClose={() => setShowVerifyingModal(false)} />;
  }

  // Benefits always show the same content (signup view)
  const benefits = [
    {
      icon: <AccessTimeIcon />,
      primary: 'Real-time session tracking',
      secondary: 'Visualize all major trading sessions with our dual-circle interface'
    },
    {
      icon: <TrendingUpIcon />,
      primary: 'Live economic events',
      secondary: 'High-impact news from the same sources as MetaTrader platforms'
    },
    {
      icon: <PublicIcon />,
      primary: 'Multi-timezone aware',
      secondary: 'Automatic conversion to your preferred timezone for perfect timing'
    },
    {
      icon: <CloudSyncIcon />,
      primary: 'Cloud-synced settings',
      secondary: 'Access your custom sessions and preferences from any device'
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 2000 }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          }
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: 'text.secondary',
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' } }}>
          {/* Left Side: Hero/Benefits */}
          <Box
            sx={{
              flex: { xs: '0 0 auto', md: '0 0 45%' },
              bgcolor: '#018786',
              color: 'white',
              p: { xs: 4, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Logo/Brand */}
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}Time2Trade_Logo_White.svg`}
                  alt="Time 2 Trade"
                  style={{
                    width: '100%',
                    maxWidth: '50px',
                    height: 'auto',
                  }}
                />
              </Box>

              <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 2 }}>
                Everything Free.
              </Typography>

              <Typography variant="body1" sx={{ mb: 0, lineHeight: 1.7, fontSize: '1.05rem' }}>
                See what you get with a free Time 2 Trade account.
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
                No credit card. No trials. No limits.
              </Typography>
              {/* Benefits List */}
              <List sx={{ p: 0 }}>
                {benefits.map((benefit, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      px: 0,
                      py: 1.5,
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#018786',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {benefit.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="600" sx={{ color: 'white', mb: 0.5 }}>
                          {benefit.primary}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5 }}>
                          {benefit.secondary}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          {/* Right Side: Auth Form */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 4, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Main content wrapper - grows to push footer down */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h5" fontWeight="700" gutterBottom>
                {isSignup ? 'Get instant access' : 'Sign in to continue'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isSignup
                  ? 'Claim your free account - all premium features included'
                  : 'Access your personalized dashboard and synced settings'}
              </Typography>
              {/* Social Login Buttons */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
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
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
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
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  Continue with X
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  or use email
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
                    placeholder="you@example.com"
                    disabled={cooldownSeconds > 0}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />

                  {/* Cooldown Alert */}
                  {cooldownSeconds > 0 && lastSentEmail && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight="600" gutterBottom>
                        ✉️ Email sent to {lastSentEmail}
                      </Typography>
                      <Typography variant="body2">
                        Resend in <strong>{cooldownSeconds}s</strong>
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
                      bgcolor: '#018786',
                      boxShadow: '0 4px 14px rgba(1, 135, 134, 0.35)',
                      '&:hover': {
                        bgcolor: '#006665',
                        boxShadow: '0 6px 18px rgba(1, 135, 134, 0.45)',
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        boxShadow: 'none',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {cooldownSeconds > 0
                      ? `Resend in ${cooldownSeconds}s`
                      : isSignup ? 'Get Free Access Now →' : '✉️ Send Sign-In Link'
                    }
                  </Button>
                </Stack>
              </Box>
            </Box>

            {/* Toggle and Footer - fixed to bottom */}
            <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 0 } }}>
              <Typography variant="body2" color="text.secondary">
                {isSignup ? 'Already have an account?' : 'New to Time 2 Trade?'}
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
                    color: 'success.dark',
                    fontWeight: 700,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {isSignup ? 'Sign in' : 'Create free account →'}
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
                    mt: 1.5,
                    '&:hover': {
                      textDecoration: 'underline',
                      color: 'primary.main',
                    },
                  }}
                >
                  Need to reset your password?
                </Link>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
                Protected by enterprise-grade encryption
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

EmailSentModal.propTypes = {
  email: PropTypes.string.isRequired,
  isNewUser: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

VerifyingModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

AuthModal2.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['signup', 'signin']),
};
