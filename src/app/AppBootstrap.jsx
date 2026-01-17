/**
 * src/app/AppBootstrap.jsx
 * 
 * Purpose: Reusable SPA bootstrap for SSR pages with providers and routing.
 * Keeps DOM access behind effects so SSR prerendering stays safe while the app
 * remains fully client-driven after hydration.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-16 - Removed hardcoded basename to support /clock and /app routes from SSR.
 * v1.0.0 - 2025-12-18 - Extracted bootstrap component for vite-plugin-ssr integration.
 */

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import theme from '../theme';
import { registerServiceWorker } from '../registerServiceWorker';
import { scheduleNonCriticalAssets, setupViewportCssVars } from './clientEffects';

const AppRoutes = lazy(() => import('../routes/AppRoutes'));

export default function AppBootstrap() {
    useEffect(() => {
        setupViewportCssVars();
        scheduleNonCriticalAssets(registerServiceWorker);
    }, []);

    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <SettingsProvider>
                        <Suspense fallback={null}>
                            <AppRoutes />
                        </Suspense>
                    </SettingsProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
