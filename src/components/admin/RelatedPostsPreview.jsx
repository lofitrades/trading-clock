/**
 * src/components/admin/RelatedPostsPreview.jsx
 * 
 * Purpose: Admin CMS component for previewing and managing related posts.
 * Shows auto-suggested posts with scorecard breakdown and allows manual selection.
 * BEP: Full scoring visualization, drag-to-reorder, i18n support.
 * 
 * Changelog:
 * v1.1.0 - 2026-02-15 - BEP: Always show cover thumbnail with fallback to default (getDefaultBlogThumbnail)
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 5.B Blog - Related Posts Admin)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Stack,
    Slider,
    Alert,
    Collapse,
    CircularProgress,
    LinearProgress,
    Checkbox,
    Divider,
    Card,
    CardContent,
    CardMedia,
    Avatar,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CategoryIcon from '@mui/icons-material/Category';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import KeyIcon from '@mui/icons-material/Key';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArticleIcon from '@mui/icons-material/Article';

import { getRelatedPostsPreview } from '../../services/blogService';
import { BLOG_LIMITS, BLOG_CATEGORY_LABELS, BLOG_ECONOMIC_EVENTS } from '../../types/blogTypes';
import { getDefaultBlogThumbnail } from '../../utils/blogThumbnailFallback';

/**
 * Score breakdown tooltip content
 */
const ScoreTooltip = ({ breakdown }) => {
    const { t } = useTranslation('admin');

    return (
        <Box sx={{ p: 1, minWidth: 200 }}>
            <Typography variant="subtitle2" gutterBottom>
                {t('admin:blog.relatedPosts.scoreBreakdown', 'Score Breakdown')}
            </Typography>
            <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <CategoryIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.categoryMatch', 'Category')}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.category}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <EventIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.eventsMatch', 'Events')}
                        {breakdown.eventMatches?.length > 0 && ` (${breakdown.eventMatches.join(', ')})`}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.events}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <AttachMoneyIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.currenciesMatch', 'Currencies')}
                        {breakdown.currencyMatches?.length > 0 && ` (${breakdown.currencyMatches.join(', ')})`}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.currencies}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <LocalOfferIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.tagsMatch', 'Tags')}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.tags}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <KeyIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.keywordsMatch', 'Keywords')}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.keywords}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {t('admin:blog.relatedPosts.recencyBonus', 'Recency')}
                        {breakdown.daysSincePublish !== undefined && ` (${breakdown.daysSincePublish}d ago)`}
                    </Typography>
                    <Typography variant="caption" fontWeight={600}>+{breakdown.recency}</Typography>
                </Box>
            </Stack>
        </Box>
    );
};

ScoreTooltip.propTypes = {
    breakdown: PropTypes.object.isRequired,
};

/**
 * Related post candidate card
 */
const CandidateCard = ({ candidate, isSelected, onToggle, maxScore }) => {
    const { t } = useTranslation('admin');
    const scorePercent = maxScore > 0 ? (candidate.totalScore / maxScore) * 100 : 0;

    // Score color based on strength
    const getScoreColor = (score) => {
        if (score >= 8) return 'success';
        if (score >= 5) return 'warning';
        if (score >= 2) return 'info';
        return 'default';
    };

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 1.5,
                borderColor: isSelected ? 'primary.main' : 'divider',
                borderWidth: isSelected ? 2 : 1,
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: 1,
                },
            }}
        >
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {/* Checkbox */}
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onToggle(candidate.id)}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                        color="primary"
                        sx={{ p: 0, mt: 0.5 }}
                    />

                    {/* Thumbnail — always show, fallback to default */}
                    <CardMedia
                        component="img"
                        image={candidate.coverImage?.url || getDefaultBlogThumbnail(candidate.id, true)}
                        alt=""
                        sx={{ width: 60, height: 45, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                    />

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                            }}
                        >
                            {candidate.title}
                        </Typography>

                        {/* Meta chips */}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {candidate.category && (
                                <Chip
                                    label={BLOG_CATEGORY_LABELS[candidate.category] || candidate.category}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                            )}
                            {candidate.eventTags?.slice(0, 2).map(event => (
                                <Chip
                                    key={event}
                                    label={BLOG_ECONOMIC_EVENTS[event] || event}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                            ))}
                            {candidate.currencyTags?.slice(0, 2).map(currency => (
                                <Chip
                                    key={currency}
                                    label={currency}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                            ))}
                            {!candidate.hasLanguage && (
                                <Chip
                                    label={t('admin:blog.relatedPosts.noTranslation', 'No translation')}
                                    size="small"
                                    color="warning"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                            )}
                        </Stack>
                    </Box>

                    {/* Score */}
                    <Tooltip
                        title={<ScoreTooltip breakdown={candidate.scoreBreakdown} />}
                        arrow
                        placement="left"
                    >
                        <Box sx={{ textAlign: 'right', minWidth: 65 }}>
                            <Chip
                                label={candidate.totalScore.toFixed(1)}
                                size="small"
                                color={getScoreColor(candidate.totalScore)}
                                sx={{ fontWeight: 700, minWidth: 45 }}
                            />
                            <LinearProgress
                                variant="determinate"
                                value={scorePercent}
                                color={getScoreColor(candidate.totalScore)}
                                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                            />
                        </Box>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
};

CandidateCard.propTypes = {
    candidate: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    maxScore: PropTypes.number.isRequired,
};

/**
 * Main Related Posts Preview Component
 */
const RelatedPostsPreview = ({
    postData,
    relatedPostIds,
    onRelatedPostsChange,
    maxRelatedPosts = BLOG_LIMITS.MAX_RELATED_POSTS,
    lang = 'en',
}) => {
    const { t } = useTranslation('admin');
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [displayCount, setDisplayCount] = useState(maxRelatedPosts);

    // Calculate max score for normalization
    const maxScore = useMemo(() => {
        if (candidates.length === 0) return 10;
        return Math.max(...candidates.map(c => c.totalScore), 10);
    }, [candidates]);

    // Fetch related posts preview
    const fetchPreview = useCallback(async () => {
        if (!postData) return;

        setLoading(true);
        try {
            const preview = await getRelatedPostsPreview(
                {
                    ...postData,
                    relatedPostIds,
                },
                lang,
                30 // Get more candidates for selection
            );
            setCandidates(preview);
        } catch (err) {
            console.error('Failed to fetch related posts preview:', err);
        } finally {
            setLoading(false);
        }
    }, [postData, relatedPostIds, lang]);

    // Initial fetch when expanded
    useEffect(() => {
        if (expanded && candidates.length === 0) {
            fetchPreview();
        }
    }, [expanded, candidates.length, fetchPreview]);

    // Toggle selection
    const handleToggle = useCallback((id) => {
        const newIds = relatedPostIds.includes(id)
            ? relatedPostIds.filter(rid => rid !== id)
            : [...relatedPostIds, id].slice(0, BLOG_LIMITS.MAX_RELATED_POSTS);
        onRelatedPostsChange(newIds);
    }, [relatedPostIds, onRelatedPostsChange]);

    // Select top N by score
    const handleSelectTopN = useCallback(() => {
        const topIds = candidates
            .filter(c => c.totalScore > 0)
            .slice(0, displayCount)
            .map(c => c.id);
        onRelatedPostsChange(topIds);
    }, [candidates, displayCount, onRelatedPostsChange]);

    // Clear all
    const handleClearAll = useCallback(() => {
        onRelatedPostsChange([]);
    }, [onRelatedPostsChange]);

    // Selected and unselected candidates
    const selectedCandidates = useMemo(() =>
        candidates.filter(c => relatedPostIds.includes(c.id)),
        [candidates, relatedPostIds]);

    const unselectedCandidates = useMemo(() =>
        candidates.filter(c => !relatedPostIds.includes(c.id)),
        [candidates, relatedPostIds]);

    // Score weights legend
    const scoreWeights = [
        { label: t('admin:blog.relatedPosts.weights.category', 'Category'), weight: 3, icon: <CategoryIcon fontSize="inherit" /> },
        { label: t('admin:blog.relatedPosts.weights.event', 'Event'), weight: 2, icon: <EventIcon fontSize="inherit" /> },
        { label: t('admin:blog.relatedPosts.weights.currency', 'Currency'), weight: 2, icon: <AttachMoneyIcon fontSize="inherit" /> },
        { label: t('admin:blog.relatedPosts.weights.tag', 'Tag'), weight: 1, icon: <LocalOfferIcon fontSize="inherit" /> },
        { label: t('admin:blog.relatedPosts.weights.keyword', 'Keyword'), weight: 0.5, icon: <KeyIcon fontSize="inherit" /> },
    ];

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ArticleIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                        {t('admin:blog.relatedPosts.title', 'Related Posts')}
                    </Typography>
                    <Chip
                        label={`${relatedPostIds.length}/${BLOG_LIMITS.MAX_RELATED_POSTS}`}
                        size="small"
                        color={relatedPostIds.length > 0 ? 'primary' : 'default'}
                    />
                </Box>
                <IconButton size="small">
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ mt: 2 }}>
                    {/* Score weights legend */}
                    <Alert
                        severity="info"
                        variant="outlined"
                        icon={<InfoOutlinedIcon />}
                        sx={{ mb: 2 }}
                    >
                        <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                            {t('admin:blog.relatedPosts.scoringInfo', 'Scoring weights per match:')}
                        </Typography>
                        <Stack direction="row" spacing={1.5} flexWrap="wrap">
                            {scoreWeights.map(({ label, weight, icon }) => (
                                <Chip
                                    key={label}
                                    icon={icon}
                                    label={`${label}: +${weight}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                />
                            ))}
                        </Stack>
                    </Alert>

                    {/* Controls */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                {t('admin:blog.relatedPosts.displayCount', 'Posts to show on page')}
                            </Typography>
                            <Slider
                                value={displayCount}
                                onChange={(_, v) => setDisplayCount(v)}
                                min={1}
                                max={BLOG_LIMITS.MAX_RELATED_POSTS}
                                marks
                                valueLabelDisplay="auto"
                                sx={{ mt: 1 }}
                            />
                        </Box>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleSelectTopN}
                            disabled={loading || candidates.length === 0}
                        >
                            {t('admin:blog.relatedPosts.selectTop', 'Select Top {{count}}', { count: displayCount })}
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={handleClearAll}
                            disabled={relatedPostIds.length === 0}
                        >
                            {t('admin:blog.relatedPosts.clearAll', 'Clear All')}
                        </Button>
                        <Tooltip title={t('admin:blog.relatedPosts.refresh', 'Refresh suggestions')}>
                            <IconButton onClick={fetchPreview} disabled={loading} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {/* Loading */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    )}

                    {/* Candidates list */}
                    {!loading && candidates.length > 0 && (
                        <>
                            {/* Selected posts */}
                            {selectedCandidates.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                        {t('admin:blog.relatedPosts.selected', 'Selected ({{count}})', { count: selectedCandidates.length })}
                                    </Typography>
                                    {selectedCandidates.map(candidate => (
                                        <CandidateCard
                                            key={candidate.id}
                                            candidate={candidate}
                                            isSelected={true}
                                            onToggle={handleToggle}
                                            maxScore={maxScore}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Divider */}
                            {selectedCandidates.length > 0 && unselectedCandidates.length > 0 && (
                                <Divider sx={{ my: 2 }} />
                            )}

                            {/* Suggestions */}
                            {unselectedCandidates.length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                        {t('admin:blog.relatedPosts.suggestions', 'Suggestions (by score)')}
                                    </Typography>
                                    <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                                        {unselectedCandidates.map(candidate => (
                                            <CandidateCard
                                                key={candidate.id}
                                                candidate={candidate}
                                                isSelected={false}
                                                onToggle={handleToggle}
                                                maxScore={maxScore}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Empty state */}
                    {!loading && candidates.length === 0 && (
                        <Alert severity="info" variant="outlined">
                            {t('admin:blog.relatedPosts.noSuggestions', 'No other published posts available for suggestions. Publish more posts to see related content suggestions.')}
                        </Alert>
                    )}

                    {/* Help text */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        {t('admin:blog.relatedPosts.helpText', 'Selected posts will appear as "Related Articles" at the bottom of the published post. Posts with higher scores have more relevance based on shared categories, events, currencies, tags, and keywords.')}
                    </Typography>
                </Box>
            </Collapse>
        </Paper>
    );
};

RelatedPostsPreview.propTypes = {
    postData: PropTypes.shape({
        id: PropTypes.string,
        category: PropTypes.string,
        eventTags: PropTypes.array,
        currencyTags: PropTypes.array,
        tags: PropTypes.array,
        keywords: PropTypes.array,
    }),
    relatedPostIds: PropTypes.array.isRequired,
    onRelatedPostsChange: PropTypes.func.isRequired,
    maxRelatedPosts: PropTypes.number,
    lang: PropTypes.string,
};

export default RelatedPostsPreview;
