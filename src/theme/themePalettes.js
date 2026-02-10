/**
 * src/theme/themePalettes.js
 *
 * Purpose: Light and dark mode color palette definitions.
 * Separates palette configuration from theme factory for clarity and maintainability.
 * Includes CSS variable mappings for dynamic color injection.
 *
 * Changelog:
 * v1.0.0 - 2026-01-28 - Initial implementation with light/dark palettes and CSS variable maps.
 */

/**
 * Light mode palette (current production colors)
 */
export const lightPalette = {
  mode: 'light',
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
  divider: 'rgba(0, 0, 0, 0.12)',
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
  },
};

/**
 * Dark mode palette
 * Based on Material Design 3 dark standards with adjusted teal for contrast
 */
export const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#4DB6AC',      // Lighter teal for dark backgrounds
    light: '#80CBC4',     // Even lighter for hover/accent
    dark: '#00897B',      // Deeper teal for pressed states
  },
  secondary: {
    main: '#B2DFDB',      // Light teal complement
    light: '#E0F2F1',     // Very light for subtle accents
    dark: '#4DB8A8',      // Darker complement
  },
  background: {
    default: '#121212',   // Material dark standard
    paper: '#1E1E1E',     // Elevated surface (8dp equivalent)
  },
  text: {
    primary: '#E0E0E0',   // High contrast on dark
    secondary: '#A0A0A0', // Medium contrast
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
  },
};

/**
 * Impact/severity colors for economic event indicators
 * Theme-aware color definitions
 */
export const getImpactColors = (isDark) => ({
  high: isDark ? '#ef5350' : '#d32f2f',       // Red
  medium: isDark ? '#ff9800' : '#f57c00',     // Orange
  low: isDark ? '#FFD54F' : '#F2C94C',        // Yellow
  myEvents: isDark ? '#64b5f6' : '#42a5f5',   // Blue — custom events
  nonEconomic: isDark ? '#bdbdbd' : '#9e9e9e',
  unknown: isDark ? '#C7B8A4' : '#C7B8A4',    // Taupe (constant)
});

/**
 * CSS variable mappings for light mode
 * Injected into :root when in light mode
 */
export const lightCssVars = {
  '--t2t-bg-default': '#F9F9F9',
  '--t2t-bg-paper': '#FFFFFF',
  '--t2t-text-primary': '#4B4B4B',
  '--t2t-text-secondary': '#666666',
  '--t2t-primary-main': '#006064',
  '--t2t-primary-light': '#428E92',
  '--t2t-primary-dark': '#00363A',
  '--t2t-secondary-main': '#85b8b7',
  '--t2t-secondary-light': '#a8d8b9',
  '--t2t-secondary-dark': '#5a8988',
  '--t2t-divider': 'rgba(0, 0, 0, 0.12)',
  '--t2t-action-hover': 'rgba(0, 0, 0, 0.04)',
  '--t2t-impact-high': '#d32f2f',
  '--t2t-impact-medium': '#f57c00',
  '--t2t-impact-low': '#F2C94C',
  '--t2t-impact-my-events': '#42a5f5',
  '--t2t-impact-non-economic': '#9e9e9e',
};

/**
 * CSS variable mappings for dark mode
 * Injected into :root[data-theme="dark"]
 */
export const darkCssVars = {
  '--t2t-bg-default': '#121212',
  '--t2t-bg-paper': '#1E1E1E',
  '--t2t-text-primary': '#E0E0E0',
  '--t2t-text-secondary': '#A0A0A0',
  '--t2t-primary-main': '#4DB6AC',
  '--t2t-primary-light': '#80CBC4',
  '--t2t-primary-dark': '#00897B',
  '--t2t-secondary-main': '#B2DFDB',
  '--t2t-secondary-light': '#E0F2F1',
  '--t2t-secondary-dark': '#4DB8A8',
  '--t2t-divider': 'rgba(255, 255, 255, 0.12)',
  '--t2t-action-hover': 'rgba(255, 255, 255, 0.08)',
  '--t2t-impact-high': '#ef5350',
  '--t2t-impact-medium': '#ff9800',
  '--t2t-impact-low': '#FFD54F',
  '--t2t-impact-my-events': '#64b5f6',
  '--t2t-impact-non-economic': '#bdbdbd',
};

/**
 * Shared component style overrides (applies to both light and dark)
 */
export const sharedComponentOverrides = {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        '&.MuiBackdrop-invisible': {
          backgroundColor: 'transparent',
        },
      },
    },
  },
  MuiModal: {
    styleOverrides: {
      root: {
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
};
