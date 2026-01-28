/**
 * src/theme.js
 * 
 * Purpose: Global MUI theme factory for Time 2 Trade.
 * Creates light/dark themes based on mode parameter. Defines brand palette, typography,
 * and shared component overrides for consistent UI styling across both themes.
 * 
 * Z-Index Strategy:
 * - AppBar: 1400 (navigation chrome)
 * - SettingsSidebar2: 1600 (drawer container)
 * - Modals/Poppers: 1700+ (standard modals)
 * - AuthModal2/HighPriority: 2000 (authentication critical)
 * - WelcomeModal: 11000 (onboarding, highest priority)
 * 
 * Backdrop behavior: All modals have explicit z-index > AppBar (1400) to block clicks
 * 
 * Changelog:
 * v2.0.0 - 2026-01-28 - BEP: Refactored to factory pattern with getTheme(mode) function.
 *                       Palette logic moved to src/theme/themePalettes.js. Supports light/dark modes.
 * v1.3.0 - 2026-01-22 - BEP: Updated primary palette to match custom event chip styling. primary.main changed from #018786 to #006064 (dark teal).
 * v1.2.0 - 2026-01-14 - CRITICAL Z-INDEX FIX: Added MuiBackdrop and MuiModal theme config.
 * v1.1.0 - 2025-12-18 - Documented brand teal palette usage for primary colors
 * v1.0.0 - 2025-09-15 - Initial implementation
 */
import { createTheme } from '@mui/material/styles';
import { lightPalette, darkPalette, sharedComponentOverrides } from './theme/themePalettes';

/**
 * Theme factory function
 * @param {string} mode - 'light' or 'dark'
 * @returns {Theme} MUI theme object
 */
export const getTheme = (mode = 'light') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    palette,
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Poppins',
        'sans-serif',
      ].join(','),
    },
    components: sharedComponentOverrides,
  });
};

// Default export for backwards compatibility (light mode)
export default getTheme('light');
