/**
 * src/components/TimezoneModal.jsx
 * 
 * Purpose: Standalone timezone selection modal component. Encapsulates timezone picker
 * within a responsive Dialog for clean modal UX across /clock and /calendar pages.
 * Handles modal state, timezone selection callbacks, and auth handoff for guest users.
 * 
 * Changelog:
 * v1.0.1 - 2026-01-17 - CONSISTENCY FIX: Use BACKDROP_OVERLAY_SX constant from overlayStyles instead of inline { zIndex: -1 }. Matches AccountModal.jsx and establishes standardized app overlay UI pattern across all modals.
 * v1.0.0 - 2026-01-17 - Initial extraction from App.jsx and CalendarEmbed.jsx. Standalone Dialog with TimezoneSelector, proper PropTypes, responsive design, z-index management, and BEP compliance.
 */

import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';

const TimezoneSelector = lazy(() => import('./TimezoneSelector'));

export default function TimezoneModal({
    open = false,
    onClose = () => { },
    onOpenAuth = null,
    zIndex = 1701,
}) {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            fullScreen={false}
            sx={{ zIndex }}
            slotProps={{
                backdrop: { sx: BACKDROP_OVERLAY_SX },
            }}
            PaperProps={{
                sx: {
                    borderRadius: { xs: 0, sm: 3 },
                    m: { xs: 0, sm: 2 },
                    maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                }}
            >
                <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                    Select Timezone
                </Typography>
                <IconButton
                    edge="end"
                    onClick={onClose}
                    aria-label="close"
                    sx={{
                        ml: 1,
                        p: { xs: 1, sm: 1.25, md: 1.5 },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 1, pb: 3 }}>
                <Suspense fallback={null}>
                    <TimezoneSelector
                        textColor={theme.palette.text.primary}
                        onRequestSignUp={onOpenAuth}
                        onTimezoneChange={onClose}
                    />
                </Suspense>
            </DialogContent>
        </Dialog>
    );
}

TimezoneModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    onOpenAuth: PropTypes.func,
    zIndex: PropTypes.number,
};
