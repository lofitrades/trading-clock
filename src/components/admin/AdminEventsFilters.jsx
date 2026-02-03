/**
 * src/components/admin/AdminEventsFilters.jsx
 * 
 * Purpose: Filter controls for admin event management page
 * Provides date range, currency, impact, source, and search filters
 * 
 * Changelog:
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP responsive design
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Box,
    Card,
    TextField,
    MenuItem,
    Button,
    Typography,
    Alert,
    Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { differenceInDays, format } from 'date-fns';

const MAX_DATE_RANGE_DAYS = 90;

const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];
const IMPACTS = ['ALL', 'high', 'medium', 'low'];
const SOURCES = ['ALL', 'nfs', 'jblanked', 'gpt', 'manual'];

const AdminEventsFilters = ({ onFilter }) => {
    const { t } = useTranslation('admin');

    // Initialize with today's date in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd');

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [currency, setCurrency] = useState('ALL');
    const [impact, setImpact] = useState('ALL');
    const [source, setSource] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [validationError, setValidationError] = useState('');

    // Validate date range
    const validateDateRange = useCallback((start, end) => {
        if (!start || !end) {
            return t('events.notifications.dateRangeRequired');
        }

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);

        if (endDateObj < startDateObj) {
            return t('events.notifications.invalidDateRange');
        }

        const daysDiff = differenceInDays(endDateObj, startDateObj);
        if (daysDiff > MAX_DATE_RANGE_DAYS) {
            return t('events.filters.maxDateRange');
        }

        return '';
    }, [t]);

    // Handle filter submission
    const handleSubmit = useCallback(() => {
        const error = validateDateRange(startDate, endDate);

        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError('');

        // Format dates for Firestore query
        const filters = {
            startDate,
            endDate,
            currency: currency === 'ALL' ? null : currency,
            impact: impact === 'ALL' ? null : impact,
            source: source === 'ALL' ? null : source,
            searchQuery: searchQuery.trim() || null,
        };

        onFilter(filters);
    }, [startDate, endDate, currency, impact, source, searchQuery, validateDateRange, onFilter]);

    // Handle clear filters
    const handleClear = useCallback(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        setStartDate(today);
        setEndDate(today);
        setCurrency('ALL');
        setImpact('ALL');
        setSource('ALL');
        setSearchQuery('');
        setValidationError('');
    }, []);

    // Handle Enter key in search field
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <Card sx={{ mb: 3, p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {t('events.filters.heading')}
            </Typography>

            {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationError}
                </Alert>
            )}

            <Stack spacing={2}>
                {/* Date Range Row */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        type="date"
                        size="small"
                        label={t('events.filters.startDate')}
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setValidationError('');
                        }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}
                    />

                    <TextField
                        type="date"
                        size="small"
                        label={t('events.filters.endDate')}
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setValidationError('');
                        }}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}
                    />

                    {/* Currency Filter */}
                    <TextField
                        select
                        size="small"
                        label={t('events.filters.currency')}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(16.66% - 13.33px)' } }}
                    >
                        <MenuItem value="ALL">{t('events.filters.allCurrencies')}</MenuItem>
                        {CURRENCIES.filter(c => c !== 'ALL').map((curr) => (
                            <MenuItem key={curr} value={curr}>
                                {curr}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Impact Filter */}
                    <TextField
                        select
                        size="small"
                        label={t('events.filters.impact')}
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(16.66% - 13.33px)' } }}
                    >
                        <MenuItem value="ALL">{t('events.filters.allImpacts')}</MenuItem>
                        {IMPACTS.filter(i => i !== 'ALL').map((imp) => (
                            <MenuItem key={imp} value={imp}>
                                {t(`events.impacts.${imp}`)}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Source Filter */}
                    <TextField
                        select
                        size="small"
                        label={t('events.filters.source')}
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(16.66% - 13.33px)' } }}
                    >
                        <MenuItem value="ALL">{t('events.filters.allSources')}</MenuItem>
                        {SOURCES.filter(s => s !== 'ALL').map((src) => (
                            <MenuItem key={src} value={src}>
                                {t(`events.sources.${src}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Search and Actions Row */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search Field */}
                    <TextField
                        size="small"
                        label={t('events.filters.search')}
                        placeholder={t('events.filters.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}
                    />

                    {/* Action Buttons */}
                    <Box sx={{
                        display: 'flex',
                        gap: 1,
                        flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' },
                        justifyContent: { xs: 'stretch', md: 'flex-end' }
                    }}>
                        <Button
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={handleClear}
                            sx={{ flex: { xs: 1, md: '0 0 auto' }, minWidth: { md: 180 } }}
                        >
                            {t('events.filters.clearFilters')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSubmit}
                            sx={{ flex: { xs: 1, md: '0 0 auto' }, minWidth: { md: 180 } }}
                        >
                            {t('events.filters.goButton')}
                        </Button>
                    </Box>
                </Box>
            </Stack>
        </Card>
    );
};

AdminEventsFilters.propTypes = {
    onFilter: PropTypes.func.isRequired,
};

export default AdminEventsFilters;
