/**
 * src/components/AdminButton.tsx
 * 
 * Purpose: Fixed floating Admin button at bottom-left corner of viewport.
 * Only visible to users with 'admin' or 'author' roles. Hidden on /admin page.
 * Positioned above mobile bottom nav on xs/sm, floats freely on md+.
 * 
 * Changelog:
 * v1.0.0 - 2026-02-06 - Initial implementation. Fixed button at bottom-left (z-index: 1300), respects mobile nav height via CSS variable.
 */

import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Tooltip, useTheme } from '@mui/material';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import { useAuth } from '../contexts/AuthContext';
import { MOBILE_BOTTOM_APPBAR_HEIGHT_PX } from './AppBar';

export default function AdminButton() {
  const { t } = useTranslation(['common']);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Check if user has admin or author role
  const isAdminOrAuthor = useMemo(() => {
    if (!user) return false;
    const customClaims = (user as any).customClaims || {};
    return customClaims.admin === true || customClaims.author === true;
  }, [user]);

  // Hide on /admin page
  if (!isAdminOrAuthor || location.pathname === '/admin') {
    return null;
  }

  return (
    <Tooltip title={t('common:navigation.admin')}>
      <Box
        sx={{
          position: 'fixed',
          bottom: {
            xs: `calc(16px + ${MOBILE_BOTTOM_APPBAR_HEIGHT_PX}px + env(safe-area-inset-bottom))`,
            md: '16px',
          },
          left: '16px',
          zIndex: 1300,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AdminPanelSettingsRoundedIcon />}
          onClick={() => navigate('/admin')}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            px: 1.5,
            py: 0.8,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 26px rgba(0,0,0,0.3)'
              : '0 10px 26px rgba(15,23,42,0.06)',
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark'
                ? '0 15px 32px rgba(0,0,0,0.4)'
                : '0 15px 32px rgba(15,23,42,0.12)',
            },
            '&:focus-visible': {
              outline: '2px solid #0ea5e9',
              outlineOffset: 3,
            },
          }}
        >
          {t('common:navigation.admin')}
        </Button>
      </Box>
    </Tooltip>
  );
}
