/**
 * src/components/EventsFilters.jsx
 * 
 * Purpose: Filter controls for economic events with date range, impact, type, and currency
 * Mobile-first responsive design with collapsible filter panel
 * 
 * Changelog:
 * v1.0.0 - 2025-11-29 - Initial implementation with advanced filtering
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  IconButton,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getEventCategories, getEventCurrencies } from '../services/economicEventsService';

/**
 * Impact levels with colors (matching Firestore 'strength' field values)
 * Based on MQL5 Economic Calendar API:
 * - "Strong Data" = High impact
 * - "Moderate Data" = Medium impact  
 * - "Weak Data" = Low impact
 * - "Non-Economic" / empty = None
 * - "Data Not Loaded" = Future events (impact not yet determined)
 */
const IMPACT_LEVELS = [
  { value: 'Strong Data', label: 'High Impact', color: 'error.main' },
  { value: 'Moderate Data', label: 'Medium Impact', color: 'warning.main' },
  { value: 'Weak Data', label: 'Low Impact', color: 'info.main' },
  { value: 'Data Not Loaded', label: 'Unknown (Future)', color: 'grey.500' },
  { value: 'Non-Economic', label: 'Non-Eco.', color: 'grey.500' },
  { value: 'None', label: 'None', color: 'grey.400' },
];

/**
 * EventsFilters Component
 * Provides filtering controls for economic events
 */
export default function EventsFilters({ 
  filters, 
  onFiltersChange, 
  onApply,
  loading = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Local state for filters
  const [localFilters, setLocalFilters] = useState({
    startDate: null,
    endDate: null,
    impacts: [],
    eventTypes: [],
    currencies: [],
    ...filters,
  });

  /**
   * Fetch categories and currencies on mount
   */
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      
      const [categoriesResult, currenciesResult] = await Promise.all([
        getEventCategories(),
        getEventCurrencies(),
      ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      if (currenciesResult.success) {
        setCurrencies(currenciesResult.data);
      }

      setLoadingOptions(false);
    };

    fetchOptions();
  }, []);

  /**
   * Update local filter state
   */
  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  /**
   * Toggle array values (for checkboxes)
   */
  const toggleArrayValue = (field, value) => {
    const currentValues = localFilters[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    console.log(`🔄 [EventsFilters] Toggle ${field}:`, {
      value,
      before: currentValues,
      after: newValues,
    });
    
    handleFilterChange(field, newValues);
  };

  /**
   * Apply filters
   */
  const handleApply = () => {
    console.log('🎯 [EventsFilters] Applying filters:', {
      startDate: localFilters.startDate?.toISOString(),
      endDate: localFilters.endDate?.toISOString(),
      impacts: localFilters.impacts,
      eventTypes: localFilters.eventTypes,
      currencies: localFilters.currencies,
    });
    onFiltersChange(localFilters);
    if (onApply) onApply(localFilters); // Pass filters to parent
    setExpanded(false);
  };

  /**
   * Reset all filters to "This Week" default
   */
  const handleReset = () => {
    // Calculate This Week date range
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (6 - dayOfWeek));
    endDate.setHours(23, 59, 59, 999);

    const resetFilters = {
      startDate,
      endDate,
      impacts: [],
      eventTypes: [],
      currencies: [],
    };
    
    console.log('🔄 Reset filters to This Week:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    if (onApply) onApply(resetFilters); // Pass reset filters to parent
  };

  /**
   * Check if current date range matches a preset
   * Returns preset name if match, null otherwise
   */
  const getActivePreset = () => {
    if (!localFilters.startDate || !localFilters.endDate) return null;

    const now = new Date();
    const start = new Date(localFilters.startDate);
    const end = new Date(localFilters.endDate);

    // Normalize times for comparison (set to midnight/end of day)
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check Today
    if (startDay.getTime() === today.getTime() && 
        endDay.getDate() === today.getDate() &&
        endDay.getMonth() === today.getMonth() &&
        endDay.getFullYear() === today.getFullYear()) {
      return { key: 'today', label: 'Today' };
    }

    // Check Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (startDay.getTime() === tomorrow.getTime() &&
        endDay.getDate() === tomorrow.getDate() &&
        endDay.getMonth() === tomorrow.getMonth() &&
        endDay.getFullYear() === tomorrow.getFullYear()) {
      return { key: 'tomorrow', label: 'Tomorrow' };
    }

    // Check This Week
    const dayOfWeek = now.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + (6 - dayOfWeek));
    if (startDay.getTime() === weekStart.getTime() &&
        endDay.getDate() === weekEnd.getDate() &&
        endDay.getMonth() === weekEnd.getMonth()) {
      return { key: 'thisWeek', label: 'This Week' };
    }

    // Check Next Week
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(today.getDate() + 7);
    if (startDay.getTime() === today.getTime() &&
        endDay.getDate() === nextWeekEnd.getDate() &&
        endDay.getMonth() === nextWeekEnd.getMonth()) {
      return { key: 'nextWeek', label: 'Next Week' };
    }

    // Check Past Week
    const pastWeekStart = new Date(today);
    pastWeekStart.setDate(today.getDate() - 7);
    if (startDay.getDate() === pastWeekStart.getDate() &&
        startDay.getMonth() === pastWeekStart.getMonth() &&
        endDay.getDate() === today.getDate() &&
        endDay.getMonth() === today.getMonth()) {
      return { key: 'week', label: 'Past Week' };
    }

    // Check Next Month
    const nextMonthEnd = new Date(today);
    nextMonthEnd.setMonth(today.getMonth() + 1);
    if (startDay.getTime() === today.getTime() &&
        endDay.getMonth() === nextMonthEnd.getMonth() &&
        endDay.getDate() === nextMonthEnd.getDate()) {
      return { key: 'nextMonth', label: 'Next Month' };
    }

    // Check This Month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    if (startDay.getDate() === 1 &&
        startDay.getMonth() === now.getMonth() &&
        endDay.getMonth() === now.getMonth() &&
        endDay.getDate() === monthEnd.getDate()) {
      return { key: 'thisMonth', label: 'This Month' };
    }

    // Check Past Month
    const pastMonthStart = new Date(today);
    pastMonthStart.setMonth(today.getMonth() - 1);
    if (startDay.getMonth() === pastMonthStart.getMonth() &&
        startDay.getDate() === pastMonthStart.getDate() &&
        endDay.getDate() === today.getDate() &&
        endDay.getMonth() === today.getMonth()) {
      return { key: 'month', label: 'Past Month' };
    }

    return null;
  };

  /**
   * Quick date presets
   */
  const setDatePreset = (preset) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'tomorrow':
        startDate.setDate(now.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisWeek':
        // Get start of current week (Sunday)
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        // Get end of current week (Saturday)
        endDate.setDate(now.getDate() + (6 - dayOfWeek));
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'nextWeek':
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        // First day of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        // Last day of current month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'nextMonth':
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        return;
    }

    console.log(`📅 Date preset "${preset}" applied:`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      local: {
        start: startDate.toLocaleString(),
        end: endDate.toLocaleString(),
      }
    });

    setLocalFilters({
      ...localFilters,
      startDate,
      endDate,
    });
  };

  /**
   * Count active filters
   * Note: Preset date ranges count as 1 filter, custom ranges count as 2
   */
  const activeFilterCount = (() => {
    const activePreset = getActivePreset();
    
    // If a preset is active, count date range as 1 filter
    const dateFilterCount = activePreset 
      ? 1 
      : (localFilters.startDate ? 1 : 0) + (localFilters.endDate ? 1 : 0);
    
    return (
      dateFilterCount +
      (localFilters.impacts?.length || 0) +
      (localFilters.eventTypes?.length || 0) +
      (localFilters.currencies?.length || 0)
    );
  })();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filter Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 1.5, sm: 2 },
          py: 1,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={() => setExpanded(!expanded)}
          startIcon={<FilterListIcon />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Filters
          {activeFilterCount > 0 && (
            <Badge
              badgeContent={activeFilterCount}
              color="primary"
              sx={{ 
                ml: 1.5,
                mr: 1,
                '& .MuiBadge-badge': {
                  right: -4,
                  top: 2,
                  padding: '0 4px',
                  minWidth: 20,
                  height: 20,
                }
              }}
            />
          )}
        </Button>
      </Box>

      {/* Filter Panel */}
      <Collapse in={expanded} timeout="auto">
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack spacing={2.5}>
              {/* Date Range Accordion */}
              <Accordion 
                defaultExpanded
                disableGutters 
                elevation={0}
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: 'transparent',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    minHeight: 40,
                    px: 0,
                    '& .MuiAccordionSummary-content': {
                      my: 0.5,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 16 }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Date Range
                    </Typography>
                    {getActivePreset() && (
                      <Chip 
                        label={getActivePreset().label} 
                        size="small" 
                        color="primary"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                  {/* Quick Presets */}
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'tomorrow', label: 'Tomorrow' },
                      { key: 'thisWeek', label: 'This Week' },
                      { key: 'thisMonth', label: 'This Month' },
                      { key: 'nextWeek', label: 'Next Week' },
                      { key: 'nextMonth', label: 'Next Month' },
                      { key: 'week', label: 'Past Week' },
                      { key: 'month', label: 'Past Month' },
                    ].map(preset => {
                      const activePreset = getActivePreset();
                      const isActive = activePreset?.key === preset.key;
                      
                      return (
                        <Chip
                          key={preset.key}
                          label={preset.label}
                          size="small"
                          onClick={() => setDatePreset(preset.key)}
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            fontWeight: isActive ? 600 : 400,
                            bgcolor: isActive ? 'primary.main' : 'default',
                            color: isActive ? 'primary.contrastText' : 'text.primary',
                            '&:hover': {
                              bgcolor: isActive ? 'primary.dark' : 'action.hover',
                            }
                          }}
                        />
                      );
                    })}
                  </Stack>

                  {/* Date Pickers */}
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={1.5}
                  >
                    <DatePicker
                      label="Start Date"
                      value={localFilters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                    />
                    <DatePicker
                      label="End Date"
                      value={localFilters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      minDate={localFilters.startDate}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 1 }} />

              {/* Advanced Filters - Accordions */}
              <Box>
                {/* Expected Impact Accordion */}
                <Accordion 
                  disableGutters 
                  elevation={0}
                  sx={{
                    '&:before': { display: 'none' },
                    bgcolor: 'transparent',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 40,
                      px: 0,
                      '& .MuiAccordionSummary-content': {
                        my: 0.5,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Expected Impact
                      </Typography>
                      {localFilters.impacts?.length > 0 && (
                        <Chip 
                          label={localFilters.impacts.length} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                    <FormGroup>
                      <Stack spacing={0.5}>
                        {IMPACT_LEVELS.map(({ value, label, color }) => (
                          <FormControlLabel
                            key={value}
                            control={
                              <Checkbox
                                size="small"
                                checked={localFilters.impacts?.includes(value) || false}
                                onChange={() => toggleArrayValue('impacts', value)}
                                sx={{
                                  color: color,
                                  '&.Mui-checked': {
                                    color: color,
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                {label}
                              </Typography>
                            }
                          />
                        ))}
                      </Stack>
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 1 }} />

                {/* Event Type Accordion */}
                <Accordion 
                  disableGutters 
                  elevation={0}
                  sx={{
                    '&:before': { display: 'none' },
                    bgcolor: 'transparent',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 40,
                      px: 0,
                      '& .MuiAccordionSummary-content': {
                        my: 0.5,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Event Type
                      </Typography>
                      {localFilters.eventTypes?.length > 0 && (
                        <Chip 
                          label={localFilters.eventTypes.length} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                    {loadingOptions ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <FormGroup>
                        <Box
                          sx={{
                            maxHeight: 150,
                            overflow: 'auto',
                            pr: 1,
                          }}
                        >
                          <Stack spacing={0.5}>
                            {categories.map((category) => (
                              <FormControlLabel
                                key={category}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={localFilters.eventTypes?.includes(category) || false}
                                    onChange={() => toggleArrayValue('eventTypes', category)}
                                  />
                                }
                                label={
                                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    {category}
                                  </Typography>
                                }
                              />
                            ))}
                          </Stack>
                        </Box>
                      </FormGroup>
                    )}
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 1 }} />

                {/* Currencies Accordion */}
                <Accordion 
                  disableGutters 
                  elevation={0}
                  sx={{
                    '&:before': { display: 'none' },
                    bgcolor: 'transparent',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 40,
                      px: 0,
                      '& .MuiAccordionSummary-content': {
                        my: 0.5,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Currencies
                      </Typography>
                      {localFilters.currencies?.length > 0 && (
                        <Chip 
                          label={localFilters.currencies.length} 
                          size="small" 
                          color="primary"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                    {loadingOptions ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <FormGroup>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                            gap: 0.5,
                          }}
                        >
                          {currencies.map((currency) => (
                            <FormControlLabel
                              key={currency}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={localFilters.currencies?.includes(currency) || false}
                                  onChange={() => toggleArrayValue('currencies', currency)}
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                                  {currency}
                                </Typography>
                              }
                            />
                          ))}
                        </Box>
                      </FormGroup>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApply}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Apply Filters'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={loading || activeFilterCount === 0}
                  sx={{ textTransform: 'none', minWidth: 80 }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Collapse>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && !expanded && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1,
            bgcolor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {(() => {
              const activePreset = getActivePreset();
              
              if (activePreset) {
                // Show preset label when filters match a preset
                return (
                  <Chip
                    label={activePreset.label}
                    size="small"
                    onDelete={() => handleReset()}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: 'primary.contrastText',
                      },
                    }}
                  />
                );
              }
              
              // Show individual date chips for custom date ranges
              return (
                <>
                  {localFilters.startDate && (
                    <Chip
                      label={`From: ${localFilters.startDate.toLocaleDateString()}`}
                      size="small"
                      onDelete={() => handleFilterChange('startDate', null)}
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    />
                  )}
                  {localFilters.endDate && (
                    <Chip
                      label={`To: ${localFilters.endDate.toLocaleDateString()}`}
                      size="small"
                      onDelete={() => handleFilterChange('endDate', null)}
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    />
                  )}
                </>
              );
            })()}
            {localFilters.impacts?.map((impact) => {
              const impactLabel = IMPACT_LEVELS.find(i => i.value === impact)?.label || impact;
              return (
                <Chip
                  key={impact}
                  label={impactLabel}
                  size="small"
                  onDelete={() => toggleArrayValue('impacts', impact)}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              );
            })}
            {localFilters.eventTypes?.slice(0, 2).map((type) => (
              <Chip
                key={type}
                label={type}
                size="small"
                onDelete={() => toggleArrayValue('eventTypes', type)}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            ))}
            {localFilters.eventTypes?.length > 2 && (
              <Chip
                label={`+${localFilters.eventTypes.length - 2} more`}
                size="small"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            )}
            {localFilters.currencies?.slice(0, 3).map((currency) => (
              <Chip
                key={currency}
                label={currency}
                size="small"
                onDelete={() => toggleArrayValue('currencies', currency)}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            ))}
            {localFilters.currencies?.length > 3 && (
              <Chip
                label={`+${localFilters.currencies.length - 3} more`}
                size="small"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
