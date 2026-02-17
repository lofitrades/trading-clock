/**
 * src/components/BackfillProgressModal.jsx
 *
 * Purpose: Real-time progress modal displaying backfill status for blogPosts, 
 * systemActivityLog, and eventNotes collections. Shows active phase with spinner,
 * completed phases with summary counts, and final results (temp implementation).
 *
 * Changelog:
 * v1.0.0 - 2026-02-09 - Initial implementation with 3-phase progress tracking
 */

import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Typography,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

const PHASES = [
    { id: 'blogPosts', label: 'Blog Posts', key: 'blogPosts' },
    { id: 'activityLog', label: 'Activity Log', key: 'activityLog' },
    { id: 'eventNotes', label: 'Event Notes', key: 'eventNotes' },
];

export default function BackfillProgressModal({
    open,
    onClose,
    currentPhase,
    results,
    error,
    isLoading,
}) {
    const activePhaseIndex = PHASES.findIndex((p) => p.id === currentPhase);
    const isComplete = results && !isLoading;
    const hasError = !!error;

    const getTotalStats = () => {
        if (!results) return { total: 0, updated: 0, skipped: 0, errors: 0 };
        const totals = {
            total: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
        };
        Object.values(results).forEach((phase) => {
            if (phase && typeof phase === 'object') {
                totals.total += phase.total || 0;
                totals.updated += phase.updated || 0;
                totals.skipped += phase.skipped || 0;
                totals.errors += phase.errors || 0;
            }
        });
        return totals;
    };

    const totals = getTotalStats();

    const getPhaseStatus = (phaseId) => {
        if (!results || !results[phaseId]) return null;
        return results[phaseId];
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: 3,
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <HourglassTopIcon sx={{ fontSize: '1.3rem' }} />
                Backfill insightKeys Progress
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Phase Stepper */}
                    <Box>
                        <Stepper activeStep={activePhaseIndex} sx={{ mb: 2 }}>
                            {PHASES.map((phase) => {
                                const phaseStatus = getPhaseStatus(phase.key);
                                const isActive = phase.id === currentPhase;
                                const isCompleted = phaseStatus && !isActive;

                                return (
                                    <Step
                                        key={phase.id}
                                        completed={isCompleted && !hasError}
                                        sx={{
                                            '& .MuiStepLabel-root': {
                                                cursor: 'default',
                                            },
                                        }}
                                    >
                                        <StepLabel
                                            icon={
                                                isActive ? (
                                                    <CircularProgress size={24} sx={{ color: 'primary.main' }} />
                                                ) : isCompleted ? (
                                                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.5rem' }} />
                                                ) : undefined
                                            }
                                        >
                                            {phase.label}
                                        </StepLabel>
                                    </Step>
                                );
                            })}
                        </Stepper>
                    </Box>

                    {/* Current Phase Status */}
                    {!isComplete && currentPhase && (
                        <Card
                            elevation={0}
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                bgcolor: 'action.hover',
                                p: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={32} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        Processing {PHASES.find((p) => p.id === currentPhase)?.label}...
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Please wait, this may take a few minutes
                                    </Typography>
                                </Box>
                            </Box>
                        </Card>
                    )}

                    {/* Error Alert */}
                    {hasError && (
                        <Alert severity="error" icon={<ErrorIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Backfill encountered an error:
                            </Typography>
                            <Typography variant="caption">{error}</Typography>
                        </Alert>
                    )}

                    {/* Results Summary Table */}
                    {isComplete && (
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                                Results Summary
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                Total
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                Updated
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                Skipped
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                Errors
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {PHASES.map((phase) => {
                                            const phaseResult = getPhaseStatus(phase.key);
                                            if (!phaseResult) return null;
                                            return (
                                                <TableRow
                                                    key={phase.id}
                                                    sx={{
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                    }}
                                                >
                                                    <TableCell sx={{ fontWeight: 600 }}>{phase.label}</TableCell>
                                                    <TableCell align="right">{phaseResult.total || 0}</TableCell>
                                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                                                        {phaseResult.updated || 0}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'info.main' }}>
                                                        {phaseResult.skipped || 0}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            color: phaseResult.errors > 0 ? 'error.main' : 'text.secondary',
                                                            fontWeight: phaseResult.errors > 0 ? 600 : 400,
                                                        }}
                                                    >
                                                        {phaseResult.errors || 0}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Totals Row */}
                            <Card
                                elevation={0}
                                sx={{
                                    mt: 2,
                                    p: 1.5,
                                    bgcolor: 'primary.light',
                                    border: 1,
                                    borderColor: 'primary.main',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: 2,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            Total Docs
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                                            {totals.total}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            Updated
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>
                                            {totals.updated}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            Skipped
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.dark' }}>
                                            {totals.skipped}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            Errors
                                        </Typography>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 700,
                                                color: totals.errors > 0 ? 'error.dark' : 'text.secondary',
                                            }}
                                        >
                                            {totals.errors}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} variant="contained" fullWidth disabled={isLoading}>
                    {isComplete ? 'Close' : 'Close'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

BackfillProgressModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentPhase: PropTypes.oneOf(['blogPosts', 'activityLog', 'eventNotes']),
    results: PropTypes.shape({
        blogPosts: PropTypes.shape({
            total: PropTypes.number,
            updated: PropTypes.number,
            skipped: PropTypes.number,
            errors: PropTypes.number,
        }),
        activityLog: PropTypes.shape({
            total: PropTypes.number,
            updated: PropTypes.number,
            skipped: PropTypes.number,
            errors: PropTypes.number,
        }),
        eventNotes: PropTypes.shape({
            total: PropTypes.number,
            updated: PropTypes.number,
            skipped: PropTypes.number,
            errors: PropTypes.number,
        }),
    }),
    error: PropTypes.string,
    isLoading: PropTypes.bool,
};
