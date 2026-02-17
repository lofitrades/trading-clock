/**
 * src/components/InsightsTimeline.jsx
 *
 * Purpose: Timeline view container for Insights feed items.
 * Renders vertical timeline with alternating left/right card layout.
 * Maps items array to InsightCard components.
 *
 * Used in: InsightsPanel (main content area)
 *
 * Design: Compact cards with timeline connector lines, responsive mobile.
 *
 * Changelog:
 * v1.0.0 - 2026-02-10 - Phase 5: Initial implementation
 */

import PropTypes from 'prop-types';
import {
    Box,
    Stack,
} from '@mui/material';
import InsightCard from './InsightCard';

/**
 * InsightsTimeline component
 * Renders a vertical timeline of insight items
 *
 * @param {Object} props
 * @param {Array<Object>} props.items - Array of insight objects (articles, activities, notes)
 * @returns {JSX.Element}
 */
export default function InsightsTimeline({ items = [] }) {
    if (!items.length) {
        return null;
    }

    return (
        <Stack spacing={2} sx={{ position: 'relative' }}>
            {/* Timeline connector line (vertical) */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: '100%',
                    bgcolor: 'divider',
                    top: 0,
                    zIndex: 0,
                    display: { xs: 'none', md: 'block' }, // Hide on mobile
                }}
            />

            {/* Timeline items */}
            {items.map((item, index) => (
                <Box
                    key={item.id}
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <InsightCard item={item} alternateLayout={index % 2 === 0} />
                </Box>
            ))}
        </Stack>
    );
}

InsightsTimeline.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
};
