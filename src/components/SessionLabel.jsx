// src/components/SessionLabel2.jsx
import React from 'react';
import { Box, Chip, Stack, Typography, Fade } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { isColorDark, formatTime } from '../utils/clockUtils';

export default function SessionLabel({
  activeSession,
  showTimeToEnd,
  timeToEnd,
  showTimeToStart,
  nextSession,
  timeToStart,
  clockSize,
}) {
  // Responsive scaling based on clock size - clean minimal design
  const baseSize = 375;
  const scaleFactor = Math.min(Math.max(clockSize / baseSize, 0.7), 1.3);
  
  // Font sizes that scale smoothly
  const titleSize = `${0.875 * scaleFactor}rem`; // 14px base
  const detailSize = `${0.75 * scaleFactor}rem`; // 12px base
  const iconSize = 12 * scaleFactor;
  
  // Session color with adaptive text
  const sessionColor = activeSession?.color || '#757575';
  const textColor = isColorDark(sessionColor) ? '#fff' : '#000';
  
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
          }}
        >
          {/* Session Status Indicator */}
          {activeSession ? (
            <>
              {/* Active Session Chip */}
              <Chip
                icon={
                  <FiberManualRecordIcon 
                    sx={{ 
                      fontSize: `${iconSize}px !important`,
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                      },
                    }} 
                  />
                }
                label={activeSession.name}
                size="small"
                sx={{
                  backgroundColor: sessionColor,
                  color: textColor,
                  fontWeight: 600,
                  fontSize: titleSize,
                  height: 'auto',
                  padding: '4px 8px',
                  '& .MuiChip-label': {
                    padding: '0 4px',
                  },
                  '& .MuiChip-icon': {
                    marginLeft: '4px',
                    color: textColor,
                  },
                  border: 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              
              {/* Time to End */}
              {showTimeToEnd && timeToEnd != null && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: iconSize }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: detailSize,
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatTime(timeToEnd)}
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
              {/* No Active Session - Show Next Session */}
              <Chip
                label="Market Inactive"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: titleSize,
                  fontWeight: 500,
                  height: 'auto',
                  padding: '4px 8px',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '& .MuiChip-label': {
                    padding: '0 4px',
                  },
                }}
              />
              
              {/* Next Session Info */}
              {showTimeToStart && nextSession && timeToStart != null && (
                <>
                  <Box
                    sx={{
                      width: '1px',
                      height: '16px',
                      backgroundColor: 'divider',
                    }}
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: detailSize,
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      Next:
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: detailSize,
                        color: 'text.primary',
                        fontWeight: 600,
                      }}
                    >
                      {nextSession.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: detailSize,
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      in {formatTime(timeToStart)}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Fade>
  );
}
