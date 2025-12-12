/**
 * src/components/NewsSourceSelector.jsx
 * 
 * Purpose: Standalone news source selector with modal selection
 * Enterprise-grade component for economic calendar data source management
 * 
 * Features:
 * - Clean, compact header with modal selection
 * - Card-based source comparison (like subscription plans)
 * - Mobile-first responsive layout
 * - Smooth animations and transitions
 * - Enterprise UX patterns (proper spacing, typography, hierarchy)
 * - Accessibility-first (ARIA labels, keyboard navigation)
 * 
 * Changelog:
 * v3.0.0 - 2025-12-11 - Updated for canonical architecture (NFS + JBlanked); accurate copy with financial disclaimer
 * v2.0.0 - 2025-12-01 - Redesigned with modal selector showing all sources with details (subscription plan UX pattern)
 * v1.0.0 - 2025-12-01 - Initial implementation with enterprise best practices
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { NEWS_SOURCE_OPTIONS } from '../types/economicEvents';

/**
 * NewsSourceSelector Component
 * Clean, enterprise-grade selector with modal comparison view
 */
export default function NewsSourceSelector({ 
  value, 
  onChange,
  sx = {} 
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Get current source label
   */
  const currentSource = NEWS_SOURCE_OPTIONS.find(opt => opt.value === value) || NEWS_SOURCE_OPTIONS[0];

  /**
   * Handle source selection
   */
  const handleSelectSource = (sourceValue) => {
    onChange(sourceValue);
    setModalOpen(false);
  };

  return (
    <>
      {/* Compact Inline Button */}
      <Button
        variant="outlined"
        size="small"
        onClick={() => setModalOpen(true)}
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
        {currentSource.label}
      </Button>

      {/* Source Selection Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
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
              Select Data Source
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Choose your preferred economic calendar provider
            </Typography>
          </Box>
          <IconButton
            onClick={() => setModalOpen(false)}
            size="small"
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
          {/* Source Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mt: 2,
            }}
          >
            {NEWS_SOURCE_OPTIONS.map((source) => {
              const isSelected = source.value === value;
              
              // Canonical architecture: NFS API (breadth) + JBlanked API (actuals depth)
              // Dynamic data - statistics are illustrative and subject to change
              const sourceData = {
                'forex-factory': {
                  coverage: 'Comprehensive',
                  strength: 'Broad historical coverage',
                  availability: 'Primary source via JBlanked',
                },
                'mql5': {
                  coverage: 'Extensive',
                  strength: 'MetaTrader official data',
                  availability: 'Primary source via JBlanked',
                },
                'fxstreet': {
                  coverage: 'Limited',
                  strength: 'Real-time updates',
                  availability: 'Supplementary source',
                },
              };
              
              const data = sourceData[source.value];
              
              return (
                <Card
                  key={source.value}
                  elevation={isSelected ? 8 : 1}
                  sx={{
                    position: 'relative',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.dark' : 'primary.light',
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                  onClick={() => handleSelectSource(source.value)}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          color: 'white',
                          fontSize: 20,
                        }}
                      />
                    </Box>
                  )}

                  <CardContent sx={{ p: 2.5, pb: 1.5 }}>
                    {/* Source Name */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        fontSize: '1rem',
                        pr: 3,
                      }}
                    >
                      {source.label}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.5,
                        mb: 2,
                        minHeight: 60,
                      }}
                    >
                      {source.description}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Features */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon
                          sx={{
                            fontSize: 16,
                            color: 'info.main',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {data.coverage} coverage
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon
                          sx={{
                            fontSize: 16,
                            color: source.value === 'fxstreet' ? 'warning.main' : 'success.main',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {data.strength}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoOutlinedIcon
                          sx={{
                            fontSize: 16,
                            color: 'text.secondary',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {data.availability}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2.5, pt: 0 }}>
                    <Button
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSource(source.value);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1,
                      }}
                    >
                      {isSelected ? 'Current Source' : 'Select Source'}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>

          {/* Info Footer - Data Architecture & Disclaimer */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: alpha('#2196f3', 0.08),
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha('#2196f3', 0.2),
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
                    mb: 0.5,
                    fontSize: '0.875rem',
                  }}
                >
                  How Data is Sourced
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.75rem',
                    lineHeight: 1.6,
                    display: 'block',
                  }}
                >
                  This application aggregates economic calendar data from multiple trusted providers to give you comprehensive event coverage. 
                  The system automatically selects the highest quality data when the same event is available from multiple sources.
                  <br /><br />
                  <strong>Your selection determines which provider is prioritized.</strong> If your preferred source is unavailable for an event, 
                  the system will automatically use the next best available source.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Disclaimer */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: alpha('#ff9800', 0.08),
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: alpha('#ff9800', 0.2),
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: '0.7rem',
                lineHeight: 1.6,
                display: 'block',
                fontStyle: 'italic',
              }}
            >
              <strong>Important Disclaimer:</strong> This economic calendar is provided for informational and educational purposes only. 
              Data accuracy, completeness, and timeliness are not guaranteed. Event times, forecasts, and actual values may contain errors, 
              omissions, or delays. <strong>Do not use this information as the sole basis for trading or financial decisions.</strong>
              <br /><br />
              We are not responsible for any trading losses, investment decisions, or financial outcomes resulting from the use of this data. 
              Always verify critical information with official sources and consult qualified financial professionals before making investment decisions. 
              Past performance and forecasts do not guarantee future results.
              <br /><br />
              By using this application, you acknowledge that all data is sourced from third-party providers (NFS API, JBlanked API, Forex Factory, 
              MQL5/MetaTrader, FXStreet) and any inaccuracies or discrepancies are the responsibility of those original sources. 
              We provide this data "as is" without warranties of any kind.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
