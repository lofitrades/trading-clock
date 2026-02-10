/**
 * src/components/WelcomeModal.jsx
 * 
 * Purpose: First-time user onboarding modal.
 * Displays welcome message and quick start guide for new users.
 * 
 * Features:
 * - Welcome message
 * - Quick feature overview
 * - Getting started tips
 * - Default events reminder note
 * - Dismissible (shown once)
 * 
 * Changelog:
 * v1.3.0 - 2026-02-09 - BEP i18n: Migrated ALL hardcoded strings to welcome namespace (quickStartGuide,
 *                       tradingClock, economicEvents, customizeExperience, proFeatures, getStarted,
 *                       defaultEventsNote). Zero hardcoded client-facing copy remains.
 * v1.2.0 - 2026-01-24 - Phase 2 i18n migration - Added useTranslation hook with 'welcome' namespace. Replaced WELCOME_COPY hardcoded strings with t() calls (headline, confirmation, multiProvider). Updated 3 strings to i18n keys.
 * v1.1.1 - 2026-01-15 - Modal layering: keep backdrop behind paper and ensure modal stacks above AppBar.
 * v1.1.0 - 2025-12-22 - Use centralized welcome copy shared across auth providers.
 * v1.0.1 - 2025-12-16 - Added PropTypes and removed unused imports.
 * v1.0.0 - 2025-12-16 - Initial implementation
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SettingsIcon from '@mui/icons-material/Settings';

export default function WelcomeModal({ onClose, userEmail }) {
  const { t } = useTranslation('welcome');
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: 1701 }}
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, sm: 5 } }}>
        {/* Welcome Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
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
              mb: 2,
            }}
          >
            <Typography variant="h3" sx={{ color: 'common.white' }}>
              🎉
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            {t('headline')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('confirmation')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('multiProvider')}
          </Typography>
          {userEmail && (
            <Typography variant="body2" color="primary.main" fontWeight="600" sx={{ mt: 1 }}>
              {userEmail}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quick Start Guide */}
        <Typography variant="h6" fontWeight="600" gutterBottom>
          {t('quickStartGuide')}
        </Typography>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <AccessTimeIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                {t('tradingClock')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('tradingClockDescription')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <EventNoteIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                {t('economicEvents')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('economicEventsDescription')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <SettingsIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                {t('customizeExperience')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('customizeExperienceDescription')}
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Pro Features Teaser */}
        <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
            {t('proFeatures')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('proFeaturesDescription')}
          </Typography>
        </Box>

        {/* Default Events Note */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, textAlign: 'center' }}>
          {t('defaultEventsNote')}
        </Typography>

        {/* CTA Button */}
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {t('getStarted')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

WelcomeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  userEmail: PropTypes.string,
};
