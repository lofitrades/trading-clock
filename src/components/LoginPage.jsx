/**
 * src/components/LoginPage.jsx
 * 
 * Purpose: Standalone login page component for /login route.
 * Enterprise-grade design with passwordless email link authentication.
 * Mobile-first, fully responsive, with verification state management.
 * 
 * Changelog:
 * v1.1.3 - 2026-01-08 - Reverted to Firebase sendSignInLinkToEmail with custom SMTP; removed SendGrid Cloud Function dependency
 * v1.1.2 - 2025-12-22 - Redirect social login success to /app instead of root for post-auth landing.
 * v1.1.1 - 2025-12-22 - Swapped text avatar with official secondary teal logo asset and aligned with brand hierarchy.
 * v1.1.0 - 2025-12-18 - Removed react-helmet-async in favor of lightweight client title updates for /app.
 * v1.0.3 - 2025-12-17 - Allow magic link to auto-link with existing Google accounts instead of blocking cross-provider emails
 * v1.0.2 - 2025-12-17 - Centralized magic link continue URL to production https://time2.trade/ with secure dev fallback
 * v1.0.1 - 2025-12-16 - Removed unused variables, escaped apostrophe, and kept API surface unchanged.
 * v1.0.0 - 2025-12-16 - Initial implementation with passwordless auth
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
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
import { buildSeoMeta } from '../utils/seoMeta';

const LOGIN_DESCRIPTION = 'Sign in or create your free Time 2 Trade account with passwordless email links to sync sessions, timezones, and settings across devices.';

const LOGO_SECONDARY_TEAL = `${import.meta.env.BASE_URL}logos/svg/Time2Trade_Logo_Secondary_TealOnWhite_1080.svg`;

const loginMeta = buildSeoMeta({
  title: 'Login | Time 2 Trade',
  description: LOGIN_DESCRIPTION,
  path: '/login',
});

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isVerifying] = useState(false);

  useEffect(() => {
    document.title = loginMeta.title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', loginMeta.description);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const actionCodeSettings = getMagicLinkActionCodeSettings();
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('isNewUser', isSignup.toString());
      setSuccessMsg(isSignup
        ? '✉️ Magic link sent! Check your email to create your account. No password needed—just click the link to sign in instantly.'
        : '✉️ Magic link sent! Check your email and click the sign-in link. No password required!');
    } catch (error) {
      if (error.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (error.code === 'auth/unauthorized-continue-uri') {
        setErrorMsg('Configuration error. Please contact support.');
      } else {
        setErrorMsg(getFriendlyErrorMessage(error.code));
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
      setTimeout(() => navigate('/app'), 1000);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err.code));
    }
  };

  if (isVerifying) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 3,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h5" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we sign you in.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src={LOGO_SECONDARY_TEAL}
                  alt="Time 2 Trade logo"
                  sx={{ width: 140, maxWidth: '60%', height: 'auto' }}
                  loading="lazy"
                />
              </Box>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignup
                  ? 'Get started with Time 2 Trade - no password required!'
                  : 'Sign in to access your trading clock and sessions.'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Already used Google with this email? We will link this magic link to that account automatically.
              </Typography>
            </Box>

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
                or
              </Typography>
            </Divider>

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
                />

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
                  sx={{
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  {isSignup ? 'Create account' : 'Send sign-in link'}
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

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {isSignup ? 'Already have an account?' : 'First time here?'}{' '}
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

            <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Protected by enterprise-grade encryption. All access is audited.
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Link href="#" variant="caption" color="text.secondary" underline="hover">
                  Privacy Policy
                </Link>
                <Typography variant="caption" color="text.secondary">
                  |
                </Typography>
                <Link href="#" variant="caption" color="text.secondary" underline="hover">
                  Terms of Use
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </>
  );
}
