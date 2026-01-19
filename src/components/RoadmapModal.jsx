/**
 * src/components/RoadmapModal.jsx
 * 
 * Purpose: Minimal modal for "Roadmap coming soon" feature.
 * Displays a friendly message when users click the Roadmap nav item.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-17 - Initial implementation
 */

import PropTypes from 'prop-types';
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
                Roadmap
            </DialogTitle>

            <DialogContent sx={{ pt: 1.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body1" color="text.secondary">
                        🚀 We&apos;re working on exciting updates for Time 2 Trade!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Check back soon for details.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button onClick={onClose} variant="contained" color="primary" sx={{ borderRadius: 999 }}>
                    Got it
                </Button>
            </DialogActions>
        </Dialog>
    );
}

RoadmapModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
