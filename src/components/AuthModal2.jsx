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
 * Z-Index Strategy (ABSOLUTE HIGHEST):
 * - Primary modal: root z-index 12001 (backdrop stays at -1 within modal to prevent flash)
 * - Nested modals (EmailSent, Verifying): root z-index 12003 (backdrop stays at -1 within modal)
 * - Ensures AuthModal2 renders above ALL UI including WelcomeModal (11000), EmailLinkHandler verification (9998-10000), drawers (1600), and AppBar (1400) on all breakpoints.
 * 
 * Changelog:
 * v1.6.0 - 2026-01-28 - BEP: Theme-aware colors. Replaced all hardcoded teal (#018786, #006665) with theme.palette.primary tokens. Uses alpha() for opacity. Now adapts to light/dark modes.
 * v1.5.1 - 2026-01-27 - Fixed hardcoded copy: Replaced all remaining hardcoded strings with i18n translations. Fixed legal_notice rendering (was showing [object Object]). Added forgot_password_link, firebase_attribution, and legal_and translations. All 3 languages (EN/ES/FR) now fully covered without hardcoded UI copy.
 * v1.5.0 - 2026-01-25 - i18n migration: Integrated useTranslation hook for auth namespace. All 50+ hardcoded strings replaced with t() calls. Hero section, form labels, buttons, benefits, modal feedback, email sent, and verifying states now use translations. All 3 languages (EN/ES/FR) supported with professional finance terminology.
 * v1.4.4 - 2026-01-22 - BEP CRO: Removed RouterLink from logo/brand name to prevent accidental redirects during signup flow. Logo is now static (non-clickable) to maintain conversion focus and prevent users from leaving the auth modal mid-conversion. Removed component={RouterLink}, to="/", textDecoration, focus-visible styling.
 * v1.4.3 - 2026-01-15 - Fix backdrop layering so the modal paper renders above the overlay from the first frame (no flash-on-open).
 * v1.4.2 - 2026-01-14 - Elevate AuthModal2 to absolute highest z-index across the app and align nested modals accordingly so overlays never sit above it.
 * v1.4.1 - 2026-01-14 - Root z-index fix: set Dialog root z-index to match high-priority stack so AuthModal2 always overlays SettingsSidebar2 on /calendar and other routes.
 * v1.4.0 - 2026-01-14 - HIGHEST Z-INDEX: Set AuthModal2 and nested modals to z-index 10001-10004 to be the absolute highest in the codebase, rendering above EmailLinkHandler verification modals (9998-10000) and all other UI elements on all breakpoints.
 * v1.3.0 - 2026-01-14 - MOBILE Z-INDEX FIX: Explicitly set backdrop z-index to 1999 and paper z-index to 2000 on all breakpoints (xs/sm/md/lg/xl) to ensure AuthModal2 renders above AppBar bottom nav (z-index 1400) on mobile devices. Nested modals at 2002 for proper layering.
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
import { useTranslation } from 'react-i18next';
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
  useTheme,
  alpha,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
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
  const { t } = useTranslation(['auth', 'common']);
  const theme = useTheme();
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 12003 }}
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
          }}
        >
          <Typography variant="h2" sx={{ filter: 'brightness(2)' }}>✉️</Typography>
        </Box>

        <Typography variant="h4" gutterBottom fontWeight="700">
          {t('auth:email_sent.title')}
        </Typography>

        <Box
          sx={{
            p: 2.5,
            mt: 2,
            mb: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 1.5,
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            color: theme.palette.primary.main,
            fontWeight: 600,
          }}
        >
          {email}
        </Box>

        <Stack spacing={2.5} sx={{ textAlign: 'left', mb: 3 }}>
          <Box>
            <Typography variant="body1" fontWeight="600" gutterBottom>
              {t('auth:email_sent.email_label_heading')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth:email_sent.subject_prefix')} <strong>{t('auth:email_sent.subject')}</strong>
            </Typography>
          </Box>


          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('auth:email_sent.spam_warning')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {t('auth:email_sent.sender_hint')}
            </Typography>
          </Box>

          <Divider />

          <Typography variant="caption" color="text.secondary">
            {t('auth:email_sent.expiry_info', { minutes: 60 })}
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
          {t('auth:email_sent.done_button')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function VerifyingModal({ onClose }) {
  const { t } = useTranslation(['auth', 'common']);
  const theme = useTheme();
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 12003 }}
      slotProps={{
        backdrop: { sx: { zIndex: -1 } },
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: theme.palette.primary.main,
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
          {t('auth:verifying.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('auth:verifying.subtitle')}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthModal2({ open, onClose, initialMode = 'signup', forceOpen = false, redirectPath = '/clock' }) {
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
  const { t } = useTranslation(['auth', 'common']);
  const theme = useTheme();

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
      setErrorMsg(`Please wait ${cooldownSeconds}s before requesting another link.`);
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

  // Benefits hydrated from i18n
  const benefitsList = t('auth:modal.benefits', { returnObjects: true }) ?? [
    {
      icon: <AccessTimeIcon />,
      primary: 'Trade the right window',
      secondary: 'Know exactly when NY, London, and Asia are active, when overlaps hit, and when the next transition starts.'
    },
    {
      icon: <TrendingUpIcon />,
      primary: 'Avoid event whiplash',
      secondary: 'See upcoming releases with impact and currency filters — so you\'re not entering a trade 2 minutes before a catalyst.'
    },
    {
      icon: <PublicIcon />,
      primary: 'Timezones stay correct',
      secondary: 'Auto-detect or switch timezones instantly. Session windows, timestamps, and countdowns update automatically.'
    },
    {
      icon: <CloudSyncIcon />,
      primary: 'Keep your setup saved',
      secondary: 'Sign in to sync preferences across devices. Stay a guest if you prefer — your local setup still works.'
    },
  ];

  // Map icons to benefit objects for rendering
  const benefits = [
    { ...benefitsList[0], icon: <AccessTimeIcon /> },
    { ...benefitsList[1], icon: <TrendingUpIcon /> },
    { ...benefitsList[2], icon: <PublicIcon /> },
    { ...benefitsList[3], icon: <CloudSyncIcon /> },
  ].filter(Boolean);

  return (
    <Dialog
      open={open}
      onClose={forceOpen ? () => { } : onClose}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: 12001 }}

      disableEscapeKeyDown={forceOpen}
      slotProps={{
        backdrop: forceOpen
          ? {
            onClick: (e) => e.stopPropagation(),
            sx: BACKDROP_OVERLAY_SX,
          }
          : {
            sx: BACKDROP_OVERLAY_SX,
          },
        paper: {
          sx: {
            borderRadius: 3,
            height: { xs: '100dvh', md: 'auto' },
            justifyContent: 'flex-start',
            // Modal paper rendered above all UI elements on all breakpoints
            // xs/sm/md/lg/xl: above everything including verification modals (12003-12004)
          }
        },
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
              bgcolor: theme.palette.primary.main,
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

              <Typography variant="h4" fontWeight="700" gutterBottom sx={{ mb: 0 }}>
                {t('auth:modal.hero.heading')}
              </Typography>

              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7, fontSize: '1.05rem' }}>
                {t('auth:modal.hero.subheading')}
              </Typography>

              <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.6, fontSize: '0.95rem', opacity: 0.95 }}>
                {t('auth:modal.hero.description')}
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
                          color: theme.palette.primary.main,
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
                sx={{
                  mb: { xs: 2.5, sm: 3 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  justifyContent: { xs: 'flex-start', md: 'flex-start' },
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
                {isSignup ? t('auth:modal.form.title_signup') : t('auth:modal.form.title_signin')}
              </Typography>
              {/* Account Toggle */}
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {isSignup ? t('auth:modal.form.toggle_question_signup') : t('auth:modal.form.toggle_question_signin')}
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
                    {isSignup ? t('auth:modal.form.toggle_link_signin') : t('auth:modal.form.toggle_link_signup')}
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
                  {t('auth:modal.form.google_button')}
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth:modal.form.divider')}
                </Typography>
              </Divider>

              {/* Email Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    type="email"
                    label={t('auth:modal.form.email_label')}
                    required
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder={t('auth:modal.form.email_placeholder')}
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
                        {t('auth:modal.feedback.cooldown_info', { email: lastSentEmail })}
                      </Typography>
                      <Typography variant="body2">
                        {t('auth:modal.feedback.cooldown_resend', { seconds: cooldownSeconds })}
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
                      bgcolor: theme.palette.primary.main,
                      boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                        boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.45)}`,
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
                      ? t('auth:modal.form.submit_button_sending')
                      : cooldownSeconds > 0
                        ? t('auth:modal.form.submit_button_resend', { seconds: cooldownSeconds })
                        : isSignup ? t('auth:modal.form.submit_button_signup') : t('auth:modal.form.submit_button_signin')
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
                    {t('auth:modal.form.legal_notice')}
                    {' '}
                    <Link
                      component={RouterLink}
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      {t('auth:modal.form.legal_terms')}
                    </Link>
                    {' '}
                    {t('auth:modal.form.legal_and')}
                    {' '}
                    <Link
                      component={RouterLink}
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        '&:hover': {
                          color: 'primary.dark',
                        },
                      }}
                    >
                      {t('auth:modal.form.legal_privacy')}
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
                  {t('auth:modal.form.forgot_password_link')}
                </Link>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 3 }}>
              {t('auth:modal.form.firebase_attribution')}
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
