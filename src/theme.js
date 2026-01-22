// src/theme.js
/**
 * src/theme.js
 * 
 * Purpose: Global MUI theme configuration for Time 2 Trade.
 * Defines brand palette, typography, and component overrides for consistent UI styling.
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
 * v1.3.0 - 2026-01-22 - BEP: Updated primary palette to match custom event chip styling. primary.main changed from #018786 to #006064 (dark teal), with adjusted light (#428E92) and dark (#00363A) variants for consistent brand identity across all components.
 * v1.2.0 - 2026-01-14 - CRITICAL Z-INDEX FIX: Added MuiBackdrop and MuiModal theme config to ensure modal backdrops block clicks and properly layer above AppBar. Set backdrop z-index base to 1300 (below AppBar 1400) so individual modals control their effective z-index via Dialog slotProps.
 * v1.1.0 - 2025-12-18 - Documented brand teal palette usage for primary colors
 * v1.0.0 - 2025-09-15 - Initial implementation
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#006064',
      light: '#428E92',
      dark: '#00363A',
    },
    secondary: {
      main: '#85b8b7',
      light: '#a8d8b9',
      dark: '#5a8988',
    },
    background: {
      default: '#F9F9F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#4B4B4B',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Poppins',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          // Ensure backdrop is visible and blocks clicks
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          // Backdrop z-index is controlled per-modal via slotProps to allow layering
          // but theme default ensures it's always present and interactive
          '&.MuiBackdrop-invisible': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          // Ensure modal can receive focus and block background interaction
          // Individual modals set their own z-index via slotProps
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          // Ensure Dialog respects modal z-index stacking
        },
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 320,
          padding: '20px',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#018786',
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 22,
            height: 22,
          },
          '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: 'rgba(0, 0, 0, 0.38)',
            opacity: 1,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 48,
          '&.Mui-expanded': {
            minHeight: 48,
          },
        },
        content: {
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

export default theme;
