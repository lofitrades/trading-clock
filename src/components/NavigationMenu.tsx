/**
 * src/components/NavigationMenu.tsx
 * 
 * Purpose: Shared responsive navigation menu used by marketing and app surfaces.
 * Matches the landing page navigation UI while supporting auth-aware menu items.
 * 
 * Changelog:
 * v1.0.3 - 2026-01-16 - Updated auth navigation target to /clock.
 * v1.0.2 - 2026-01-12 - Highlight active route menu item using theme primary color.
 * v1.0.1 - 2026-01-12 - UI: Reduce header vertical spacing for a tighter, mobile-first nav.
 * v1.0.0 - 2026-01-12 - Extracted responsive landing navigation into reusable component with AuthContext support.
 */

import React, { useMemo, useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';

type AuthContextValue = {
  isAuthenticated?: () => boolean;
};

type NavigationMenuProps = {
  brandLogoSrc?: string;
  onOpenPrimary?: () => void;
  onOpenContact?: () => void;
};

type NavLink = {
  id: string;
  label: string;
  href?: string;
  to?: string;
  onClick?: () => void;
};

const DEFAULT_BRAND_LOGO_SRC = '/logos/svg/Time2Trade_Logo_Main_Multicolor_Transparent_1080.svg';

export default function NavigationMenu({
  brandLogoSrc = DEFAULT_BRAND_LOGO_SRC,
  onOpenPrimary,
  onOpenContact,
}: NavigationMenuProps) {
  const theme = useTheme();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isAuthenticated } = useAuth() as AuthContextValue;

  const authed = Boolean(isAuthenticated?.());

  const openMobileNav = () => setMobileNavOpen(true);
  const closeMobileNav = () => setMobileNavOpen(false);

  const navLinks = useMemo<NavLink[]>(() => {
    const authLink: NavLink = authed
      ? { id: 'account', label: 'Account', to: '/clock' }
      : { id: 'signin', label: 'Sign in', to: '/clock' };

    return [
      { id: 'primary', label: 'Go to Calendar', onClick: onOpenPrimary },
      { id: 'how', label: 'How it works', href: '#how-it-works' },
      { id: 'features', label: 'Features', href: '#features' },
      { id: 'use-cases', label: 'Use cases', href: '#use-cases' },
      { id: 'faq', label: 'FAQ', href: '#faq' },
      { id: 'about', label: 'About', to: '/about' },
      authLink,
      { id: 'contact', label: 'Contact', onClick: onOpenContact },
    ].filter((link) => (link.id === 'primary' ? Boolean(onOpenPrimary) : true));
  }, [authed, onOpenContact, onOpenPrimary]);

  const isRouteActive = (to?: string) => {
    if (!to) return false;
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ mb: { xs: 2.25, md: 3 }, minHeight: 40 }}
      >
        <Stack
          component={RouterLink}
          to="/"
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            '&:focus-visible': {
              outline: '2px solid rgba(255,255,255,0.6)',
              outlineOffset: 4,
              borderRadius: 1,
            },
          }}
        >
          <Box
            component="img"
            src={brandLogoSrc}
            alt="Time 2 Trade logo"
            sx={{
              display: 'block',
              height: { xs: 34, sm: 38, md: 42 },
              width: 'auto',
              maxWidth: '70vw',
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{ color: theme.palette.text.primary, fontWeight: 700 }}
          >
            Time 2 Trade
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1.1}
          alignItems="center"
          flexWrap="wrap"
          justifyContent="flex-end"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {navLinks
            .filter((link) => link.id !== 'primary')
            .map((link) => {
              if (link.onClick) {
                return (
                  <Button
                    key={link.id}
                    onClick={link.onClick}
                    variant="text"
                    color="inherit"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {link.label}
                  </Button>
                );
              }
              if (link.to) {
                const active = isRouteActive(link.to);
                return (
                  <Button
                    key={link.id}
                    component={RouterLink}
                    to={link.to}
                    variant="text"
                    color="inherit"
                    sx={{
                      color: active ? theme.palette.primary.main : theme.palette.text.primary,
                      fontWeight: active ? 800 : 600,
                      textTransform: 'none',
                    }}
                  >
                    {link.label}
                  </Button>
                );
              }
              return (
                <Button
                  key={link.id}
                  component="a"
                  href={link.href}
                  variant="text"
                  color="inherit"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {link.label}
                </Button>
              );
            })}

          {onOpenPrimary && (
            <Button
              onClick={onOpenPrimary}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CalendarMonthIcon />}
              sx={{ fontWeight: 800, borderRadius: 999, px: 2.2, py: 1 }}
            >
              Go to Calendar
            </Button>
          )}
        </Stack>

        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            gap: 1,
          }}
        >
          {onOpenPrimary && (
            <Button
              onClick={onOpenPrimary}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<CalendarMonthIcon />}
              sx={{ fontWeight: 800, borderRadius: 999, px: 2, py: 0.8 }}
            >
              Go to Calendar
            </Button>
          )}

          <IconButton
            aria-label="Open navigation"
            onClick={openMobileNav}
            sx={{ color: theme.palette.text.primary }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Stack>

      <Drawer
        anchor="right"
        open={mobileNavOpen}
        onClose={closeMobileNav}
        PaperProps={{
          sx: {
            width: 320,
            bgcolor: '#ffffff',
            color: theme.palette.text.primary,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            pt: 2.5,
            pb: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              component="img"
              src={brandLogoSrc}
              alt="Time 2 Trade logo"
              sx={{ height: 30, width: 'auto', objectFit: 'contain' }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Time 2 Trade
            </Typography>
          </Stack>
          <IconButton
            aria-label="Close navigation"
            onClick={closeMobileNav}
            sx={{ color: '#f4f7fb' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={1} sx={{ px: 2.5, pb: 3 }}>
          {navLinks.map((link) => {
            if (link.onClick) {
              const isPrimary = link.id === 'primary';

              return (
                <Button
                  key={link.id}
                  onClick={() => {
                    closeMobileNav();
                    link.onClick?.();
                  }}
                  variant={isPrimary ? 'contained' : 'text'}
                  color={isPrimary ? 'primary' : 'inherit'}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontWeight: isPrimary ? 800 : 600,
                  }}
                  startIcon={isPrimary ? <CalendarMonthIcon /> : undefined}
                >
                  {link.label}
                </Button>
              );
            }

            if (link.to) {
              const active = isRouteActive(link.to);
              return (
                <Button
                  key={link.id}
                  component={RouterLink}
                  to={link.to}
                  variant="text"
                  color="inherit"
                  onClick={closeMobileNav}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontWeight: active ? 800 : 600,
                    color: active ? theme.palette.primary.main : theme.palette.text.primary,
                  }}
                >
                  {link.label}
                </Button>
              );
            }

            return (
              <Button
                key={link.id}
                component="a"
                href={link.href}
                variant="text"
                color="inherit"
                onClick={closeMobileNav}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Button>
            );
          })}
        </Stack>
      </Drawer>
    </>
  );
}
