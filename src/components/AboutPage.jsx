/**
 * src/components/AboutPage.jsx
 * 
 * Purpose: Public About page accessible at /about for SEO and external discovery.
 * Renders the same content as the Settings Drawer About tab using shared content module.
 * Includes proper SEO metadata, structured data, and mobile-first responsive design.
 * 
 * Changelog:
 * v1.2.32 - 2026-01-16 - Updated trading clock navigation target to /clock for new public route.
 * v1.2.31 - 2026-01-14 - MOBILE SCROLL PADDING FIX: Added responsive pb (padding-bottom) to Paper for xs/sm to ensure content scrolls all the way to the bottom without being clipped. Formula: xs uses calc(3 * 8px + 48px) = 72px, sm uses calc(4 * 8px + 48px) = 80px, md+ uses default 5 units (40px). The +48px accounts for PublicLayout mobile logo row height (32px logo + 16px pb). This matches CalendarEmbedLayout pattern for consistent scrollability across all pages on mobile.
 * v1.2.30 - 2026-01-14 - MOBILE SPACING FIX: Added pt (padding-top) for xs/sm breakpoints (8 units = 64px) to content Paper so About text appears below the fixed PublicLayout mobile logo without overlap. On md+, pt is unset so normal padding applies. Ensures proper vertical spacing on mobile while maintaining responsive layout behavior.
 * v1.2.29 - 2026-01-14 - MOBILE BRANDING REFACTOR: Removed fixed mobile brand lockup (logo + text) from AboutPage and moved to PublicLayout so it displays consistently across all public pages on xs/sm only. Updated Paper mt from 'calc(32px + 40px)' to 0 since logo is no longer locally fixed. This centralizes mobile branding in PublicLayout, reduces code duplication, and ensures consistent mobile-first responsive behavior across /about, /calendar, and /app pages.
 * v1.2.28 - 2026-01-14 - BUGFIX: Fixed 'Unlock all features' button not opening AuthModal2 from SettingsSidebar2. Added missing authModalOpen state, handleOpenAuth/handleCloseAuth handlers, AuthModal2 import/render, and corrected PublicLayout onOpenAuth prop to call handleOpenAuth (was incorrectly calling setContactModalOpen(false)). Now auth flow works correctly on /about page.
 * v1.2.27 - 2026-01-14 - Moved "Have questions? Contact us" footer from outside Paper to inside Paper (scrollable content) so it is not sticky at bottom.
 * v1.2.26 - 2026-01-14 - SCROLLBAR STYLING: Applied minimal scrollbar UI from CalendarEmbedLayout to Paper container. Thin 6px width, semi-transparent rgba(60,77,99,0.32) thumb that darkens on hover, transparent track. Provides subtle, professional scrollbar appearance consistent with /calendar page.
 * v1.2.25 - 2026-01-14 - VISUAL REFINEMENT: Removed border (1px divider line) from main Paper container and changed background color from background.paper (#FFFFFF) to background.default (#F9F9F9) to match theme and create a seamless, integrated appearance with the page layout.
 * v1.2.24 - 2026-01-14 - RESPONSIVE PADDING: Added mobile-first px padding to Paper (xs:2, sm:2, md:5) to ensure About content doesn't touch viewport edges on mobile while maintaining centering fix. Responsive padding scales with breakpoints: xs/sm get additional gutters (16px total), md+ gets wider padding (40px) for desktop comfortable reading width.
 * v1.2.20 - 2026-01-14 - CENTERING FIX: Removed duplicate px padding and maxWidth/mx:auto from content wrapper since PublicLayout already provides these. This was causing double horizontal padding (32px instead of 16px on xs), breaking horizontal centering on mobile.
 * v1.2.19 - 2026-01-13 - RESTRUCTURE: Move mobile brand lockup outside Paper with fixed positioning on xs/sm; Paper now starts below fixed logo+name and height adjusted accordingly. Paper scrollable independently with adjusted height calculations.
 * v1.2.18 - 2026-01-13 - Removed "Start Using Time 2 Trade" CTA button; replaced footer with "Contact us" link that opens ContactModal. Removed unused imports (Button, useNavigate).
 * v1.2.17 - 2026-01-13 - Updated container sizing to match canonical mobile-first pattern: width 100%, maxWidth 1560, mx auto, responsive px. Removed unused DASHBOARD_APP_BAR_CONTAINER_SX import for consistency with /app and /calendar layouts.
 * v1.2.16 - 2026-01-13 - CRITICAL FIX: Removed width:100% from content wrapper; now relies on DASHBOARD_APP_BAR_CONTAINER_SX (mx:auto + maxWidth:1560) for self-centering. Aligns with centering fixes applied to /app and /calendar.
 * v1.2.15 - 2026-01-13 - Aligned /about main content width with canonical AppBar container to prevent md/lg overflow; matches /calendar layout sizing.
 * v1.2.14 - 2026-01-13 - Locked /about to canonical AppBar sizing by removing per-page overrides and relying on shared layout defaults.
 * v1.2.13 - 2026-01-13 - Switched /about to standardized AppBar profile selection to align with shared public shell sizing.
 * v1.2.12 - 2026-01-13 - Set xl AppBar margin to 0 so /about aligns flush on xl while retaining md/lg spacing.
 * v1.2.11 - 2026-01-13 - Added xs/sm brand lockup above the About header to mirror AppBar logo and label on mobile.
 * v1.2.10 - 2026-01-13 - Removed top margin on the About card and enabled internal scrolling with responsive max-heights.
 * v1.2.9 - 2026-01-13 - Switched /about to PublicLayout (no banner) to match new chrome; removed local banner/AppBar wrappers while keeping SEO intact.
 * v1.2.8 - 2026-01-13 - Centered all /about chrome/content (banner, AppBar, body, footer) with shared dashboard container sizing for mobile-first parity with /app.
 * v1.2.7 - 2026-01-13 - Restored responsive top banner + DashboardAppBar chrome and removed the back-to-app button to match /calendar and /app layouts.
 * v1.2.6 - 2026-01-13 - Removed DashboardAppBar and AdTopBanner chrome from the About page.
 * v1.2.5 - 2026-01-12 - Implemented mobile-first responsive centering: replaced width:100% + maxWidth:100% with responsive maxWidth (360/540/full) for xs/sm/md+ to ensure proper horizontal centering of chrome on mobile breakpoints.
 * v1.2.4 - 2026-01-12 - Applied maxWidth constraint and flexbox centering to chrome wrapper for xs/sm horizontal centering and consistent AppBar height across pages.
 * v1.2.3 - 2026-01-12 - Fixed AppBar chrome consistency: added missing Box wrapper with margin around AdTopBanner to match /calendar and /app structure.
 * v1.2.2 - 2026-01-12 - Applied shared AppBar container spacing/z-index to match /calendar and /app chrome.
 * v1.2.1 - 2026-01-12 - Added AdTopBanner and DashboardAppBar to AboutPage with mobile-first nav chrome.
 * v1.2.0 - 2025-12-22 - Moved to shared Helmet-based SEO metadata with refreshed About positioning.
 * v1.1.0 - 2025-12-18 - Removed react-helmet-async; client title/description updates for /app.
 * v1.0.0 - 2025-12-17 - Initial implementation with SEO metadata and MUI components
 */

import { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import SEO from './SEO';
import ContactModal from './ContactModal';
import PublicLayout from './PublicLayout';
import { aboutContent, aboutMeta, aboutStructuredData } from '../content/aboutContent';

const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
const AuthModal2 = lazy(() => import('./AuthModal2'));

/**
 * Render content block based on type
 */
const ContentBlock = ({ block }) => {
  if (block.type === 'paragraph') {
    return (
      <Typography
        variant="body1"
        sx={{
          fontSize: { xs: '0.95rem', sm: '1rem' },
          lineHeight: 1.7,
          mb: 2,
          color: 'text.primary',
          '& strong': { fontWeight: 700 },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }
        }}
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }

  if (block.type === 'list') {
    return (
      <List
        sx={{
          mb: 3,
          '& .MuiListItem-root': {
            alignItems: 'flex-start',
            px: 0,
            py: 1
          }
        }}
      >
        {block.items.map((item, index) => (
          <ListItem key={index} disableGutters>
            <ListItemText
              primary={
                <Typography
                  component="span"
                  sx={{
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    lineHeight: 1.7,
                    color: 'text.primary'
                  }}
                >
                  <strong>{item.label}:</strong> {item.text}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  }

  return null;
};

ContentBlock.propTypes = {
  block: PropTypes.shape({
    type: PropTypes.string.isRequired,
    text: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired
      })
    )
  }).isRequired
};

/**
 * About Page Component
 * 
 * Features:
 * - SEO-optimized with client-side title/description updates for /app
 * - Structured data handled in SSR marketing pages; content mirrored here
 * - Mobile-first responsive design
 * - MUI theming and components
 * - Shared content source with Settings Drawer
 */
export default function AboutPage() {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleOpenAuth = () => {
    setAuthModalOpen(true);
    setSettingsOpen(false);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
  };

  const navItems = useMemo(
    () => [
      {
        id: 'calendar',
        label: 'Calendar',
        shortLabel: 'Calendar',
        to: '/calendar',
        icon: <CalendarMonthRoundedIcon fontSize="small" />,
        ariaLabel: 'Economic calendar',
      },
      {
        id: 'clock',
        label: 'Trading Clock',
        shortLabel: 'Clock',
        to: '/clock',
        icon: <AccessTimeRoundedIcon fontSize="small" />,
        ariaLabel: 'Open the trading clock',
      },
      {
        id: 'about',
        label: 'About',
        shortLabel: 'About',
        to: '/about',
        icon: <InfoRoundedIcon fontSize="small" />,
        ariaLabel: 'Learn about Time 2 Trade',
      },
      {
        id: 'signin',
        label: 'Sign in',
        shortLabel: 'Sign in',
        icon: <LockOpenRoundedIcon fontSize="small" />,
        primary: true,
        ariaLabel: 'Sign in or create an account',
      },
    ],
    [],
  );

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PublicLayout
      navItems={navItems}
      onOpenAuth={handleOpenAuth}
      onOpenSettings={handleOpenSettings}
    >
      <SEO {...aboutMeta} structuredData={[aboutStructuredData]} />
      {/* NOTE: PublicLayout handles centering (width:100%, maxWidth:1560, px:responsive).
          Just render content directly, no additional width/centering wrappers. */}

      {/* Main Content Card - flex: 1 fills available space, scrolls independently */}
      <Paper
        elevation={0}
        sx={{
          pt: { xs: 3, sm: 4, md: 5 },
          px: { xs: 3, md: 4, xl: 2 },
          pb: { xs: 'calc(3 * 8px + 48px)', sm: 'calc(4 * 8px + 48px)', md: 5 },
          borderRadius: 3,
          bgcolor: 'background.default',
          flex: 1,
          width: '100%',
          boxSizing: 'border-box',
          mt: 0,
          overflowY: 'auto',
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(60,77,99,0.32) transparent',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(60,77,99,0.32)',
            borderRadius: 999,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(60,77,99,0.45)',
          },
        }}
      >

        {/* Page Header */}
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            fontWeight: 700,
            mb: 1,
            color: 'text.primary'
          }}
        >
          {aboutContent.title}
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{
            fontSize: { xs: '1rem', sm: '1.1rem' },
            color: 'text.secondary',
            mb: 4,
            fontWeight: 500
          }}
        >
          {aboutContent.subtitle}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Content Sections */}
        {aboutContent.sections.map((section, index) => (
          <Box key={index} sx={{ mb: index < aboutContent.sections.length - 1 ? 4 : 0 }}>
            {section.title && (
              <Typography
                variant="h2"
                component="h2"
                sx={{
                  fontSize: { xs: '1.3rem', sm: '1.5rem' },
                  fontWeight: 700,
                  mb: 2,
                  color: 'text.primary'
                }}
              >
                {section.title}
              </Typography>
            )}

            {section.content.map((block, blockIndex) => (
              <ContentBlock key={blockIndex} block={block} />
            ))}
          </Box>
        ))}

        {/* Footer - Contact Us */}
        <Divider sx={{ my: 4 }} />
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.875rem',
            mb: 4,
          }}
        >
          Have questions?{' '}
          <Box
            component="button"
            onClick={() => setContactModalOpen(true)}
            sx={{
              background: 'none',
              border: 'none',
              color: 'primary.main',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              '&:focus-visible': {
                outline: '2px solid',
                outlineOffset: 2,
                outlineColor: 'primary.main',
                borderRadius: 0.5,
              }
            }}
          >
            Contact us
          </Box>
        </Typography>
      </Paper>

      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <Suspense fallback={null}>
        <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/about" />
      </Suspense>
      <Suspense fallback={null}>
        <SettingsSidebar2 open={settingsOpen} onClose={handleCloseSettings} onOpenAuth={handleOpenAuth} onOpenContact={() => setContactModalOpen(true)} />
      </Suspense>
    </PublicLayout>
  );
}
