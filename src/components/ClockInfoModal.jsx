/**
 * src/components/ClockInfoModal.jsx
 *
 * Purpose: Reusable "Market Clock" info modal explaining the dual-circle clock design,
 * session arcs, overlaps, countdowns, and economic event markers.
 * Follows same Dialog UI pattern as SourceInfoModal for consistency.
 *
 * Changelog:
 * v1.0.0 - 2026-02-13 - Initial implementation. BEP: Full i18n via dialogs:clockInfo namespace,
 *                        theme-aware styling, z-index 12001, accessible close button.
 */

import { Dialog, DialogTitle, DialogContent, Stack, Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

export default function ClockInfoModal({ open, onClose, zIndex = 12001 }) {
    const { t } = useTranslation('dialogs');
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
                    {t('clockInfo.title')}
                </DialogTitle>
                <IconButton
                    onClick={onClose}
                    aria-label={t('common:close', 'Close')}
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
            <DialogContent sx={{ pt: 0, px: 3, pb: 3 }}>
                <Stack spacing={2}>
                    <Typography
                        variant="body2"
                        dangerouslySetInnerHTML={{ __html: t('clockInfo.description') }}
                    />

                    {/* Feature list */}
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {['sessions', 'overlaps', 'countdowns', 'events', 'timezone'].map((key) => (
                            <Typography
                                key={key}
                                component="li"
                                variant="body2"
                                sx={{ mb: 0.5, lineHeight: 1.6 }}
                                dangerouslySetInnerHTML={{ __html: t(`clockInfo.features.${key}`) }}
                            />
                        ))}
                    </Box>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {t('clockInfo.tip')}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}

ClockInfoModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
};
