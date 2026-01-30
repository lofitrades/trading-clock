/**
 * src/components/ContactModal.jsx
 * 
 * Purpose: Responsive modal that embeds the /contact page for in-context access from the landing page.
 * Keeps the contact page UI + SEO intact by rendering it in a same-origin iframe.
 * 
 * Changelog:
 * v1.0.6 - 2026-01-15 - Align ContactModal z-index with AuthModal2 and keep backdrop behind paper to prevent overlay flash on open.
 * v1.0.5 - 2026-01-13 - Keep progress visible until iframe signals ready via postMessage; add fallback timer to avoid blank state.
 * v1.0.4 - 2026-01-13 - Speed: lazy iframe load, non-blocking top progress, keep paper above backdrop.
 * v1.0.3 - 2026-01-13 - Raised modal z-index above calendar chrome (AppBar/top banner/jump control) and pinned paper above backdrop using explicit z-index.
 * v1.0.2 - 2026-01-12 - Fix: Prevent invalid heading nesting (h2 > h6) in DialogTitle to avoid hydration errors.
 * v1.0.1 - 2026-01-09 - Load /contact in embed mode so modal hides non-form copy and footer links.
 * v1.0.0 - 2026-01-09 - Initial implementation.
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';

export default function ContactModal({ open, onClose }) {
    const theme = useTheme();
    const { t } = useTranslation('contact');
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const [ready, setReady] = useState(false);
    const fallbackTimer = useRef(null);

    const iframeSrc = useMemo(() => {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        return `${normalizedBase}contact?embed=1`;
    }, []);

    const handleEnter = useCallback(() => {
        setReady(false);
        if (fallbackTimer.current) {
            clearTimeout(fallbackTimer.current);
            fallbackTimer.current = null;
        }
    }, []);

    const handleLoad = useCallback(() => {
        // Fallback: if iframe never posts ready, unblock after a short delay.
        fallbackTimer.current = window.setTimeout(() => {
            setReady(true);
            fallbackTimer.current = null;
        }, 1500);
    }, []);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data === 'contact-embed-ready' || event.data?.type === 'contact-embed-ready') {
                setReady(true);
                if (fallbackTimer.current) {
                    clearTimeout(fallbackTimer.current);
                    fallbackTimer.current = null;
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            if (fallbackTimer.current) {
                clearTimeout(fallbackTimer.current);
                fallbackTimer.current = null;
            }
        };
    }, []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="lg"
            fullWidth
            sx={{ zIndex: 12001 }}
            TransitionProps={{ onEnter: handleEnter }}
            aria-labelledby="contact-modal-title"
            slotProps={{
                backdrop: { sx: BACKDROP_OVERLAY_SX },
            }}
            PaperProps={{
                sx: {
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: fullScreen ? 0 : 3,
                    overflow: 'hidden',
                    height: fullScreen ? '100dvh' : 'min(90dvh, 860px)',
                },
            }}
        >
            <DialogTitle
                id="contact-modal-title"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    pr: 1,
                }}
            >
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t('modal.title')}
                </Typography>

                <IconButton aria-label={t('modal.closeAriaLabel')} onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    position: 'relative',
                    flex: 1,
                    minHeight: 0,
                    bgcolor: 'background.default',
                }}
            >
                {!ready && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />}

                <Box
                    component="iframe"
                    title="Contact Time 2 Trade Support"
                    src={iframeSrc}
                    onLoad={handleLoad}
                    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
                    loading="lazy"
                    sx={{
                        border: 0,
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        position: 'relative',
                        zIndex: 1,
                        backgroundColor: 'background.default',
                    }}
                    aria-busy={!ready}
                />
            </DialogContent>
        </Dialog>
    );
}

ContactModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
