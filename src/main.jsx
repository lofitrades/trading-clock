/**
 * src/main.jsx
 * 
 * Purpose: Application entry point with all providers and routing setup.
 * Configures theme, authentication, settings, and React Router.
 * 
 * Changelog:
 * v2.0.0 - 2025-11-30 - Added React Router integration
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import 'flag-icons/css/flag-icons.min.css';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import theme from './theme';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter basename="/trading-clock">
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
