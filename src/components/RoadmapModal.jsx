/**
 * src/components/RoadmapModal.jsx
 * 
 * Purpose: Minimal modal for "Roadmap coming soon" feature.
 * Displays a friendly message when users click the Roadmap nav item.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-27 - i18n migration: Added useTranslation hook, migrated all strings to dialogs namespace
 * v1.0.0 - 2026-01-17 - Initial implementation
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';

export default function RoadmapModal({ open, onClose }) {
    const { t } = useTranslation(['dialogs']);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex: 2000 }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 20px 40px rgba(15,23,42,0.1)',
                },
            }}
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(4px)',
                        bgcolor: 'rgba(15,23,42,0.3)',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    pb: 1,
                }}
            >
                <ChecklistRtlIcon sx={{ fontSize: 'inherit', color: 'primary.main' }} />
                {t('dialogs:roadmapTitle')}
            </DialogTitle>

            <DialogContent sx={{ pt: 1.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body1" color="text.secondary">
                        {t('dialogs:roadmapMessage1')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('dialogs:roadmapMessage2')}
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: 999 }}>
                    {t('dialogs:roadmapGotItButton')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

RoadmapModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
