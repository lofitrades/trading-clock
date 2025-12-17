/**
 * src/components/LoginPage.jsx
 * 
 * Purpose: Standalone login page component for /login route.
 * Enterprise-grade design with passwordless email link authentication.
 * Mobile-first, fully responsive, with verification state management.
 * 
 * Features:
 * - Passwordless email link authentication (magic links)
 * - Social auth (Google, X/Twitter placeholder)
 * - Clean, centered design inspired by enterprise apps
 * - Email verification states
 * - Mobile-first responsive design
 * - Integration with forgot password flow
 * 
 * Changelog:
 * v1.0.1 - 2025-12-16 - Removed unused variables, escaped apostrophe, and kept API surface unchanged.
 * v1.0.0 - 2025-12-16 - Initial implementation with passwordless auth
 */

import { useState } from 'react';
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
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  // showPassword is not used in passwordless flow; keep state removed to satisfy lint
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isVerifying] = useState(false); // state retained for future verification flow

  // Email link sign-in is now handled globally by EmailLinkHandler component

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Check if email already has sign-in methods
      const signInMethods = await fetchSignInMethodsForEmail(auth, email).catch(() => []);
      
      // If user already exists with different provider, inform them
      if (!isSignup && signInMethods.length > 0 && !signInMethods.includes('emailLink')) {
        const providers = signInMethods.map(method => {
          if (method.includes('google')) return 'Google';
          if (method.includes('facebook')) return 'Facebook';
          if (method.includes('twitter')) return 'X/Twitter';
          if (method === 'password') return 'password';
          return method;
        }).join(', ');
        
        setErrorMsg(`This email is registered with ${providers}. Please use that method to sign in, or create a new account with a different email.`);
        return;
      }

      const actionCodeSettings = {
        // Use production URL when deployed, localhost for development  
        url: window.location.hostname === 'localhost'
          ? 'http://localhost:5173/trading-clock/'
          : 'https://lofitrades.github.io/trading-clock/',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      window.localStorage.setItem('isNewUser', isSignup.toString());
      setSuccessMsg(isSignup 
        ? 'Check your email! We sent you a secure link to create your account.' 
        : 'Check your email! We sent you a secure sign-in link.');
    } catch (error) {
      console.error('Send email link error:', error);
      
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
        // X/Twitter placeholder - show message
        setErrorMsg('Twitter/X login coming soon!');
        return;
      }
      
      await signInWithPopup(auth, provider);
      setSuccessMsg(getSuccessMessage('login'));
      setTimeout(() => navigate('/'), 1000);
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
            {/* Logo/Brand */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  T2T
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignup 
                  ? 'Get started with Time 2 Trade - no password required!' 
                  : 'Sign in to access your trading clock and sessions.'}
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

            {/* Signup/Login Toggle */}
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
              <Box sx={{ mt: 1, display: 'flex', gap: 2, justifyContent: 'center' }}>
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
          </Paper>
        </Container>
      </Box>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </>
  );
}
