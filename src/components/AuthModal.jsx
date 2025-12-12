/* src/components/AuthModal.jsx */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import ForgotPasswordModal from './ForgotPasswordModal';

function ActivationModal({ onClose }) {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { zIndex: 1500 } },
        paper: { sx: { zIndex: 1501 } },
      }}
    >
      <DialogContent>
        <Typography>
          Please follow the steps we sent via email to activate your account.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);

  const handleOverlayClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Social login remains unchanged.
  const handleSocialLogin = async (providerType) => {
    setErrorMsg('');
    setSuccessMsg('');
    let provider;
    try {
      if (providerType === 'google') provider = new GoogleAuthProvider();
      else if (providerType === 'facebook') provider = new FacebookAuthProvider();
      else if (providerType === 'twitter') provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMsg(getSuccessMessage('login'));
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err.code));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check if email is verified before proceeding.
        if (!userCredential.user.emailVerified) {
          setErrorMsg("Please verify your email address before logging in.");
          await signOut(auth);
          return;
        }
        setSuccessMsg(getSuccessMessage('login'));
        setTimeout(() => onClose(), 1000);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccessMsg(getSuccessMessage('signup'));
        setShowActivationModal(true);
      }
    } catch (err) {
      const code = err.code;
      // Automatically sign up if user is not found in login view.
      if (isLogin && code === 'auth/user-not-found') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(userCredential.user);
          setSuccessMsg('No account was found, so we created one for you.');
          setShowActivationModal(true);
        } catch (signUpErr) {
          setErrorMsg(getFriendlyErrorMessage(signUpErr.code));
        }
      } else if (!isLogin && code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccessMsg('That email is already registered. You have been logged in.');
          setTimeout(() => onClose(), 1500);
        } catch (signInErr) {
          setErrorMsg(getFriendlyErrorMessage(signInErr.code));
        }
      } else {
        setErrorMsg(getFriendlyErrorMessage(code));
      }
    }
  };

  if (showForgotModal) {
    return <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />;
  }

  return (
    <>
      <Dialog 
        open={true} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        slotProps={{
          backdrop: { sx: { zIndex: 1500 } },
          paper: { sx: { zIndex: 1501 } },
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          {isLogin ? 'Login to access all Pro★ Features' : 'Create a free account to access all Pro★ Features'}
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* Social Login Buttons */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={() => handleSocialLogin('google')}
                sx={{
                  backgroundColor: '#DB4437',
                  '&:hover': { backgroundColor: '#C33D2E' },
                  textTransform: 'none',
                }}
              >
                Login with Google
              </Button>
              <Button
                variant="contained"
                fullWidth
                startIcon={<FacebookIcon />}
                onClick={() => handleSocialLogin('facebook')}
                sx={{
                  backgroundColor: '#4267B2',
                  '&:hover': { backgroundColor: '#365899' },
                  textTransform: 'none',
                }}
              >
                Login with Facebook
              </Button>
              <Button
                variant="contained"
                fullWidth
                startIcon={<XIcon />}
                onClick={() => handleSocialLogin('twitter')}
                sx={{
                  backgroundColor: '#000000',
                  '&:hover': { backgroundColor: '#333333' },
                  textTransform: 'none',
                }}
              >
                Login with X
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            {/* Email/Password Fields */}
            <Stack spacing={2}>
              <TextField
                type="email"
                label="Email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <TextField
                type="password"
                label="Password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />

              {errorMsg && (
                <Alert severity="error" onClose={() => setErrorMsg('')}>
                  {errorMsg}
                </Alert>
              )}
              {successMsg && (
                <Alert severity="success" onClose={() => setSuccessMsg('')}>
                  {successMsg}
                </Alert>
              )}

              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                {isLogin ? 'Login' : 'Create free account'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2, pt: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={toggleMode} sx={{ textTransform: 'none' }}>
              {isLogin ? 'Sign up' : 'Login'}
            </Button>
            <Button onClick={() => setShowForgotModal(true)} sx={{ textTransform: 'none' }}>
              Forgot password?
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {showActivationModal && (
        <ActivationModal onClose={() => { setShowActivationModal(false); onClose(); }} />
      )}
    </>
  );
}
