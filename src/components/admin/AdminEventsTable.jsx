/**
 * src/components/admin/AdminEventsTable.jsx
 * 
 * Purpose: MUI DataGrid table with inline editing for admin event management
 * Supports double-click cell editing for ALL fields, changelog viewing, timezone awareness
 * BEP: Events displayed in admin's timezone. System converts to UTC on save.
 * 
 * Changelog:
 * v2.4.0 - 2026-02-02 - Fixed changelog dialog: safe timestamp/value formatting to prevent render errors with Firestore objects
 * v2.3.0 - 2026-02-02 - Fixed impact chip: normalized values, correct i18n keys (highImpact, mediumImpact, etc.), proper colors
 * v2.2.0 - 2026-02-02 - BEP TIMEZONE: Display dates/times in admin's timezone. Removed (UTC) labels.
 * v2.1.0 - 2026-02-02 - BEP: UTC date handling, timezone prop, improved date valueSetter
 * v2.0.0 - 2026-02-02 - BEP: All columns now editable. Added processRowUpdate for inline editing.
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP responsive design
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Box,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import HistoryIcon from '@mui/icons-material/History';
import { format, parseISO } from 'date-fns';

const AdminEventsTable = ({
    events = [],
    loading = false,
    onEventUpdate,
    timezone = 'America/New_York', // Admin's timezone for display
}) => {
    const { t } = useTranslation('admin');

    const [changelogDialogOpen, setChangelogDialogOpen] = useState(false);
    const [selectedChangelog, setSelectedChangelog] = useState([]);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 50,
    });

    // Process row update with changelog tracking
    const processRowUpdate = useCallback(async (newRow, oldRow) => {
        // Find what changed
        const changedFields = {};
        Object.keys(newRow).forEach(key => {
            if (newRow[key] !== oldRow[key] && key !== 'id') {
                changedFields[key] = newRow[key];
            }
        });

        if (Object.keys(changedFields).length === 0) {
            return oldRow; // No changes
        }

        try {
            await onEventUpdate(newRow.id, changedFields, 'Inline edit', oldRow);
            return newRow;
        } catch (error) {
            console.error('Failed to update event:', error);
            return oldRow; // Revert on error
        }
    }, [onEventUpdate]);

    const handleProcessRowUpdateError = useCallback((error) => {
        console.error('Row update error:', error);
    }, []);

    // Handle view changelog
    const handleViewChangelog = useCallback((event) => {
        setSelectedChangelog(event.changelog || []);
        setChangelogDialogOpen(true);
    }, []);

    // Get primary source
    const getPrimarySource = useCallback((sources) => {
        if (!sources) return 'unknown';
        const priority = ['manual', 'nfs', 'jblanked', 'gpt'];
        for (const src of priority) {
            if (sources[src]) return src;
        }
        return 'unknown';
    }, []);

    // Define columns for DataGrid - ALL EDITABLE
    // Dates/times shown in admin's timezone (conversion happens in service layer)
    const columns = useMemo(() => [
        {
            field: 'date',
            headerName: t('events.table.columns.date'),
            width: 130,
            editable: true,
            type: 'date',
            valueGetter: (value) => {
                try {
                    // Value is already in admin's timezone (converted by service)
                    return value ? new Date(value + 'T12:00:00') : null;
                } catch {
                    return null;
                }
            },
            valueSetter: (value, row) => {
                if (!value) return row;
                // Store as YYYY-MM-DD (in admin's timezone)
                const d = new Date(value);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return { ...row, date: `${yyyy}-${mm}-${dd}` };
            },
            valueFormatter: (value) => {
                try {
                    return value ? format(value, 'MMM dd, yyyy') : '';
                } catch {
                    return '';
                }
            },
        },
        {
            field: 'time',
            headerName: t('events.table.columns.time'),
            width: 100,
            editable: true,
            type: 'string',
            description: `Time in ${timezone} timezone (HH:MM format)`,
        },
        {
            field: 'currency',
            headerName: t('events.table.columns.currency'),
            width: 90,
            editable: true,
            type: 'singleSelect',
            valueOptions: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD', 'ALL'],
        },
        {
            field: 'event',
            headerName: t('events.table.columns.event'),
            flex: 1,
            minWidth: 200,
            editable: true,
            type: 'string',
            renderCell: (params) => (
                <Box
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        textTransform: 'capitalize',
                    }}
                >
                    {params.value}
                </Box>
            ),
        },
        {
            field: 'impact',
            headerName: t('events.table.columns.impact'),
            width: 110,
            editable: true,
            type: 'singleSelect',
            valueOptions: ['Low', 'Medium', 'High', 'Holiday'],
            renderCell: (params) => {
                // Normalize impact value for comparison (stored values vary: "Low", "Medium", "High", "Holiday", etc.)
                const rawValue = params.value || '';
                const lowerValue = rawValue.toLowerCase();

                // Determine chip color based on normalized value
                let color = 'default';
                let translationKey = 'unknown';

                if (lowerValue.includes('high')) {
                    color = 'error';
                    translationKey = 'highImpact';
                } else if (lowerValue.includes('medium') || lowerValue.includes('moderate')) {
                    color = 'warning';
                    translationKey = 'mediumImpact';
                } else if (lowerValue.includes('low') || lowerValue.includes('weak')) {
                    color = 'success';
                    translationKey = 'lowImpact';
                } else if (lowerValue.includes('holiday') || lowerValue.includes('non')) {
                    color = 'default';
                    translationKey = 'nonEconomic';
                }

                return (
                    <Chip
                        label={t(`events.impacts.${translationKey}`)}
                        color={color}
                        size="small"
                    />
                );
            },
        },
        {
            field: 'forecast',
            headerName: t('events.table.columns.forecast'),
            width: 110,
            editable: true,
            type: 'string',
            renderCell: (params) => params.value || '--',
        },
        {
            field: 'previous',
            headerName: t('events.table.columns.previous'),
            width: 110,
            editable: true,
            type: 'string',
            renderCell: (params) => params.value || '--',
        },
        {
            field: 'actual',
            headerName: t('events.table.columns.actual'),
            width: 110,
            editable: true,
            type: 'string',
            renderCell: (params) => params.value || '--',
        },
        {
            field: 'source',
            headerName: t('events.table.columns.source'),
            width: 110,
            editable: false,
            valueGetter: (value, row) => getPrimarySource(row.sources),
            renderCell: (params) => (
                <Chip
                    label={t(`events.sources.${params.value}`)}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: 'manuallyEdited',
            headerName: t('events.table.columns.manuallyEdited'),
            width: 90,
            align: 'center',
            editable: false,
            renderCell: (params) => {
                if (!params.row.manuallyEdited) return null;

                const isFrozen = params.row.syncFrozen;
                const tooltipKey = isFrozen ? 'manualBadgeTooltip' : 'futureBadgeTooltip';

                return (
                    <Tooltip title={t(`events.table.${tooltipKey}`)}>
                        <Chip
                            label={t('events.table.manualBadge')}
                            color={isFrozen ? 'warning' : 'info'}
                            size="small"
                        />
                    </Tooltip>
                );
            },
        },
        {
            field: 'actions',
            headerName: t('events.table.columns.actions'),
            width: 80,
            type: 'actions',
            getActions: (params) => {
                const isDisabled = !params.row.changelog || params.row.changelog.length === 0;
                return [
                    <GridActionsCellItem
                        key="history"
                        icon={
                            <Tooltip title={t('events.table.viewChangelogTooltip')}>
                                {isDisabled ? (
                                    <span>
                                        <HistoryIcon fontSize="small" />
                                    </span>
                                ) : (
                                    <HistoryIcon fontSize="small" />
                                )}
                            </Tooltip>
                        }
                        label="History"
                        onClick={() => handleViewChangelog(params.row)}
                        disabled={isDisabled}
                    />,
                ];
            },
        },
    ], [t, getPrimarySource, handleViewChangelog, timezone]);

    return (
        <>
            <Paper sx={{ width: '100%', height: 'calc(100vh - 300px)', minHeight: 400 }}>
                <DataGrid
                    rows={events}
                    columns={columns}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[25, 50, 100]}
                    loading={loading}
                    disableRowSelectionOnClick
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={handleProcessRowUpdateError}
                    editMode="cell"
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-cell:focus': {
                            outline: 'none',
                        },
                        '& .MuiDataGrid-cell--editable': {
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                        },
                        '& .MuiDataGrid-columnHeader:focus': {
                            outline: 'none',
                        },
                    }}
                    localeText={{
                        noRowsLabel: t('events.table.noData'),
                        MuiTablePagination: {
                            labelRowsPerPage: t('events.table.rowsPerPage'),
                        },
                    }}
                />
            </Paper>

            {/* Changelog Dialog */}
            <Dialog
                open={changelogDialogOpen}
                onClose={() => setChangelogDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>{t('events.changelogDialog.title')}</DialogTitle>
                <DialogContent>
                    {selectedChangelog.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {t('events.changelogDialog.noChanges')}
                        </Alert>
                    ) : (
                        <TableContainer sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('events.changelogDialog.timestamp')}</TableCell>
                                        <TableCell>{t('events.changelogDialog.admin')}</TableCell>
                                        <TableCell>{t('events.changelogDialog.field')}</TableCell>
                                        <TableCell>{t('events.changelogDialog.oldValue')}</TableCell>
                                        <TableCell>{t('events.changelogDialog.newValue')}</TableCell>
                                        <TableCell>{t('events.changelogDialog.reason')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedChangelog.map((entry, index) => {
                                        // Safely format timestamp (handle both ISO strings and Date objects)
                                        const formattedTimestamp = (() => {
                                            try {
                                                const date = typeof entry.timestamp === 'string'
                                                    ? parseISO(entry.timestamp)
                                                    : entry.timestamp;
                                                return format(date, 'MMM dd, yyyy HH:mm');
                                            } catch {
                                                return entry.timestamp || '--';
                                            }
                                        })();

                                        // Safely stringify values (could be objects, strings, numbers, etc.)
                                        const formatValue = (val) => {
                                            if (val === null || val === undefined) return '--';
                                            if (typeof val === 'object') return JSON.stringify(val);
                                            return String(val);
                                        };

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{formattedTimestamp}</TableCell>
                                                <TableCell>{entry.adminEmail}</TableCell>
                                                <TableCell>
                                                    <Chip label={entry.field} size="small" />
                                                </TableCell>
                                                <TableCell>{formatValue(entry.oldValue)}</TableCell>
                                                <TableCell>{formatValue(entry.newValue)}</TableCell>
                                                <TableCell>{entry.reason || '--'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setChangelogDialogOpen(false)}>
                        {t('events.changelogDialog.closeButton')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

AdminEventsTable.propTypes = {
    events: PropTypes.array,
    loading: PropTypes.bool,
    onEventUpdate: PropTypes.func.isRequired,
    timezone: PropTypes.string,
};

export default AdminEventsTable;
