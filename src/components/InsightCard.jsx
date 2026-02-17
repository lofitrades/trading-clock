/**
 * src/components/InsightCard.jsx
 *
 * Purpose: Polymorphic card component for rendering individual Insight items.
 * Supports three variants:
 * - Article: Link + cover image + title + excerpt + reading time + like count
 * - Activity: Badge (severity) + icon + title + description + timestamp
 * - Note: Expandable note with event name + currency + user text + username + date
 *
 * Used in: InsightsTimeline (maps items to cards)
 *
 * Design: Compact MUI Card (~200px height), responsive, hover effects.
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP P4: Added type-specific icons and i18n labels for activity variants
 * v1.0.0 - 2026-02-10 - Phase 5: Initial implementation
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    Stack,
    IconButton,
    Link,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS = {
    error: 'error',
    warning: 'warning',
    success: 'success',
    info: 'info',
};

/** Type-specific icons for activity variants */
const TYPE_ICONS = {
    event_rescheduled: '📅',
    event_cancelled: '❌',
    event_reinstated: '✅',
    blog_published: '📰',
    sync_completed: '🔄',
    sync_failed: '⚠️',
    blog_created: '📝',
    gpt_upload: '🤖',
    user_signup: '👤',
};

/**
 * InsightCard component
 * Polymorphic card supporting article, activity, and note variants
 *
 * @param {Object} props
 * @param {Object} props.item - Insight item object
 * @param {string} props.item.id - Unique identifier
 * @param {string} props.item.sourceType - 'article' | 'activity' | 'note'
 * @returns {JSX.Element}
 */
function InsightCard({ item }) {
    const { t } = useTranslation('insights');
    const [expanded, setExpanded] = useState(false);
    const [liked, setLiked] = useState(item.liked || false);

    // Article variant
    if (item.sourceType === 'article') {
        return (
            <Card
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                    },
                }}
            >
                {item.image && (
                    <CardMedia
                        component="img"
                        sx={{
                            width: { xs: '100%', sm: 120 },
                            height: { xs: 150, sm: 120 },
                            objectFit: 'cover',
                            flexShrink: 0,
                        }}
                        image={item.image}
                        alt={item.title}
                    />
                )}

                <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Link
                        href={item.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        sx={{ textDecoration: 'none' }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            {item.title}
                        </Typography>
                    </Link>

                    {item.excerpt && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {item.excerpt}
                        </Typography>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center">
                        {item.readingTime && (
                            <Chip
                                label={t('article.readingTime', { minutes: item.readingTime })}
                                size="small"
                                variant="outlined"
                            />
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton
                                size="small"
                                onClick={() => setLiked(!liked)}
                            >
                                {liked ? (
                                    <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                ) : (
                                    <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                                )}
                            </IconButton>
                            <Typography variant="caption" color="text.secondary">
                                {item.likes || 0}
                            </Typography>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    // Activity variant
    if (item.sourceType === 'activity') {
        const typeIcon = TYPE_ICONS[item.type] || '📌';
        const typeLabel = item.type
            ? t(`activity.types.${item.type}`, { defaultValue: t('activity.types.unknown') })
            : t('activity.types.unknown');

        return (
            <Card
                sx={{
                    borderLeft: 4,
                    borderColor: `${SEVERITY_COLORS[item.severity]}.main`,
                    transition: 'all 0.3s ease',
                    '&:hover': { boxShadow: 2 },
                }}
            >
                <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip
                            icon={
                                <Box sx={{ ml: 0.5 }}>
                                    {typeIcon}
                                </Box>
                            }
                            label={typeLabel}
                            size="small"
                            color={SEVERITY_COLORS[item.severity]}
                            variant="filled"
                        />
                    </Stack>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {item.title}
                    </Typography>

                    {item.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            {item.description}
                        </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                        {item.timestamp && new Date(item.timestamp).toLocaleString()}
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    // Note variant
    if (item.sourceType === 'note') {
        return (
            <Card
                sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': { boxShadow: 2 },
                }}
            >
                <CardContent sx={{ pb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        {item.eventKey && (
                            <Chip
                                label={item.eventKey}
                                size="small"
                                variant="outlined"
                            />
                        )}
                        {item.currency && (
                            <Chip
                                label={item.currency}
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {t('note.note')}
                            </Typography>

                            {!expanded && item.content && item.content.length > 100 && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {item.content.slice(0, 100)}
                                    ...
                                </Typography>
                            )}

                            {expanded && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
                                    {item.content}
                                </Typography>
                            )}
                        </Box>

                        <IconButton
                            size="small"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {item.userName && `${item.userName}`}
                            {item.userName && item.createdAt && ' • '}
                            {item.createdAt && new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    // Fallback: Unknown type
    return (
        <Card>
            <CardContent>
                <Typography color="text.secondary">
                    {t('card.unknownType')}
                </Typography>
            </CardContent>
        </Card>
    );
}

InsightCard.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string.isRequired,
        sourceType: PropTypes.oneOf(['article', 'activity', 'note']).isRequired,
        type: PropTypes.string,
        liked: PropTypes.bool,
        image: PropTypes.string,
        title: PropTypes.string,
        url: PropTypes.string,
        excerpt: PropTypes.string,
        readingTime: PropTypes.number,
        likes: PropTypes.number,
        severity: PropTypes.oneOf(['error', 'warning', 'success', 'info']),
        description: PropTypes.string,
        timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        eventKey: PropTypes.string,
        currency: PropTypes.string,
        content: PropTypes.string,
        userName: PropTypes.string,
        createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
};

export default InsightCard;
