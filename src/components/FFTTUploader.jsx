/**
* src/components/FFTTUploader.jsx
* 
* Purpose: Superadmin-only uploader for GPT-generated FF-T2T economic events.
* Handles JSON validation, batching, and Firestore canonical ingest via Cloud Functions.
* 
* Changelog:
* v1.0.0 - 2026-01-16 - Initial implementation with RBAC gating and batch uploader.
*/

import { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
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

export default function FFTTUploader() {
    const { userProfile, loading } = useAuth();
    const isSuperadmin = useMemo(() => userProfile?.role === 'superadmin', [userProfile?.role]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0] || null;
        setSelectedFile(file);
        setValidationErrors([]);
        setError(null);
        setResult(null);
        setProgress(0);
    };

    const handleValidate = async () => {
        if (!selectedFile) {
            setError('Select a JSON file first.');
            return;
        }

        try {
            const fileContent = await selectedFile.text();
            const parsed = JSON.parse(fileContent);
            const events = normalizePayload(parsed);

            if (!events) {
                throw new Error('JSON must be an array or { "events": [] }.');
            }

            const issues = [];
            events.forEach((evt, index) => {
                const errs = validateEvent(evt);
                if (errs.length > 0) {
                    issues.push({ index, errors: errs, name: evt?.name || 'Unknown' });
                }
            });

            setValidationErrors(issues);
            if (issues.length === 0) {
                setResult({ type: 'info', message: `Validated ${events.length} events. Ready to upload.` });
            } else {
                setResult(null);
            }
        } catch (err) {
            setError(err.message || 'Failed to validate JSON.');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Select a JSON file first.');
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
            events.forEach((evt, index) => {
                const errs = validateEvent(evt);
                if (errs.length > 0) {
                    issues.push({ index, errors: errs, name: evt?.name || 'Unknown' });
                }
            });

            if (issues.length > 0) {
                setValidationErrors(issues);
                throw new Error('Fix validation errors before uploading.');
            }

            const batches = chunkArray(events, MAX_BATCH_SIZE);
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
                message: `Upload complete. Created ${created}, merged ${merged}, skipped ${skipped}, errors ${errors}.`,
            });
        } catch (err) {
            setError(err.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Loading...</Typography>
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
                        <Alert severity="error">Superadmin access required.</Alert>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', px: { xs: 2, md: 4 }, py: 4 }}>
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} gutterBottom>
                            FF-T2T
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Upload GPT-generated economic events to seed the canonical collection.
                        </Typography>
                    </Box>

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                    <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                        Select JSON
                                        <input hidden type="file" accept="application/json" onChange={handleFileSelect} />
                                    </Button>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedFile ? selectedFile.name : 'No file selected'}
                                    </Typography>
                                </Stack>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                    <Button variant="contained" onClick={handleValidate} disabled={!selectedFile || uploading} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                        Validate JSON
                                    </Button>
                                    <Button variant="contained" color="secondary" onClick={handleUpload} disabled={!selectedFile || uploading} sx={{ textTransform: 'none', fontWeight: 700 }}>
                                        Upload
                                    </Button>
                                </Stack>

                                {uploading && <LinearProgress variant="determinate" value={progress} />}

                                {error && <Alert severity="error">{error}</Alert>}
                                {result && <Alert severity={result.type}>{result.message}</Alert>}

                                {validationErrors.length > 0 && (
                                    <Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle2" fontWeight={800} gutterBottom>
                                            Validation Issues ({validationErrors.length})
                                        </Typography>
                                        <Stack spacing={1}>
                                            {validationErrors.slice(0, 8).map((issue) => (
                                                <Box key={`${issue.index}-${issue.name}`} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={700}>
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
                                                    {validationErrors.length - 8} more issues not shown.
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Box>
    );
}
