/**
 * src/components/InsightsInfoModal.jsx
 *
 * Purpose: Reusable "About Insights" modal explaining the Insights feed to traders.
 * Shared across InsightsPanel usage in BlogPostPage, Calendar2Page, and standalone.
 * Same UI pattern as SourceInfoModal.jsx for visual consistency.
 *
 * Changelog:
 * v1.0.0 - 2026-02-10 - Initial implementation. BEP: i18n, z-index 12001, theme-aware,
 *                        accessible close button with focus-visible outline.
 */

import { Dialog, DialogTitle, DialogContent, Stack, Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

export default function InsightsInfoModal({ open, onClose, zIndex = 12001 }) {
    const { t } = useTranslation('insights');
    const theme = useTheme();

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
                    {t('infoModal.title')}
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
                        dangerouslySetInnerHTML={{ __html: t('infoModal.description') }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {t('infoModal.updateNote')}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

InsightsInfoModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
};
