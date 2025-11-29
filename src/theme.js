// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#018786',
      light: '#85b8b7',
      dark: '#006665',
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
      'Roboto',
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
    MuiDialog: {
      styleOverrides: {
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
