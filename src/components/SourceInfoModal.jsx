/**
 * src/components/SourceInfoModal.jsx
 *
 * Purpose: Reusable "Data Source" modal showing Forex Factory attribution and reliability.
 * Shared across ClockPage, Calendar2Page, and LandingPage to avoid code duplication.
 *
 * Changelog:
 * v1.3.0 - 2026-02-08 - BEP CLOSE BUTTON: Added X close icon button aligned to right in header row.
 *                        Icon uses theme-aware colors with hover state and focus-visible keyboard
 *                        navigation. Box wrapper manages flex layout for title + close button alignment.
 * v1.2.0 - 2026-02-08 - BEP Z-INDEX FIX: Increased default z-index from 'auto' to 12001
 *                        (matches AuthModal2 layer). Ensures modal always appears above AppBar
 *                        (1400), ClockEventsOverlay, and all other content. When zIndex prop
 *                        provided (e.g., Calendar2Page), uses that value for custom layering.
 *                        Backdrop properly layered at -1 below modal surface.
 * v1.1.0 - 2026-02-08 - BEP I18N: Replaced all hardcoded strings with i18n translations.
 *                        Uses 'dialogs:sourceInfo' namespace for title and descriptions.
 *                        Supports HTML in translations (description with <strong> tag).
 * v1.0.0 - 2026-02-08 - Initial implementation. Extracted Dialog logic from ClockPage and
 *                        Calendar2Page. BEP code consolidation: eliminates ~30 lines of
 *                        duplicate Dialog code across 3 pages.
 */

import { Dialog, DialogTitle, DialogContent, Stack, Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

export default function SourceInfoModal({ open, onClose, zIndex = 12001 }) {
    const { t } = useTranslation('dialogs');
    const theme = useTheme();

    // Ensure z-index is always a number (either passed value or default 12001)
    const effectiveZIndex = typeof zIndex === 'function' ? undefined : (zIndex ?? 12001);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            sx={{
                ...(typeof zIndex === 'function' && { zIndex }),
                ...(typeof zIndex !== 'function' && { zIndex: effectiveZIndex }),
            }}
            slotProps={{
                backdrop: { sx: { zIndex: 'auto' } },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', p: 0, flex: 1 }}>
                    {t('sourceInfo.title')}
                </DialogTitle>
                <IconButton
                    onClick={onClose}
                    aria-label="Close"
                    sx={{
                        color: alpha(theme.palette.text.primary, 0.7),
                        p: 0.5,
                        ml: 'auto',
                        '&:hover': {
                            color: theme.palette.text.primary,
                            bgcolor: 'transparent',
                        },
                        '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2,
                        },
                    }}
                >
                    <CloseIcon fontSize="medium" />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 0, px: 3, pb: 2 }}>
                <Stack spacing={1.5}>
                    <Typography
                        variant="body2"
                        dangerouslySetInnerHTML={{ __html: t('sourceInfo.description') }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {t('sourceInfo.updateNote')}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

SourceInfoModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
};

