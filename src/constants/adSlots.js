/**
 * src/constants/adSlots.js
 *
 * Purpose: AdSense ad slot configuration constants.
 * Shared between AdUnit component and pages that reference slot IDs.
 *
 * Changelog:
 * v1.0.0 - 2026-02-06 - Phase 7: Initial implementation
 */

/** Publisher ID — shared across all ad units */
export const ADS_CLIENT_ID = 'ca-pub-3984565509623618';

/** Ad slot registry — all blog ad units */
export const AD_SLOTS = {
    BLOG_LIST_DISPLAY: '5605015898',
    BLOG_POST_MID: '8390961336',
    BLOG_POST_BOTTOM: '7453176382',
};
