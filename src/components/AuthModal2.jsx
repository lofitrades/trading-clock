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
 * v1.2.2 - 2026-01-08 - Reverted to Firebase sendSignInLinkToEmail with custom SMTP; removed SendGrid Cloud Function dependency
 * v1.2.1 - 2026-01-07 - Add redirectPath support so calendar embeds keep users on /calendar after auth; reuse same path for magic link continue URLs.
 * v1.2.0 - 2025-12-22 - Show welcome modal for new Google signups and centralize welcome copy.
 * v1.1.8 - 2025-12-22 - Swap logo to main multicolor transparent PNG to match brand kit.
 * v1.1.7 - 2025-12-22 - Swap hero/logo asset to teal transparent PNG to match brand usage.
 * v1.1.6 - 2025-12-22 - Moved brand logo + name above the form on the light pane for mobile-first layout.
 * v1.1.5 - 2025-12-22 - Added forceOpen mode to require authentication without dismiss controls.
 * v1.1.4 - 2025-12-22 - Redirect OAuth success to /app after closing modal.
 * v1.1.3 - 2025-12-22 - Replaced missing logo reference with official secondary white transparent asset for teal hero pane.
 * v1.1.2 - 2025-12-17 - Allow magic link to auto-link with existing Google accounts instead of blocking cross-provider emails
 * v1.1.1 - 2025-12-17 - Centralized magic link continue URL to production https://time2.trade/ with secure dev fallback
 * v1.1.0 - 2025-12-17 - Updated to green gradients and benefits-focused copy
 * v1.0.0 - 2025-12-17 - Initial CTA-driven implementation with modern web app design
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PublicIcon from '@mui/icons-material/Public';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import {
  sendSignInLinkToEmail,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import { getMagicLinkActionCodeSettings } from '../utils/authLinkSettings';
import ForgotPasswordModal from './ForgotPasswordModal';

const LOGO_SECONDARY_WHITE_TRANSPARENT = `${import.meta.env.BASE_URL}logos/png/Time2Trade_Logo_Main_Multicolor_Transparent_1080.png`;

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
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: '#018786',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
            boxShadow: '0 4px 16px rgba(1, 135, 134, 0.25)',
          }}
        >
          <Typography variant="h2" sx={{ filter: 'brightness(2)' }}>✉️</Typography>
        </Box>

        <Typography variant="h4" gutterBottom fontWeight="700">
          Check your email
        </Typography>

        <Box
          sx={{
            p: 2.5,
            mt: 2,
            mb: 3,
            bgcolor: 'rgba(1, 135, 134, 0.08)',
            borderRadius: 1.5,
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            color: '#018786',
            fontWeight: 600,
          }}
        >
          {email}
        </Box>

        <Stack spacing={2.5} sx={{ textAlign: 'left', mb: 3 }}>
          <Box>
            <Typography variant="body1" fontWeight="600" gutterBottom>
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

export default function AuthModal2({ open, onClose, initialMode = 'signup', forceOpen = false, redirectPath = '/calendar' }) {
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(initialMode === 'signup');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [showVerifyingModal, setShowVerifyingModal] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const navigate = useNavigate();

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

    setIsSendingEmail(true);

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings(redirectPath);

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
    } finally {
      setIsSendingEmail(false);
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

      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalInfo?.isNewUser ?? false;

      if (isNewUser) {
        window.localStorage.setItem('showWelcomeModal', 'true');
        window.localStorage.setItem('isNewUser', 'true');
      }
      setSuccessMsg(getSuccessMessage('login'));
      setTimeout(() => {
        onClose();
        navigate(redirectPath);
      }, 800);
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
      onClose={forceOpen ? () => { } : onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 2000 }}
      disableEscapeKeyDown={forceOpen}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          }
        },
        backdrop: forceOpen ? { onClick: (e) => e.stopPropagation() } : undefined,
      }}
    >
      {!forceOpen && (
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
      )}

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

              <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 2 }}>
                Everything Free.
              </Typography>

              <Typography variant="body1" sx={{ mb: 0, lineHeight: 1.7, fontSize: '1.05rem' }}>
                See what you get with a free Time 2 Trade account. No credit card. No trials. No limits.
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
              <Box
                component={RouterLink}
                to="/"
                sx={{
                  mb: { xs: 2.5, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  textDecoration: 'none',
                  color: 'inherit',
                  justifyContent: { xs: 'flex-start', md: 'flex-start' },
                  '&:focus-visible': {
                    outline: '2px solid rgba(0,0,0,0.5)',
                    outlineOffset: 4,
                    borderRadius: 1,
                  },
                }}
              >
                <img
                  src={LOGO_SECONDARY_WHITE_TRANSPARENT}
                  alt="Time 2 Trade"
                  style={{
                    width: '100%',
                    maxWidth: '52px',
                    height: 'auto',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="h7" fontWeight="700" sx={{ color: 'primary.text' }}>
                  Time 2 Trade
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="700" gutterBottom>
                {isSignup ? 'Get instant access' : 'Sign in to continue'}
              </Typography>
              {/* Account Toggle */}
              <Box sx={{ textAlign: 'left', mb: 3 }}>
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
              </Box>

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
                    disabled={cooldownSeconds > 0 || isSendingEmail}
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
                    {isSendingEmail
                      ? 'Sending...'
                      : cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : isSignup ? 'Get Free Access Now →' : '✉️ Send Sign-In Link'
                    }
                  </Button>

                  {/* Legal Consent Notice */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      textAlign: 'left',
                      lineHeight: 1.5,
                      px: { xs: 1, sm: 2 },
                      mt: 1,
                    }}
                  >
                    By proceeding, you agree to our{' '}
                    <Link
                      component={RouterLink}
                      to="/terms"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      component={RouterLink}
                      to="/privacy"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Forgot Password Link - fixed to bottom */}
            {!isSignup && (
              <Box sx={{ textAlign: 'center', mt: { xs: 4, md: 0 } }}>
                <Link
                  component="button"
                  type="button"
                  variant="caption"
                  onClick={() => setShowForgotModal(true)}
                  sx={{
                    textDecoration: 'none',
                    color: 'text.secondary',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: 'primary.main',
                    },
                  }}
                >
                  Need to reset your password?
                </Link>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 3 }}>
              Protected by enterprise-grade encryption
            </Typography>
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

AuthModal2.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['signup', 'signin']),
  forceOpen: PropTypes.bool,
  redirectPath: PropTypes.string,
};
