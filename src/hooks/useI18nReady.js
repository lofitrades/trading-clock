/**
 * src/hooks/useI18nReady.js
 *
 * Purpose: BEP standard hook for i18n translation readiness.
 * Wraps react-i18next's useTranslation and exposes the `ready` flag so components
 * can show Skeleton placeholders instead of raw translation keys on first load.
 *
 * With HTTP-backend lazy loading (i18n/config.js), non-preloaded namespaces
 * (everything except 'common' and 'pages') are fetched on-demand when a component
 * first mounts. During the ~50-100 ms fetch window, `t('key')` returns the raw
 * key string. This hook + the companion <TextSkeleton> component eliminate that
 * flash by gating rendered text on `isReady`.
 *
 * Usage:
 *   const { t, i18n, isReady } = useI18nReady(['calendar', 'clockPage']);
 *
 *   // Option A — inline ternary (single value)
 *   {isReady ? t('calendar:title') : <Skeleton width={80} />}
 *
 *   // Option B — <TextSkeleton> helper (multiple values, cleaner JSX)
 *   <TextSkeleton ready={isReady} width={60}>{t('calendar:table.headers.time')}</TextSkeleton>
 *
 *   // Option C — early-return skeleton layout (entire component)
 *   if (!isReady) return <SkeletonLayout />;
 *
 * Changelog:
 * v1.0.0 - 2026-02-13 - Initial implementation. BEP codebase-wide i18n skeleton guard standard.
 */

import { useTranslation } from 'react-i18next';

/**
 * Wraps useTranslation with a standardised `isReady` boolean.
 *
 * @param {string|string[]} namespaces — Namespace(s) the component needs.
 * @param {object}          [options]  — Forwarded to useTranslation (keyPrefix, etc.).
 * @returns {{ t: Function, i18n: object, isReady: boolean }}
 */
export default function useI18nReady(namespaces, options) {
  const { t, i18n, ready } = useTranslation(namespaces, options);
  return { t, i18n, isReady: ready };
}
