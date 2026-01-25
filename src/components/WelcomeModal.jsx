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
 * - Dismissible (shown once)
 * 
 * Changelog:
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
            <Typography variant="h3" sx={{ color: 'white' }}>
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
          Quick Start Guide
        </Typography>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <AccessTimeIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                Trading Clock
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View real-time market sessions (Tokyo, London, New York) on an interactive clock.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <EventNoteIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                Economic Events
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track high-impact economic events and their potential market effects.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <SettingsIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                Customize Your Experience
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click the settings icon to customize sessions, colors, and timezones.
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Pro Features Teaser */}
        <Box sx={{ bgcolor: 'primary.light', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
            ✨ Pro Features Coming Soon
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Custom alerts, advanced analytics, and API access will be available with premium plans.
          </Typography>
        </Box>

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
          Get Started
        </Button>
      </DialogContent>
    </Dialog>
  );
}

WelcomeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  userEmail: PropTypes.string,
};
