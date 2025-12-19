/**
 * src/components/InstallPromptCTA.jsx
 * 
 * Purpose: Show a lightweight CTA to prompt Chrome/Android users to install the PWA when the browser surfaces the `beforeinstallprompt` event.
 * Key responsibility and main functionality: Captures the deferred install prompt, renders a safe-area-aware floating button, and triggers the install flow while hiding itself once the user accepts or dismisses.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-17 - Initial implementation with beforeinstallprompt capture, appinstalled handling, and safe-area positioning.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Paper, Slide, Stack, Typography } from '@mui/material';

const isStandaloneDisplay = () => {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        Boolean(window.navigator.standalone)
    );
};

export default function InstallPromptCTA({ isBusy = false }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (isStandaloneDisplay()) return;

        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setVisible(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    useEffect(() => {
        if (!deferredPrompt || isBusy || isStandaloneDisplay()) {
            setVisible(false);
            return;
        }

        setVisible(true);
    }, [deferredPrompt, isBusy]);

    const hide = useCallback(() => setVisible(false), []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);

        if (choice?.outcome === 'accepted') {
            setVisible(false);
        } else {
            setVisible(false);
        }
    }, [deferredPrompt]);

    const shouldRender = useMemo(() => visible && !!deferredPrompt && !isStandaloneDisplay(), [visible, deferredPrompt]);

    if (!shouldRender) return null;

    return (
        <Slide direction="up" in={shouldRender} mountOnEnter unmountOnExit>
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 'calc(16px + var(--t2t-safe-bottom, 0px))',
                    left: 'max(12px, env(safe-area-inset-left, 0px))',
                    zIndex: 1300,
                }}
            >
                <Paper
                    elevation={10}
                    sx={{
                        px: { xs: 1.5, sm: 2 },
                        py: { xs: 1.25, sm: 1.5 },
                        borderRadius: 3,
                        boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
                        maxWidth: 340,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
                                Install Time 2 Trade
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                Add the app to your home screen for faster launches and full-screen trading.
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={handleInstall}
                                    aria-label="Install Time 2 Trade"
                                >
                                    Install app
                                </Button>
                                <Button
                                    variant="text"
                                    color="inherit"
                                    size="small"
                                    onClick={hide}
                                    aria-label="Dismiss install prompt"
                                >
                                    Not now
                                </Button>
                            </Stack>
                        </Box>
                        <IconButton
                            aria-label="Close install prompt"
                            onClick={hide}
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Paper>
            </Box>
        </Slide>
    );
}

InstallPromptCTA.propTypes = {
    isBusy: PropTypes.bool,
};
