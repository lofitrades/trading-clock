/**
 * src/components/SessionLabel.jsx
 *
 * Purpose: Display the active or next trading session with adaptive sizing and countdowns.
 * Minimal chip-based label optimized for the clock overlay.
 *
 * Changelog:
 * v1.8.0 - 2026-02-13 - BEP SIZE ENHANCEMENT: Increased icon and font sizes for better visibility.
 *                       titleSize increased from 0.875rem to 1.125rem base (14px → 18px), scales
 *                       with clockSize. Icons now match title prominence. Chip padding increased
 *                       to 8px for better spacing. Skeleton dimensions updated to match. Improved
 *                       readability on clock overlay without breaking responsive scaling.
 * v1.7.0 - 2026-02-13 - BEP ICON UNIFICATION: Added HighlightOffIcon (circled X) to inactive/next-session
 *                       chip label, matching CheckCircleIcon positioning and styling in active session.
 *                       Icon appears before session name for consistent visual hierarchy. Inactive and
 *                       active session labels now both start with a session status icon.
 * v1.6.0 - 2026-02-13 - BEP SKELETON UX: Added skeleton loading state using useTranslation ready flag.
 *                       Shows a rounded Skeleton chip placeholder matching active/inactive dimensions
 *                       while i18n translations load. Prevents layout shift and translation-key flash.
 *                       Imported Skeleton from MUI. Maintained Fade wrapper for smooth transition.
 * v1.5.0 - 2026-02-13 - BEP UI ACCESSIBILITY & UNIFICATION: (1) Active session now uses isDark()
 *                       function for text contrast accessibility (always checks color darkness,
 *                       not theme setting). (2) Unified UI format for both active and inactive:
 *                       icon + Session Name + " - " + Timer. (3) Moved CheckCircleIcon to beginning
 *                       of active session label with same font color and size as text (titleSize,
 *                       color: inherit). Icon still pulses to show activity. (4) Removed "Ends in:"
 *                       and "Starts in:" labels — now just timer value for brevity. Same visual
 *                       hierarchy across both session states. Improved space efficiency.
 * v1.4.0 - 2026-02-13 - BEP UI UNIFICATION: Updated active session chip to use merged single-line
 *                       layout (matching inactive session UI). Session name and "ends in:" text now
 *                       appear inline with CheckCircleIcon between them, rather than stacked vertically.
 *                       Removed flexDirection: 'column' and nested Box wrappers. Consistent visual
 *                       hierarchy between active and inactive session chips. Improved space efficiency.
 * v1.3.0 - 2026-02-13 - BEP i18n AUDIT: Replaced all hardcoded English strings ('Ends in:', 'starts in:')
 *                       with i18n translation keys from 'sessions' namespace (sessions:tooltip.endsIn,
 *                       sessions:tooltip.startsIn). Added useTranslation hook with useSuspense: false
 *                       for lazy-loaded namespace compatibility. Component now fully language-aware
 *                       across EN/ES/FR. No timezone or theme changes needed (already BEP compliant).
 * v1.2.0 - 2026-01-29 - BEP THEME-AWARE: Replaced hardcoded colors with MUI theme tokens.
 *                       #757575 → text.disabled, #fff/#000 → common.white/common.black,
 *                       #0F172A → text.primary, #4B4B4B → text.secondary. Adaptive
 *                       contrast logic preserved for session-based backgrounds.
 * v1.1.2 - 2026-01-08 - Fixed session chip text color: always use dark when backgroundBasedOnSession disabled, dynamic when enabled.
 * v1.1.1 - 2025-12-16 - Apply background-aware text color to inactive/next-session chip via caller-provided contrast color.
 * v1.1.0 - 2025-12-16 - Added PropTypes, removed unused imports/vars, and corrected header path.
 * v1.0.0 - 2025-12-15 - Initial implementation.
 */

import PropTypes from 'prop-types';
import { Box, Chip, Skeleton, Stack, Fade, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useTranslation } from 'react-i18next';
import { isColorDark } from '../utils/clockUtils';

// Smart time formatting: mm:ss if < 1h, hh:mm if >= 1h
const formatTimeSmart = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (seconds < 3600) {
    // Less than 1 hour: show mm'm':ss's'
    return `${m.toString().padStart(2, '0')}m:${s.toString().padStart(2, '0')}s`;
  } else {
    // 1 hour or more: show hh'h':mm'm'
    return `${h}h:${m.toString().padStart(2, '0')}m`;
  }
};

export default function SessionLabel({
  activeSession,
  showTimeToEnd,
  timeToEnd,
  showTimeToStart,
  nextSession,
  timeToStart,
  clockSize,
  contrastTextColor,
}) {
  const theme = useTheme();
  const { t, ready } = useTranslation('sessions', { useSuspense: false });

  // Responsive scaling based on clock size - clean minimal design
  const baseSize = 375;
  const scaleFactor = Math.min(Math.max(clockSize / baseSize, 0.7), 1.3);

  // Font sizes that scale smoothly
  const titleSize = `${1.125 * scaleFactor}rem`; // 18px base (increased from 14px for better visibility)

  // Session color with adaptive text - use theme tokens for defaults
  const sessionColor = activeSession?.color || theme.palette.text.disabled;
  // BEP: Use isColorDark for text contrast accessibility on both active and inactive
  const sessionTextColor = isColorDark(sessionColor)
    ? theme.palette.common.white
    : theme.palette.common.black;
  const outlinedColor = contrastTextColor || theme.palette.text.secondary;
  const outlinedBorderColor = `${outlinedColor}66`;

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          margin: '8px auto',
          maxWidth: '90vw',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{
            backgroundColor: 'transparent',
            padding: '4px 12px',
            transition: 'all 0.3s ease',
            mt: 1,
          }}
        >
          {/* Skeleton placeholder while i18n loads */}
          {!ready ? (
            <Skeleton
              variant="rounded"
              width={200 * scaleFactor}
              height={40 * scaleFactor}
              sx={{ borderRadius: '16px' }}
            />
          ) : activeSession ? (
            <>
              {/* Active Session Chip — icon + name + " - " + timer */}
              <Chip
                label={
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.4,
                      py: 0.25,
                    }}
                  >
                    {showTimeToEnd && timeToEnd != null && (
                      <CheckCircleIcon
                        sx={{
                          fontSize: titleSize,
                          color: 'inherit',
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.6 },
                          },
                        }}
                      />
                    )}
                    <span style={{ fontWeight: 600 }}>{activeSession.name}</span>
                    {showTimeToEnd && timeToEnd != null && (
                      <>
                        <span style={{ fontWeight: 500 }}> - </span>
                        <span style={{ fontWeight: 500 }}>
                          {t('tooltip.endsIn')}: {formatTimeSmart(timeToEnd)}
                        </span>
                      </>
                    )}
                  </Box>
                }
                size="small"
                sx={{
                  backgroundColor: sessionColor,
                  color: sessionTextColor,
                  fontWeight: 600,
                  fontSize: titleSize,
                  height: 'auto',
                  padding: '8px 12px',
                  '& .MuiChip-label': {
                    padding: '0 4px',
                    width: '100%',
                  },
                  border: 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </>
          ) : (
            <>
              <Chip
                label={
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.4,
                      py: 0.25,
                    }}
                  >
                    {showTimeToStart && nextSession && timeToStart != null && (
                      <>
                        <HighlightOffIcon
                          sx={{
                            fontSize: titleSize,
                            color: 'inherit',
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{nextSession.name}</span>
                        <span style={{ fontWeight: 500 }}> - </span>
                        <span style={{ fontWeight: 500 }}>
                          {t('tooltip.startsIn')}: {formatTimeSmart(timeToStart)}
                        </span>
                      </>
                    )}
                  </Box>
                }
                size="small"
                variant="outlined"
                sx={{
                  fontSize: titleSize,
                  fontWeight: 500,
                  height: 'auto',
                  padding: '8px 12px',
                  borderColor: outlinedBorderColor,
                  color: outlinedColor,
                  '& .MuiChip-label': {
                    padding: '0 4px',
                    width: '100%',
                  },
                }}
              />
            </>
          )}
        </Stack>
      </Box>
    </Fade>
  );
}

SessionLabel.propTypes = {
  activeSession: PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string,
  }),
  showTimeToEnd: PropTypes.bool,
  timeToEnd: PropTypes.number,
  showTimeToStart: PropTypes.bool,
  nextSession: PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string,
  }),
  timeToStart: PropTypes.number,
  clockSize: PropTypes.number.isRequired,
  contrastTextColor: PropTypes.string,
};
