/**
 * src/components/SessionLabel.jsx
 *
 * Purpose: Display the active or next trading session with adaptive sizing and countdowns.
 * Minimal chip-based label optimized for the clock overlay.
 *
 * Changelog:
 * v1.1.1 - 2025-12-16 - Apply background-aware text color to inactive/next-session chip via caller-provided contrast color.
 * v1.1.0 - 2025-12-16 - Added PropTypes, removed unused imports/vars, and corrected header path.
 * v1.0.0 - 2025-12-15 - Initial implementation.
 */

import PropTypes from 'prop-types';
import { Box, Chip, Stack, Fade } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  // Responsive scaling based on clock size - clean minimal design
  const baseSize = 375;
  const scaleFactor = Math.min(Math.max(clockSize / baseSize, 0.7), 1.3);

  // Font sizes that scale smoothly
  const titleSize = `${0.875 * scaleFactor}rem`; // 14px base
  const iconSize = 12 * scaleFactor;

  // Session color with adaptive text
  const sessionColor = activeSession?.color || '#757575';
  const sessionTextColor = isColorDark(sessionColor) ? '#fff' : '#000';
  const outlinedColor = contrastTextColor || '#4B4B4B';
  const outlinedBorderColor = `${outlinedColor}66`;

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '8px auto',
          maxWidth: '90vw',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            backgroundColor: 'transparent',
            padding: '4px 12px',
            transition: 'all 0.3s ease',
            mt: 2,
          }}
        >
          {/* Session Status Indicator */}
          {activeSession ? (
            <>
              {/* Active Session Chip with countdown inside */}
              <Chip
                label={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                      alignItems: 'center',
                      py: 0.25,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{activeSession.name}</span>
                    </Box>
                    {showTimeToEnd && timeToEnd != null && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.3,
                          fontSize: '0.75em',
                          opacity: 0.9,
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            fontSize: `${iconSize * 0.85}px`,
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.6 },
                            },
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>
                          Ends in: {formatTimeSmart(timeToEnd)}
                        </span>
                      </Box>
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
                  padding: '6px 10px',
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
              {/* No Active Session - Merged chip with next session info */}
              <Chip
                label={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                      alignItems: 'center',
                      py: 0.25,
                    }}
                  >
                    {showTimeToStart && nextSession && timeToStart != null && (
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.3,
                          fontSize: '0.75em',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{nextSession.name}</span>
                        <span style={{ fontWeight: 500, opacity: 0.9 }}>
                          starts in: {formatTimeSmart(timeToStart)}
                        </span>
                      </Box>
                    )}
                  </Box>
                }
                size="small"
                variant="outlined"
                sx={{
                  fontSize: titleSize,
                  fontWeight: 500,
                  height: 'auto',
                  padding: '6px 10px',
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
