/**
 * src/components/InsightsPanel.jsx
 *
 * Purpose: Main Insights sidebar panel component.
 * Displays ranked feed of recent activity logs in a timeline view.
 * Shows last 7d activity-only insights by default for all users.
 *
 * Used in: BlogPostPage (Tab B), Calendar2Page (Tab "Insights"), standalone usage.
 *
 * Design: Compact, scroll-inside-panel (MUI Paper), responsive mobile layout.
 *
 * Changelog:
 * v1.3.0 - 2026-02-14 - BEP SKELETON UX: Added i18n ready check to prevent title flash on mount.
 *                        Title now shows Skeleton placeholder until 'insights' namespace is loaded.
 *                        Smooth transition from skeleton to actual title when i18n ready flag becomes true.
 * v1.2.0 - 2026-02-10 - BEP TRENDING FIX: Widened default timeframe from 24h → 7d so trending
 *                        mode returns results even when no context is provided (no currency filters,
 *                        no blog post reference). Fixes empty Insights tab on Calendar2Page for both
 *                        authenticated and non-authenticated users.
 * v1.1.0 - 2026-02-10 - BEP SIMPLIFICATION: Removed source type filter chips and timeframe
 *                        dropdown. Hard-coded to activity-only, last 24h for all users.
 *                        Added info icon (InsightsInfoModal) next to title for context.
 * v1.0.0 - 2026-02-10 - Phase 5: Initial implementation
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    Tooltip,
    Skeleton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import useInsightsFeed from '../hooks/useInsightsFeed';
import InsightsTimeline from './InsightsTimeline';
import InsightsInfoModal from './InsightsInfoModal';

/** BEP: Fixed filters — activity-only, last 7d for all users.
 *  Wider window ensures trending mode returns results even with no context/filters. */
const FIXED_FILTERS = Object.freeze({ sourceTypes: ['activity'], timeframe: '7d' });

/**
 * InsightsPanel component
 *
 * @param {Object} props
 * @param {Object} [props.context] - Page context (postId, eventTags, currencyTags)
 * @param {Function} [props.onLoadMore] - Callback when user clicks "Load More"
 * @param {number} [props.maxHeight] - Panel max height (for scrolling inside panel)
 * @returns {JSX.Element}
 */
export default function InsightsPanel({ context = {}, onLoadMore, maxHeight = 600 }) {
    const { t, ready } = useTranslation('insights', { useSuspense: false });

    // Info modal state
    const [infoOpen, setInfoOpen] = useState(false);
    const handleOpenInfo = useCallback(() => setInfoOpen(true), []);
    const handleCloseInfo = useCallback(() => setInfoOpen(false), []);

    // Fetch insights with fixed filters (activity-only, last 7d)
    const {
        items, loading, error, hasMore, totalBySource, refresh,
    } = useInsightsFeed({ context, filters: FIXED_FILTERS });

    return (
        <Paper
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight,
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: 'background.paper',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {ready ? (
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {t('title')}
                            </Typography>
                        ) : (
                            <Skeleton variant="text" width={100} height={28} sx={{ borderRadius: 1 }} />
                        )}
                        <Tooltip title={t('infoModal.tooltip')}>
                            <IconButton
                                size="small"
                                onClick={handleOpenInfo}
                                sx={{ color: 'text.secondary', p: 0.25 }}
                            >
                                <InfoOutlinedIcon sx={{ fontSize: '1.1rem' }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Button size="small" onClick={refresh} disabled={loading}>
                        ↻
                    </Button>
                </Stack>
            </Box>

            {/* Content Area (scrollable) */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Loading spinner */}
                {loading && !items.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress size={40} />
                    </Box>
                )}

                {/* Error alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Empty state */}
                {!loading && !error && !items.length && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                            {t('empty.noResults')}
                        </Typography>
                    </Box>
                )}

                {/* Timeline */}
                {items.length > 0 && (
                    <InsightsTimeline items={items} totalBySource={totalBySource} />
                )}

                {/* Load more button */}
                {hasMore && (
                    <Button
                        fullWidth
                        variant="text"
                        sx={{ mt: 2 }}
                        onClick={() => {
                            if (onLoadMore) onLoadMore();
                        }}
                    >
                        {t('loadMore')}
                    </Button>
                )}
            </Box>

            {/* Summary footer */}
            <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                    {t('summaryActivity', { activities: totalBySource.activity })}
                </Typography>
            </Box>

            {/* Insights info modal */}
            <InsightsInfoModal open={infoOpen} onClose={handleCloseInfo} />
        </Paper>
    );
}

InsightsPanel.propTypes = {
    context: PropTypes.object,
    onLoadMore: PropTypes.func,
    maxHeight: PropTypes.number,
};
