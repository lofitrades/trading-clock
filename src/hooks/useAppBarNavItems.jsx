/**
 * src/hooks/useAppBarNavItems.js
 * 
 * Purpose: Centralized hook that returns standardized AppBar navigation items with full i18n support.
 * Ensures consistent nav structure across all pages (Clock, Calendar, About).
 * All labels use translation keys from common.json namespace.
 * 
 * Usage:
 * const navItems = useAppBarNavItems({
 *   onOpenAuth: handleOpenAuth,
 *   onOpenSettings: handleOpenSettings,
 *   onOpenContact: handleOpenContact,
 * });
 * 
 * Changelog:
 * v1.0.0 - 2026-01-27 - PHASE 4 BEP STANDARDIZATION: Created centralized hook for AppBar nav items.
 * All navigation items use i18n keys from common:navigation namespace. Items include:
 * Clock (to:/clock), Calendar (to:/calendar), About (to:/about), Contact (onClick), 
 * Settings (onClick on auth), and Sign In (onClick on guest). Hook accepts callbacks
 * (onOpenAuth, onOpenSettings, onOpenContact) to maintain flexibility for page-specific handlers
 * while keeping nav structure consistent. Replaces hardcoded navItems across App.jsx, CalendarPage.jsx, 
 * and AboutPage.jsx for single source of truth.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';

export default function useAppBarNavItems({ onOpenAuth, onOpenSettings, onOpenContact }) {
  const { t } = useTranslation(['common']);

  const navItems = useMemo(() => [
    {
      id: 'clock',
      label: t('common:navigation.clock'),
      shortLabel: t('common:navigation.clock'),
      to: '/clock',
      icon: <AccessTimeRoundedIcon fontSize="small" />,
      ariaLabel: t('common:navigation.clock'),
    },
    {
      id: 'calendar',
      label: t('common:navigation.calendar'),
      shortLabel: t('common:navigation.calendar'),
      to: '/calendar',
      icon: <CalendarMonthRoundedIcon fontSize="small" />,
      ariaLabel: t('common:navigation.calendar'),
    },
    {
      id: 'about',
      label: t('common:navigation.about'),
      shortLabel: t('common:navigation.about'),
      to: '/about',
      icon: <InfoRoundedIcon fontSize="small" />,
      ariaLabel: t('common:navigation.about'),
    },
    {
      id: 'contact',
      label: t('common:navigation.contact'),
      shortLabel: t('common:navigation.contact'),
      onClick: onOpenContact,
      icon: <SupportAgentRoundedIcon fontSize="small" />,
      ariaLabel: t('common:navigation.contact'),
    },
    {
      id: 'settings',
      label: t('common:navigation.settings'),
      shortLabel: t('common:navigation.settings'),
      onClick: onOpenSettings,
      icon: <SettingsRoundedIcon fontSize="small" />,
      ariaLabel: t('common:navigation.settings'),
    },
    {
      id: 'signin',
      label: t('common:navigation.unlock'),
      shortLabel: t('common:navigation.unlock'),
      icon: <LockOpenRoundedIcon fontSize="small" />,
      onClick: onOpenAuth,
      primary: true,
      ariaLabel: t('common:navigation.unlockAllFeatures'),
    },
  ], [t, onOpenAuth, onOpenSettings, onOpenContact]);

  return navItems;
}
