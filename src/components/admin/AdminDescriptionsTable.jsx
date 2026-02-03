/**
 * src/components/admin/AdminDescriptionsTable.jsx
 *
 * Purpose: MUI DataGrid table for displaying and editing event descriptions
 * Supports inline editing, delete confirmation, changelog viewing
 * Shows translation status indicators for EN/ES/FR languages
 * BEP: Responsive design, proper accessibility, i18n support
 *
 * Changelog:
 * v2.0.0 - 2026-02-02 - Added translation status column with EN/ES/FR indicators
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP standards
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
    DialogContentText,
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import { format, parseISO } from 'date-fns';

// Supported languages for descriptions
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];

// Translation status icon component
const TranslationStatusIcon = ({ status, lang }) => {
    const { t } = useTranslation('admin');

    const statusConfig = {
        complete: { icon: CheckCircleIcon, color: 'success.main', key: 'complete' },
        partial: { icon: WarningIcon, color: 'warning.main', key: 'partial' },
        missing: { icon: CancelIcon, color: 'error.main', key: 'missing' },
    };

    const config = statusConfig[status] || statusConfig.missing;
    const Icon = config.icon;

    return (
        <Tooltip title={`${lang.toUpperCase()}: ${t(`descriptions.dialog.translationStatus.${config.key}`)}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <Box component="span" sx={{ fontSize: 10, fontWeight: 'bold', color: 'text.secondary' }}>
                    {lang.toUpperCase()}
                </Box>
                <Icon sx={{ fontSize: 14, color: config.color }} />
            </Box>
        </Tooltip>
    );
};

TranslationStatusIcon.propTypes = {
    status: PropTypes.oneOf(['complete', 'partial', 'missing']).isRequired,
    lang: PropTypes.string.isRequired,
};

const AdminDescriptionsTable = ({
    descriptions = [],
    loading = false,
    onUpdate,
    onEdit,
    onDelete,
}) => {
    const { t } = useTranslation('admin');

    const [changelogDialogOpen, setChangelogDialogOpen] = useState(false);
    const [selectedChangelog, setSelectedChangelog] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 25,
    });

    // Process row update with changelog tracking
    const processRowUpdate = useCallback(async (newRow, oldRow) => {
        const changedFields = {};
        Object.keys(newRow).forEach(key => {
            if (newRow[key] !== oldRow[key] && key !== 'id') {
                changedFields[key] = newRow[key];
            }
        });

        if (Object.keys(changedFields).length === 0) {
            return oldRow;
        }

        try {
            await onUpdate(newRow.id, changedFields, 'Inline edit', oldRow);
            return newRow;
        } catch (error) {
            console.error('Failed to update description:', error);
            return oldRow;
        }
    }, [onUpdate]);

    const handleProcessRowUpdateError = useCallback((error) => {
        console.error('Row update error:', error);
    }, []);

    // Handle view changelog
    const handleViewChangelog = useCallback((description) => {
        setSelectedChangelog(description.changelog || []);
        setChangelogDialogOpen(true);
    }, []);

    // Handle delete confirmation
    const handleDeleteClick = useCallback((description) => {
        setDeleteTarget(description);
        setDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (deleteTarget) {
            await onDelete(deleteTarget.id);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    }, [deleteTarget, onDelete]);

    // Define columns
    const columns = useMemo(() => [
        {
            field: 'name',
            headerName: t('descriptions.table.columns.name'),
            width: 200,
            editable: true,
        },
        {
            field: 'category',
            headerName: t('descriptions.table.columns.category'),
            width: 150,
            editable: true,
        },
        {
            field: 'impact',
            headerName: t('descriptions.table.columns.impact'),
            width: 110,
            editable: true,
            type: 'singleSelect',
            valueOptions: ['high', 'medium', 'low', 'none'],
            renderCell: (params) => {
                const value = (params.value || '').toLowerCase();
                let color = 'default';
                let translationKey = 'unknown';

                if (value === 'high') {
                    color = 'error';
                    translationKey = 'highImpact';
                } else if (value === 'medium') {
                    color = 'warning';
                    translationKey = 'mediumImpact';
                } else if (value === 'low') {
                    color = 'success';
                    translationKey = 'lowImpact';
                } else if (value === 'none') {
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
            field: '_translationStatus',
            headerName: t('descriptions.table.columns.translations'),
            width: 130,
            editable: false,
            sortable: false,
            renderCell: (params) => {
                const status = params.value || {};
                return (
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <TranslationStatusIcon
                                key={lang}
                                lang={lang}
                                status={status[lang] || 'missing'}
                            />
                        ))}
                    </Box>
                );
            },
        },
        {
            field: 'frequency',
            headerName: t('descriptions.table.columns.frequency'),
            width: 120,
            editable: true,
        },
        {
            field: 'source',
            headerName: t('descriptions.table.columns.source'),
            width: 150,
            editable: true,
        },
        {
            field: 'description',
            headerName: t('descriptions.table.columns.description'),
            flex: 1,
            minWidth: 250,
            editable: true,
            renderCell: (params) => (
                <Tooltip title={params.value || ''}>
                    <Box
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                        }}
                    >
                        {params.value || '--'}
                    </Box>
                </Tooltip>
            ),
        },
        {
            field: 'aliases',
            headerName: t('descriptions.table.columns.aliases'),
            width: 180,
            editable: false,
            renderCell: (params) => {
                const aliases = params.value || [];
                if (aliases.length === 0) return '--';

                return (
                    <Tooltip title={aliases.join(', ')}>
                        <Box sx={{ display: 'flex', gap: 0.5, overflow: 'hidden' }}>
                            {aliases.slice(0, 2).map((alias, idx) => (
                                <Chip key={idx} label={alias} size="small" variant="outlined" />
                            ))}
                            {aliases.length > 2 && (
                                <Chip label={`+${aliases.length - 2}`} size="small" />
                            )}
                        </Box>
                    </Tooltip>
                );
            },
        },
        {
            field: 'actions',
            headerName: t('descriptions.table.columns.actions'),
            width: 130,
            type: 'actions',
            getActions: (params) => [
                <GridActionsCellItem
                    key="edit"
                    icon={
                        <Tooltip title={t('descriptions.table.editTooltip')}>
                            <EditIcon fontSize="small" />
                        </Tooltip>
                    }
                    label="Edit"
                    onClick={() => onEdit(params.row)}
                />,
                <GridActionsCellItem
                    key="history"
                    icon={
                        <Tooltip title={t('descriptions.table.viewChangelogTooltip')}>
                            <HistoryIcon fontSize="small" />
                        </Tooltip>
                    }
                    label="History"
                    onClick={() => handleViewChangelog(params.row)}
                    disabled={!params.row.changelog || params.row.changelog.length === 0}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={
                        <Tooltip title={t('descriptions.table.deleteTooltip')}>
                            <DeleteIcon fontSize="small" color="error" />
                        </Tooltip>
                    }
                    label="Delete"
                    onClick={() => handleDeleteClick(params.row)}
                />,
            ],
        },
    ], [t, onEdit, handleViewChangelog, handleDeleteClick]);

    return (
        <>
            <Paper sx={{ width: '100%', height: 'calc(100vh - 350px)', minHeight: 400 }}>
                <DataGrid
                    rows={descriptions}
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
                    }}
                    localeText={{
                        noRowsLabel: t('descriptions.table.noData'),
                        MuiTablePagination: {
                            labelRowsPerPage: t('descriptions.table.rowsPerPage'),
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
                <DialogTitle>{t('descriptions.changelogDialog.title')}</DialogTitle>
                <DialogContent>
                    {selectedChangelog.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {t('descriptions.changelogDialog.noChanges')}
                        </Alert>
                    ) : (
                        <TableContainer sx={{ mt: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('descriptions.changelogDialog.timestamp')}</TableCell>
                                        <TableCell>{t('descriptions.changelogDialog.admin')}</TableCell>
                                        <TableCell>{t('descriptions.changelogDialog.field')}</TableCell>
                                        <TableCell>{t('descriptions.changelogDialog.oldValue')}</TableCell>
                                        <TableCell>{t('descriptions.changelogDialog.newValue')}</TableCell>
                                        <TableCell>{t('descriptions.changelogDialog.reason')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedChangelog.map((entry, index) => {
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
                                                    <Chip label={entry.field || entry.action} size="small" />
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
                        {t('descriptions.changelogDialog.closeButton')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>{t('descriptions.deleteDialog.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('descriptions.deleteDialog.message', { name: deleteTarget?.name })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        {t('descriptions.deleteDialog.cancelButton')}
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        {t('descriptions.deleteDialog.confirmButton')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

AdminDescriptionsTable.propTypes = {
    descriptions: PropTypes.array,
    loading: PropTypes.bool,
    onUpdate: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default AdminDescriptionsTable;
