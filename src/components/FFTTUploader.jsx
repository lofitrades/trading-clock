/**
* src/components/FFTTUploader.jsx
* 
* Purpose: Superadmin-only uploader for GPT-generated FF-T2T economic events.
* Handles JSON validation, event matching/deduplication, and Firestore canonical ingest via Cloud Functions.
* Includes responsive preview table with matching results, expandable source comparison, and pagination.
* 
* Changelog:
* v1.6.0 - 2026-01-24 - BEP: Phase 3c i18n migration - Added useTranslation hook (admin, form, validation, states, notifications).
*                       Replaced 45+ hardcoded strings (filters, buttons, status chips, error messages, tooltips) with t() calls.
* v1.5.0 - 2026-01-21 - Added sortable columns for events preview table.
* v1.4.1 - 2026-01-21 - Added PropTypes validation for uploader subcomponents.
* v1.4.0 - 2026-01-21 - Added expandable matched event details with source field comparison.
*                       Shows incoming vs existing field values with diff highlighting (mismatches only).
*                       Displays source availability (NFS, JBlanked, GPT) with field tooltips.
* v1.3.0 - 2026-01-21 - Added event matching/deduplication detection with UI indicators (New vs Matched).
*                       Shows match results in preview table before upload (enterprise UI with badges).
* v1.2.0 - 2026-01-21 - Added drag-and-drop MUI drop zone uploader with visual feedback.
* v1.1.0 - 2026-01-21 - Added responsive events table with filters and pagination.
* v1.0.0 - 2026-01-16 - Initial implementation with RBAC gating and batch uploader.
*/

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Collapse,
    Divider,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { UploadFile as UploadFileIcon, Clear as ClearIcon, CloudUpload as CloudUploadIcon, NewReleases as NewReleasesIcon, MergeType as MergeTypeIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '../firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const MAX_BATCH_SIZE = 200;

const normalizePayload = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.events)) return payload.events;
    return null;
};

const validateEvent = (event) => {
    const errors = [];
    if (!event || typeof event !== 'object') {
        return ['Invalid event object'];
    }
    if (!event.name || typeof event.name !== 'string') {
        errors.push('Missing event.name');
    }
    if (!event.datetimeUtc || typeof event.datetimeUtc !== 'string') {
        errors.push('Missing event.datetimeUtc');
    }
    return errors;
};

const chunkArray = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

const getEventFields = (events) => {
    const columnsToHide = ['eventId', 'eventID', 'source', 'sources', 'category'];
    const fieldsSet = new Set();
    events.forEach((evt) => {
        if (evt && typeof evt === 'object') {
            Object.keys(evt).forEach((key) => {
                if (!columnsToHide.includes(key)) {
                    fieldsSet.add(key);
                }
            });
        }
    });
    return Array.from(fieldsSet).sort();
};

// Normalize event name for matching (same logic as backend)
const normalizeEventName = (raw = '') => {
    if (!raw) return '';
    return raw
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[™®©]/g, '')
        .replace(/\s*-\s*/g, ' ');
};

// Compute string similarity using Jaccard index (same logic as backend)
const computeStringSimilarity = (a = '', b = '') => {
    const normalizedA = normalizeEventName(a);
    const normalizedB = normalizeEventName(b);
    const tokensA = new Set(normalizedA.split(/\s+/).filter(Boolean));
    const tokensB = new Set(normalizedB.split(/\s+/).filter(Boolean));
    const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
    const union = new Set([...tokensA, ...tokensB]).size;
    return union === 0 ? 0 : intersection / union;
};

// Find existing canonical event match (client-side approximation)
const findExistingEventMatch = async (incomingEvent) => {
    const { name, currency, datetimeUtc } = incomingEvent;
    if (!currency || !datetimeUtc) return null;
    try {
        const windowMinutes = 5;
        const similarityThreshold = 0.8;
        const eventDate = new Date(datetimeUtc);
        const startDate = new Date(eventDate.getTime() - windowMinutes * 60 * 1000);
        const endDate = new Date(eventDate.getTime() + windowMinutes * 60 * 1000);
        const eventsCollection = collection(db, 'economicEvents', 'events', 'events');
        const q = query(
            eventsCollection,
            where('currency', '==', currency.toUpperCase()),
            where('datetimeUtc', '>=', Timestamp.fromDate(startDate)),
            where('datetimeUtc', '<=', Timestamp.fromDate(endDate))
        );
        const snapshot = await getDocs(q);
        let bestMatch = null;
        let bestScore = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            const score = computeStringSimilarity(data.name, name);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = { docId: doc.id, event: data, score };
            }
        });
        if (bestMatch && bestScore >= similarityThreshold) {
            return bestMatch;
        }
    } catch (err) {
        console.warn('Event matching error:', err);
    }
    return null;
};

// Fetch full matched event details (including sources)
const fetchMatchedEventDetails = async (docId) => {
    try {
        const eventDocPath = doc(db, 'economicEvents', 'events', 'events', docId);
        const docSnap = await getDoc(eventDocPath);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (err) {
        console.warn('Error fetching matched event details:', err);
    }
    return null;
};

// Compare incoming event with matched event and identify differences
const compareEventFields = (incomingEvent, matchedEvent) => {
    const differences = {};
    const allKeys = new Set([
        ...Object.keys(incomingEvent || {}),
        ...Object.keys(matchedEvent || {}),
    ]);

    allKeys.forEach((key) => {
        const incomingVal = JSON.stringify(incomingEvent?.[key]);
        const matchedVal = JSON.stringify(matchedEvent?.[key]);
        if (incomingVal !== matchedVal) {
            differences[key] = {
                incoming: incomingEvent?.[key],
                matched: matchedEvent?.[key],
                isDifferent: true,
            };
        }
    });

    return differences;
};

const DropZoneUploader = ({ selectedFile, onFileSelect, uploading }) => {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploading) {
            setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (uploading) return;

        const files = e.dataTransfer?.files || [];
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                onFileSelect({ target: { files: [file] } });
            }
        }
    };

    return (
        <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 1.5,
                p: { xs: 1.5, sm: 2 },
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease-in-out',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                '&:hover': uploading ? {} : {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                },
                opacity: uploading ? 0.6 : 1,
            }}
        >
            <Stack spacing={1} alignItems="center">
                <CloudUploadIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: isDragActive ? 'primary.main' : 'text.secondary' }} />
                <Box>
                    <Typography variant="body2" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                        {selectedFile ? selectedFile.name : t('admin:dropJsonFile')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                        {t('admin:orClickToBrowse')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    component="label"
                    disabled={uploading}
                    size="small"
                    sx={{ mt: 0.5, textTransform: 'none', fontWeight: 700 }}
                >
                    {t('actions:browse')}
                    <input hidden type="file" accept="application/json" onChange={onFileSelect} />
                </Button>
                {selectedFile && (
                    <Chip
                        icon={<UploadFileIcon />}
                        label={`${t('admin:ready')}: ${selectedFile.name}`}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ mt: 0.5 }}
                    />
                )}
            </Stack>
        </Box>
    );
};

DropZoneUploader.propTypes = {
    selectedFile: PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
    }),
    onFileSelect: PropTypes.func.isRequired,
    uploading: PropTypes.bool.isRequired,
};

DropZoneUploader.defaultProps = {
    selectedFile: null,
};

// Order fields with priority columns first, then remaining fields alphabetically
const orderTableFields = (fieldsArray) => {
    const columnsToHide = ['eventID', 'source', 'category'];
    const priorityOrder = ['currency', 'name', 'datetimeUtc', 'impact'];
    const filteredFields = fieldsArray.filter((f) => !columnsToHide.includes(f));
    const priorityFields = priorityOrder.filter((f) => filteredFields.includes(f));
    const remainingFields = filteredFields
        .filter((f) => !priorityOrder.includes(f))
        .sort();
    return [...priorityFields, ...remainingFields];
};

const EventsPreviewTable = ({ events, fields, selectedIndices, onSelectionChange, matchingResults = {} }) => {
    const { t } = useTranslation(['admin', 'actions', 'states']);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [sortField, setSortField] = useState('datetimeUtc');
    const [sortDirection, setSortDirection] = useState('desc');
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [expandedDetails, setExpandedDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});

    const orderedFields = useMemo(() => orderTableFields(fields), [fields]);

    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            const nameMatch = (evt.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            if (!nameMatch) return false;

            if (dateFromFilter || dateToFilter) {
                const eventDate = new Date(evt.datetimeUtc || '').toISOString().split('T')[0];
                if (dateFromFilter && eventDate < dateFromFilter) return false;
                if (dateToFilter && eventDate > dateToFilter) return false;
            }

            return true;
        });
    }, [events, searchQuery, dateFromFilter, dateToFilter]);

    const sortedEvents = useMemo(() => {
        const normalizeValue = (value) => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') return value;
            if (typeof value === 'string') return value.toLowerCase();
            if (value instanceof Date) return value.getTime();
            return JSON.stringify(value).toLowerCase();
        };

        const sorted = [...filteredEvents].sort((a, b) => {
            const aVal = normalizeValue(a?.[sortField]);
            const bVal = normalizeValue(b?.[sortField]);

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredEvents, sortField, sortDirection]);

    const paginatedEvents = useMemo(
        () => sortedEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [sortedEvents, page, rowsPerPage]
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setPage(0);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setDateFromFilter('');
        setDateToFilter('');
        setPage(0);
    };

    const handleSelectRow = (eventIndex) => {
        if (selectedIndices.includes(eventIndex)) {
            onSelectionChange(selectedIndices.filter((idx) => idx !== eventIndex));
        } else {
            onSelectionChange([...selectedIndices, eventIndex]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIndices.length === events.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(events.map((_, idx) => idx));
        }
    };

    const handleToggleExpanded = async (actualEventIndex, matchResult) => {
        if (!matchResult || matchResult.status !== 'matched') return;

        const eventKey = `${actualEventIndex}-${matchResult.matchedEventId}`;
        if (expandedEventId === eventKey) {
            setExpandedEventId(null);
            return;
        }

        // If already loaded, just expand
        if (expandedDetails[eventKey]) {
            setExpandedEventId(eventKey);
            return;
        }

        // Fetch matched event details
        setLoadingDetails((prev) => ({ ...prev, [eventKey]: true }));
        try {
            const matchedEventData = await fetchMatchedEventDetails(matchResult.matchedEventId);
            if (matchedEventData) {
                const incomingEvent = events[actualEventIndex];
                const differences = compareEventFields(incomingEvent, matchedEventData);
                setExpandedDetails((prev) => ({
                    ...prev,
                    [eventKey]: {
                        matched: matchedEventData,
                        differences,
                    },
                }));
                setExpandedEventId(eventKey);
            }
        } catch (err) {
            console.error('Error loading matched event details:', err);
        } finally {
            setLoadingDetails((prev) => ({ ...prev, [eventKey]: false }));
        }
    };

    const formatCellValue = (value) => {
        if (typeof value === 'object') {
            return JSON.stringify(value).substring(0, 50);
        }
        if (typeof value === 'string') {
            return value.substring(0, 100);
        }
        return String(value);
    };

    return (
        <Stack spacing={2}>
            {/* Filters */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                <TextField
                    label={t('admin:searchByName')}
                    size="small"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                    }}
                    placeholder={t('admin:filterEvents')}
                    fullWidth
                />
                <TextField
                    label={t('admin:dateFrom')}
                    type="date"
                    size="small"
                    value={dateFromFilter}
                    onChange={(e) => {
                        setDateFromFilter(e.target.value);
                        setPage(0);
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />
                <TextField
                    label={t('admin:dateTo')}
                    type="date"
                    size="small"
                    value={dateToFilter}
                    onChange={(e) => {
                        setDateToFilter(e.target.value);
                        setPage(0);
                    }}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                    {t('actions:reset')}
                </Button>
            </Box>

            {/* Results count and selection info */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {t('admin:showing')} {Math.min(paginatedEvents.length, rowsPerPage)} {t('admin:of')} {filteredEvents.length} {t('admin:events')}
                </Typography>
                <Chip
                    label={`${selectedIndices.length} ${t('admin:selected')}`}
                    size="small"
                    color={selectedIndices.length > 0 ? 'primary' : 'default'}
                    variant={selectedIndices.length > 0 ? 'filled' : 'outlined'}
                />
            </Box>

            {/* Mobile-first responsive table with fixed column widths */}
            <Box sx={{ overflowX: { xs: 'auto', md: 'visible' }, width: '100%' }}>
                <TableContainer sx={{ width: '100%' }}>
                    <Table size="small" stickyHeader sx={{ backgroundColor: '#fff', width: '100%' }}>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                <TableCell
                                    padding="checkbox"
                                    sx={{
                                        width: 48,
                                        minWidth: 48,
                                        maxWidth: 48,
                                        p: 1,
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        backgroundColor: 'action.hover',
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={selectedIndices.length > 0 && selectedIndices.length < events.length}
                                        checked={selectedIndices.length === events.length && events.length > 0}
                                        onChange={handleSelectAll}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 800,
                                        width: { xs: 50, sm: 70 },
                                        minWidth: { xs: 50, sm: 70 },
                                        maxWidth: { xs: 50, sm: 70 },
                                        p: 1,
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    }}
                                >
                                    #
                                </TableCell>
                                <TableCell
                                    sx={{
                                        fontWeight: 800,
                                        width: { xs: 90, sm: 120 },
                                        minWidth: { xs: 90, sm: 120 },
                                        maxWidth: { xs: 90, sm: 120 },
                                        p: 1,
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    }}
                                >
                                    Status
                                </TableCell>
                                {orderedFields.map((field) => {
                                    let colWidth = { xs: 100, sm: 120, md: 140 };
                                    if (field === 'name') colWidth = { xs: 120, sm: 160, md: 200 };
                                    if (field === 'datetimeUtc') colWidth = { xs: 110, sm: 150, md: 180 };
                                    if (field === 'currency') colWidth = { xs: 80, sm: 100, md: 120 };
                                    if (field === 'impact') colWidth = { xs: 80, sm: 100, md: 120 };

                                    return (
                                        <TableCell
                                            key={field}
                                            sx={{
                                                fontWeight: 800,
                                                width: colWidth,
                                                minWidth: colWidth,
                                                maxWidth: colWidth,
                                                p: 1,
                                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                            title={field}
                                        >
                                            <TableSortLabel
                                                active={sortField === field}
                                                direction={sortField === field ? sortDirection : 'asc'}
                                                onClick={() => handleSort(field)}
                                                sx={{ fontWeight: 800 }}
                                            >
                                                {field}
                                            </TableSortLabel>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedEvents.length > 0 ? (
                                paginatedEvents.map((evt, idx) => {
                                    const actualEventIndex = events.indexOf(evt);
                                    const isSelected = selectedIndices.includes(actualEventIndex);
                                    const matchResult = matchingResults?.[actualEventIndex];
                                    const isNew = matchResult?.status === 'new';
                                    const isMatched = matchResult?.status === 'matched';
                                    const eventKey = `${actualEventIndex}-${matchResult?.matchedEventId}`;
                                    const isExpanded = expandedEventId === eventKey;
                                    const rowBgColor = isMatched ? 'rgba(255, 152, 0, 0.08)' : isNew ? 'rgba(76, 175, 80, 0.08)' : 'inherit';
                                    const detailsData = expandedDetails[eventKey];
                                    const isLoading = loadingDetails[eventKey];

                                    return [
                                        <TableRow
                                            key={`row-${actualEventIndex}`}
                                            hover
                                            selected={isSelected}
                                            sx={{
                                                '&:last-child td': { border: 0 },
                                                cursor: isMatched ? 'pointer' : 'default',
                                                backgroundColor: rowBgColor,
                                            }}
                                        >
                                            <TableCell
                                                padding="checkbox"
                                                sx={{
                                                    width: 48,
                                                    minWidth: 48,
                                                    maxWidth: 48,
                                                    p: 1,
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 8,
                                                    backgroundColor: rowBgColor,
                                                }}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(actualEventIndex)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 700,
                                                    width: { xs: 50, sm: 70 },
                                                    minWidth: { xs: 50, sm: 70 },
                                                    maxWidth: { xs: 50, sm: 70 },
                                                    p: 1,
                                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {page * rowsPerPage + idx + 1}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                    width: { xs: 90, sm: 120 },
                                                    minWidth: { xs: 90, sm: 120 },
                                                    maxWidth: { xs: 90, sm: 120 },
                                                    p: 1,
                                                }}
                                            >
                                                {isNew ? (
                                                    <Tooltip title={t('admin:newEventTooltip')}>
                                                        <Chip
                                                            icon={<NewReleasesIcon />}
                                                            label={t('admin:new')}
                                                            color="success"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                    </Tooltip>
                                                ) : isMatched ? (
                                                    <Tooltip title={`${t('admin:clickToCompare')} • ${matchResult.matchedEventName || 'Unknown'} (${matchResult.similarity?.toFixed(2) || 'N/A'}% ${t('admin:similar')})`}>
                                                        <Box
                                                            onClick={() => handleToggleExpanded(actualEventIndex, matchResult)}
                                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                                                        >
                                                            <Chip
                                                                icon={<MergeTypeIcon />}
                                                                label={t('admin:matched')}
                                                                color="warning"
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                        </Box>
                                                    </Tooltip>
                                                ) : (
                                                    <Chip label={t('admin:checking')} size="small" sx={{ fontWeight: 700 }} />
                                                )}
                                            </TableCell>
                                            {orderedFields.map((field) => {
                                                let colWidth = { xs: 100, sm: 120, md: 140 };
                                                if (field === 'name') colWidth = { xs: 120, sm: 160, md: 200 };
                                                if (field === 'datetimeUtc') colWidth = { xs: 110, sm: 150, md: 180 };
                                                if (field === 'currency') colWidth = { xs: 80, sm: 100, md: 120 };
                                                if (field === 'impact') colWidth = { xs: 80, sm: 100, md: 120 };

                                                return (
                                                    <TableCell
                                                        key={`${idx}-${field}`}
                                                        sx={{
                                                            fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                            width: colWidth,
                                                            minWidth: colWidth,
                                                            maxWidth: colWidth,
                                                            p: 1,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        title={String(evt[field] || '')}
                                                    >
                                                        {formatCellValue(evt[field] || '')}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>,
                                        isMatched && (
                                            <TableRow key={`details-${actualEventIndex}`} sx={{ backgroundColor: isExpanded ? 'rgba(255, 152, 0, 0.05)' : 'inherit' }}>
                                                <TableCell colSpan={orderedFields.length + 3} sx={{ py: 0, px: 1, width: '100%' }}>
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Stack spacing={2} sx={{ py: 2 }}>
                                                            {isLoading ? (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {t('states:loadingMatchedEventDetails')}
                                                                </Typography>
                                                            ) : detailsData ? (
                                                                <>
                                                                    <Box>
                                                                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                                                                            {t('admin:matchedEvent')}: {detailsData.matched?.name || 'Unknown'}
                                                                        </Typography>
                                                                        {detailsData.matched?.sources && (
                                                                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                                                                                {Object.entries(detailsData.matched.sources).map(([source, available]) => (
                                                                                    <Chip
                                                                                        key={source}
                                                                                        label={source.toUpperCase()}
                                                                                        size="small"
                                                                                        variant={available ? 'filled' : 'outlined'}
                                                                                        color={available ? 'success' : 'default'}
                                                                                        sx={{ fontWeight: 700 }}
                                                                                    />
                                                                                ))}
                                                                            </Stack>
                                                                        )}
                                                                    </Box>

                                                                    {Object.keys(detailsData.differences || {}).length > 0 ? (
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight={800} gutterBottom>
                                                                                {t('admin:fieldDifferences')}:
                                                                            </Typography>
                                                                            <Stack spacing={1}>
                                                                                {Object.entries(detailsData.differences).map(([field, comparison]) => (
                                                                                    <Box
                                                                                        key={field}
                                                                                        sx={{
                                                                                            p: 1,
                                                                                            backgroundColor: 'background.default',
                                                                                            border: '1px solid',
                                                                                            borderColor: 'divider',
                                                                                            borderRadius: 1,
                                                                                        }}
                                                                                    >
                                                                                        <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                                                                                            {field}
                                                                                        </Typography>
                                                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                                                                            <Box sx={{ p: 0.75, backgroundColor: 'rgba(76, 175, 80, 0.15)', borderRadius: 0.5 }}>
                                                                                                <Typography variant="caption" fontWeight={700} color="success.dark" display="block">
                                                                                                    {t('admin:newValue')}:
                                                                                                </Typography>
                                                                                                <Typography variant="caption" sx={{ wordBreak: 'break-word', fontSize: '0.7rem' }}>
                                                                                                    {JSON.stringify(comparison.incoming, null, 2)}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                            <Box sx={{ p: 0.75, backgroundColor: 'rgba(255, 152, 0, 0.15)', borderRadius: 0.5 }}>
                                                                                                <Typography variant="caption" fontWeight={700} color="warning.dark" display="block">
                                                                                                    {t('admin:existingValue')}:
                                                                                                </Typography>
                                                                                                <Typography variant="caption" sx={{ wordBreak: 'break-word', fontSize: '0.7rem' }}>
                                                                                                    {JSON.stringify(comparison.matched, null, 2)}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Box>
                                                                                    </Box>
                                                                                ))}
                                                                            </Stack>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ p: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                                                                            <Typography variant="caption" color="success.dark" fontWeight={700}>
                                                                                ✓ {t('admin:noFieldDifferences')}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <Typography variant="body2" color="error">
                                                                    {t('admin:failedToLoadMatchedEventDetails')}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    ].filter(Boolean);
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={fields.length + 3} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('admin:noEventsMatchFilters')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredEvents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ backgroundColor: 'action.hover', borderRadius: 1 }}
            />
        </Stack>
    );
};

EventsPreviewTable.propTypes = {
    events: PropTypes.arrayOf(PropTypes.object).isRequired,
    fields: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedIndices: PropTypes.arrayOf(PropTypes.number).isRequired,
    onSelectionChange: PropTypes.func.isRequired,
    matchingResults: PropTypes.object,
};

EventsPreviewTable.defaultProps = {
    matchingResults: {},
};

export default function FFTTUploader() {
    const { t } = useTranslation(['admin', 'form', 'validation', 'actions', 'states', 'notifications']);
    const { userProfile, loading } = useAuth();
    const isSuperadmin = useMemo(() => userProfile?.role === 'superadmin', [userProfile?.role]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validatedEvents, setValidatedEvents] = useState([]);
    const [selectedEventIndices, setSelectedEventIndices] = useState([]);
    const [matchingResults, setMatchingResults] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        setValidatedEvents([]);
        setSelectedEventIndices([]);
        setValidationErrors([]);
        setMatchingResults({});
        setError(null);
        setResult(null);
        setProgress(0);
    };

    const handleClear = () => {
        setSelectedFile(null);
        setValidatedEvents([]);
        setSelectedEventIndices([]);
        setValidationErrors([]);
        setMatchingResults({});
        setError(null);
        setResult(null);
        setProgress(0);
    };

    const handleValidate = async () => {
        if (!selectedFile) {
            setError(t('validation:selectFileFirst'));
            return;
        }

        try {
            const fileContent = await selectedFile.text();
            const parsed = JSON.parse(fileContent);
            const events = normalizePayload(parsed);

            if (!events) {
                throw new Error(t('validation:jsonMustBeArrayOrEvents'));
            }

            const issues = [];
            const validEvents = [];
            events.forEach((evt, index) => {
                const errs = validateEvent(evt);
                if (errs.length > 0) {
                    issues.push({ index, errors: errs, name: evt?.name || 'Unknown' });
                } else {
                    validEvents.push(evt);
                }
            });

            setValidationErrors(issues);
            setValidatedEvents(validEvents);
            setSelectedEventIndices([]);
            setMatchingResults({});

            // Perform event matching for validated events
            const matchResults = {};
            let newCount = 0;
            let matchedCount = 0;

            for (let i = 0; i < validEvents.length; i++) {
                try {
                    const match = await findExistingEventMatch(validEvents[i]);
                    if (match) {
                        matchedCount++;
                        matchResults[i] = {
                            status: 'matched',
                            matchedEventId: match.docId,
                            matchedEventName: match.event.name,
                            similarity: match.score,
                        };
                    } else {
                        newCount++;
                        matchResults[i] = {
                            status: 'new',
                        };
                    }
                } catch (matchErr) {
                    console.warn(`Matching error for event ${i}:`, matchErr);
                    matchResults[i] = {
                        status: 'new',
                    };
                    newCount++;
                }
            }

            setMatchingResults(matchResults);

            if (issues.length === 0) {
                setResult({
                    type: 'success',
                    message: t('admin:validatedEventsReady', { count: events.length, newCount, matchedCount }),
                });
            } else {
                setResult({
                    type: 'warning',
                    message: t('admin:validatedWithErrors', { errorCount: issues.length, validCount: validEvents.length, newCount, matchedCount }),
                });
            }
        } catch (err) {
            setError(err.message || t('validation:failedToValidateJson'));
            setValidatedEvents([]);
            setSelectedEventIndices([]);
            setMatchingResults({});
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError(t('validation:selectFileFirst'));
            return;
        }

        if (selectedEventIndices.length === 0) {
            setError(t('validation:selectAtLeastOneEvent'));
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const fileContent = await selectedFile.text();
            const parsed = JSON.parse(fileContent);
            const events = normalizePayload(parsed);

            if (!events) {
                throw new Error('JSON must be an array or { "events": [] }.');
            }

            const issues = [];
            const validEvents = [];
            events.forEach((evt, index) => {
                const errs = validateEvent(evt);
                if (errs.length > 0) {
                    issues.push({ index, errors: errs, name: evt?.name || 'Unknown' });
                } else {
                    validEvents.push(evt);
                }
            });

            if (issues.length > 0) {
                setValidationErrors(issues);
                throw new Error(t('validation:eventsHaveValidationErrors'));
            }

            const selectedEventsToUpload = selectedEventIndices.map((idx) => validEvents[idx]);

            const batches = chunkArray(selectedEventsToUpload, MAX_BATCH_SIZE);
            const uploadGptEvents = httpsCallable(functions, 'uploadGptEvents');

            let created = 0;
            let merged = 0;
            let skipped = 0;
            let errors = 0;

            for (let i = 0; i < batches.length; i += 1) {
                const batch = batches[i];
                const response = await uploadGptEvents({ events: batch });
                const data = response?.data || {};
                created += data.created || 0;
                merged += data.merged || 0;
                skipped += data.skipped || 0;
                errors += data.errors || 0;
                setProgress(Math.round(((i + 1) / batches.length) * 100));
            }

            setResult({
                type: 'success',
                message: t('admin:uploadComplete', { created, merged, skipped, errors }),
            });
            setValidatedEvents([]);
            setSelectedEventIndices([]);
        } catch (err) {
            setError(err.message || t('admin:uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>{t('states:loading')}</Typography>
            </Box>
        );
    }

    if (!isSuperadmin) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Card sx={{ maxWidth: 520, width: '100%' }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} gutterBottom>
                            FF-T2T Uploader
                        </Typography>
                        <Alert severity="error">{t('admin:superadminAccessRequired')}</Alert>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: { xs: 2, md: 4 }, py: 4 }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} gutterBottom>
                            FF-T2T Uploader
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {t('admin:uploadGptGeneratedDescription')}
                        </Typography>
                    </Box>

                    {/* File Selection Card */}
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <DropZoneUploader selectedFile={selectedFile} onFileSelect={handleFileSelect} uploading={uploading} />

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        onClick={handleValidate}
                                        disabled={!selectedFile || uploading}
                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                        {t('admin:validateJson')}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading || selectedEventIndices.length === 0}
                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                        {t('admin:upload')} ({selectedEventIndices.length})
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleClear}
                                        disabled={!selectedFile && validatedEvents.length === 0}
                                        sx={{ textTransform: 'none', fontWeight: 700 }}
                                    >
                                        {t('admin:clearAll')}
                                    </Button>
                                </Stack>

                                {uploading && <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />}

                                {error && <Alert severity="error">{error}</Alert>}
                                {result && <Alert severity={result.type}>{result.message}</Alert>}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <Card sx={{ borderLeft: `4px solid error.main` }}>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Typography variant="subtitle2" fontWeight={800} color="error">
                                        {t('admin:validationIssues', { count: validationErrors.length })}
                                    </Typography>
                                    <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                                        <Stack spacing={1}>
                                            {validationErrors.slice(0, 8).map((issue) => (
                                                <Box key={`${issue.index}-${issue.name}`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                                        #{issue.index + 1} {issue.name}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                                        {issue.errors.map((err) => (
                                                            <Chip key={`${issue.index}-${err}`} label={err} size="small" color="warning" />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            ))}
                                            {validationErrors.length > 8 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{validationErrors.length - 8} {t('admin:moreIssues')}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* Events Preview Table */}
                    {validatedEvents.length > 0 && (
                        <Card>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                                            {t('admin:validatedEventsPreview')}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {validatedEvents.length} {t('admin:validEvents')} • {selectedEventIndices.length} {t('admin:selectedForUpload')}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <EventsPreviewTable
                                        events={validatedEvents}
                                        fields={getEventFields(validatedEvents)}
                                        selectedIndices={selectedEventIndices}
                                        onSelectionChange={setSelectedEventIndices}
                                        matchingResults={matchingResults}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}
