/**
 * src/components/NewsSourceSelector.jsx
 * 
 * Purpose: Informational modal explaining Forex Factory data source
 * Enterprise-grade component for building user trust and confidence in data quality
 * Supports both standalone and controlled modes for flexible integration
 * 
 * Features:
 * - Clean, compact info button that opens detailed modal
 * - Professional copywriting focused on data reliability and accuracy
 * - Mobile-first responsive layout
 * - Enterprise UX patterns (proper spacing, typography, hierarchy)
 * - Trust-building messaging without being salesy
 * - Controlled mode: open/onOpenChange props for parent component control
 * - Standalone mode: internal state management (default)
 * 
 * Changelog:
 * v4.1.0 - 2026-01-07 - Added controlled mode support: accept open, onOpenChange props for parent integration. Added showButton prop to hide button in controlled mode. Maintains backward compatibility with internal state management.
 * v4.0.0 - 2026-01-06 - Converted to informational-only modal. Removed source selection, now displays Forex Factory data provenance and builds user confidence.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import PublicIcon from '@mui/icons-material/Public';
import UpdateIcon from '@mui/icons-material/Update';

/**
 * NewsSourceSelector Component
 * Informational modal about Forex Factory data source
 * 
 * Props:
 *   sx - MUI sx prop for styling the button (default: {})
 *   open - Controlled modal state (optional)
 *   onOpenChange - Callback when modal state changes (optional)
 *   showButton - Whether to show the info button (default: true)
 */
export default function NewsSourceSelector({
  sx = {},
  open: controlledOpen = undefined,
  onOpenChange = undefined,
  showButton = true
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const modalOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Data Source Info Button - only show if showButton is true */}
      {showButton && (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleOpenChange(true)}
          endIcon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            borderColor: 'divider',
            color: 'text.primary',
            px: { xs: 1.5, sm: 2 },
            py: 0.75,
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
            ...sx,
          }}
        >
          Forex Factory
        </Button>
      )}

      {/* Data Source Information Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => handleOpenChange(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Powered by Forex Factory
            </Typography>
          </Box>
          <IconButton
            onClick={() => handleOpenChange(false)}
            size="small"
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3 } }}>
          {/* Introduction */}
          <Typography
            variant="body1"
            fontWeight={600}
            sx={{
              fontSize: '0.9375rem',
              lineHeight: 1.7,
              my: 3,
            }}
          >
            Our economic calendar displays the same high-quality data you&apos;ll find on Forex Factory,
            one of the most trusted and widely-used sources in the trading community.
          </Typography>

          {/* Key Features */}
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              p: 2.5,
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '1rem',
              }}
            >
              What You Get
            </Typography>
            <List dense disablePadding>
              <ListItem disableGutters sx={{ py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <VerifiedIcon sx={{ fontSize: 20, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Comprehensive Event Coverage"
                  secondary="Every major economic event from global markets"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8125rem',
                  }}
                />
              </ListItem>
              <ListItem disableGutters sx={{ py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <UpdateIcon sx={{ fontSize: 20, color: 'info.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Real-Time Updates"
                  secondary="Event times, forecasts, and actual values as they happen"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8125rem',
                  }}
                />
              </ListItem>
              <ListItem disableGutters sx={{ py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PublicIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Trusted by Millions"
                  secondary="The same data source used by professional traders worldwide"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8125rem',
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* Why Forex Factory */}
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.info.main, 0.08),
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha(theme.palette.info.main, 0.2),
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <InfoOutlinedIcon
                sx={{
                  fontSize: 20,
                  color: 'info.main',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 0.75,
                    fontSize: '0.875rem',
                  }}
                >
                  Industry-Standard Reliability
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                  }}
                >
                  Forex Factory has been the go-to economic calendar for traders since 2004.
                  Their meticulous data collection and prompt updates have made them the industry
                  standard. By using their data, you&apos;re accessing the same information that millions
                  of professional and retail traders rely on daily.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Disclaimer */}
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.2),
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: '0.75rem',
                lineHeight: 1.6,
                display: 'block',
              }}
            >
              <strong>Important:</strong> This economic calendar is provided for informational purposes only.
              While we source data from Forex Factory, we cannot guarantee absolute accuracy, completeness,
              or timeliness. Event times, forecasts, and actual values may contain errors or delays.
              <br /><br />
              <strong>Always verify critical information with official sources and never use this data as
                your sole basis for trading decisions.</strong> Consult qualified financial professionals
              before making investment decisions. Past performance and forecasts do not guarantee future results.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

NewsSourceSelector.propTypes = {
  sx: PropTypes.object,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  showButton: PropTypes.bool,
};
