/**
 * src/constants/overlayStyles.js
 * 
 * Purpose: Centralized overlay styling for consistent modal/drawer backdrop appearance across the app.
 * Provides frosted glass effect with premium dark overlay for all Dialog, Drawer, and Modal components.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-17 - Initial implementation with standard frosted glass backdrop styling
 */

/**
 * Standard backdrop overlay styling for all modals and drawers
 * Creates frosted glass effect with blur and premium dark overlay
 * 
 * Usage:
 * <Dialog
 *   slotProps={{
 *     backdrop: { sx: BACKDROP_OVERLAY_SX }
 *   }}
 * />
 */
export const BACKDROP_OVERLAY_SX = {
  backdropFilter: 'blur(4px)',
  bgcolor: 'rgba(0,0,0,0.5)',
};
