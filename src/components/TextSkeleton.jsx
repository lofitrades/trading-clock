/**
 * src/components/TextSkeleton.jsx
 *
 * Purpose: BEP standard inline skeleton guard for translated text.
 * Renders a MUI Skeleton when translations are not yet loaded (`ready=false`),
 * and the translated children when ready. Prevents raw i18n key flash on
 * first load for lazy-loaded namespaces (HTTP-backend).
 *
 * Pairs with useI18nReady hook — together they form the codebase-wide standard
 * for eliminating translation key flash.
 *
 * Usage:
 *   const { t, isReady } = useI18nReady(['calendar']);
 *   <TextSkeleton ready={isReady} width={60}>{t('calendar:table.headers.time')}</TextSkeleton>
 *
 * Props:
 *   ready    — boolean, true when translations are loaded
 *   width    — Skeleton width (number | string), default 40
 *   height   — Skeleton height (number | string), optional
 *   variant  — Skeleton variant ('text' | 'circular' | 'rounded'), default 'text'
 *   sx       — Additional sx props forwarded to Skeleton
 *   children — Translated text to render when ready
 *
 * Changelog:
 * v1.0.0 - 2026-02-13 - Initial implementation. BEP codebase-wide i18n skeleton guard.
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Skeleton } from '@mui/material';

const TextSkeleton = memo(function TextSkeleton({
    ready,
    children,
    width = 40,
    height,
    variant = 'text',
    sx,
}) {
    if (ready) return children;
    return (
        <Skeleton
            variant={variant}
            width={width}
            height={height}
            sx={{ display: 'inline-block', ...sx }}
        />
    );
});

TextSkeleton.displayName = 'TextSkeleton';

TextSkeleton.propTypes = {
    ready: PropTypes.bool.isRequired,
    children: PropTypes.node,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    variant: PropTypes.oneOf(['text', 'circular', 'rounded']),
    sx: PropTypes.object,
};

export default TextSkeleton;
