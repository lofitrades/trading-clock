/**
 * src/components/admin/AdminDescriptionDialog.jsx
 *
 * Purpose: Dialog for creating and editing event descriptions
 * Multi-language support with EN/ES/FR tabs for localized content
 * BEP: Validation, controlled inputs, responsive design, i18n, navigation guard
 *
 * Changelog:
 * v2.2.0 - 2026-02-02 - Added releaseTime to i18n structure for multi-language release schedule descriptions
 * v2.1.0 - 2026-02-02 - Added navigation guard with unsaved changes confirmation modal
 * v2.0.0 - 2026-02-02 - Added multi-language tabs (EN/ES/FR) for i18n support
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP standards
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    Box,
    Typography,
    IconButton,
    Divider,
    Alert,
    Tabs,
    Tab,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import UnsavedChangesModal from '../UnsavedChangesModal';

// Supported languages for descriptions
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];
const LANGUAGE_LABELS = { en: 'English', es: 'Español', fr: 'Français' };

// Empty i18n structure
const emptyI18nContent = () => ({
    description: '',
    tradingImplication: '',
    keyThresholds: { strong: '', moderate: '', weak: '' },
    releaseTime: '',
});

const initialFormState = {
    name: '',
    aliases: [],
    category: '',
    impact: 'medium',
    frequency: '',
    releaseTime: '',
    source: '',
    // Legacy fields (for backward compat, maps to EN)
    description: '',
    tradingImplication: '',
    keyThresholds: {
        strong: '',
        moderate: '',
        weak: '',
    },
    // i18n nested structure
    i18n: {
        en: emptyI18nContent(),
        es: emptyI18nContent(),
        fr: emptyI18nContent(),
    },
};

const AdminDescriptionDialog = ({
    open,
    onClose,
    onSave,
    description,
    categories = [],
}) => {
    const { t } = useTranslation('admin');
    const isEditing = Boolean(description);

    const [formData, setFormData] = useState(initialFormState);
    const [initialFormData, setInitialFormData] = useState(null);
    const [newAlias, setNewAlias] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeLanguageTab, setActiveLanguageTab] = useState(0);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

    // Get current language key from tab index
    const currentLang = SUPPORTED_LANGUAGES[activeLanguageTab];

    // Calculate translation status for each language
    const getLanguageStatus = useCallback((i18nData, lang) => {
        const content = i18nData?.[lang];
        if (!content) return 'missing';

        const hasDescription = Boolean(content.description?.trim());
        const hasImplication = Boolean(content.tradingImplication?.trim());
        const hasThresholds = Boolean(
            content.keyThresholds?.strong?.trim() ||
            content.keyThresholds?.moderate?.trim() ||
            content.keyThresholds?.weak?.trim()
        );
        const hasReleaseTime = Boolean(content.releaseTime?.trim());

        const filledCount = [hasDescription, hasImplication, hasThresholds, hasReleaseTime].filter(Boolean).length;

        if (filledCount === 0) return 'missing';
        if (filledCount < 3) return 'partial';
        return 'complete';
    }, []);

    // Get status icon based on translation status
    const getStatusIcon = useCallback((status) => {
        if (status === 'complete') {
            return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', ml: 0.5 }} />;
        }
        if (status === 'partial') {
            return <WarningIcon sx={{ fontSize: 16, color: 'warning.main', ml: 0.5 }} />;
        }
        return <ErrorIcon sx={{ fontSize: 16, color: 'error.main', ml: 0.5 }} />;
    }, []);

    // Initialize form data when dialog opens
    useEffect(() => {
        if (open) {
            let newFormData;
            if (description) {
                // Initialize i18n from existing data or create from legacy fields
                const existingI18n = description.i18n || {};
                const i18n = {
                    en: existingI18n.en || {
                        description: description.description || '',
                        tradingImplication: description.tradingImplication || '',
                        keyThresholds: description.keyThresholds || { strong: '', moderate: '', weak: '' },
                        releaseTime: description.releaseTime || '',
                    },
                    es: existingI18n.es || emptyI18nContent(),
                    fr: existingI18n.fr || emptyI18nContent(),
                };

                newFormData = {
                    name: description.name || '',
                    aliases: description.aliases || [],
                    category: description.category || '',
                    impact: description.impact || 'medium',
                    frequency: description.frequency || '',
                    releaseTime: i18n.en.releaseTime,
                    source: description.source || '',
                    // Legacy fields from EN
                    description: i18n.en.description,
                    tradingImplication: i18n.en.tradingImplication,
                    keyThresholds: i18n.en.keyThresholds,
                    i18n,
                };
            } else {
                newFormData = initialFormState;
            }
            setFormData(newFormData);
            setInitialFormData(JSON.parse(JSON.stringify(newFormData)));
            setNewAlias('');
            setError('');
            setActiveLanguageTab(0); // Reset to English tab
            setHasUnsavedChanges(false);
            setShowCloseConfirmation(false);
        }
    }, [open, description]);

    // Detect unsaved changes by comparing form with initial form
    useEffect(() => {
        if (!initialFormData) {
            setHasUnsavedChanges(false);
            return;
        }
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        setHasUnsavedChanges(hasChanges);
    }, [formData, initialFormData]);

    // Handle field changes (non-i18n fields)
    const handleChange = useCallback((field) => (event) => {
        setFormData(prev => ({
            ...prev,
            [field]: event.target.value,
        }));
        setError('');
    }, []);

    // Handle i18n field changes (description, tradingImplication)
    const handleI18nChange = useCallback((field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            i18n: {
                ...prev.i18n,
                [currentLang]: {
                    ...prev.i18n[currentLang],
                    [field]: value,
                },
            },
            // Also update legacy fields if editing English
            ...(currentLang === 'en' ? { [field]: value } : {}),
        }));
        setError('');
    }, [currentLang]);

    // Handle i18n key threshold changes
    const handleI18nThresholdChange = useCallback((key) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            i18n: {
                ...prev.i18n,
                [currentLang]: {
                    ...prev.i18n[currentLang],
                    keyThresholds: {
                        ...prev.i18n[currentLang]?.keyThresholds,
                        [key]: value,
                    },
                },
            },
            // Also update legacy fields if editing English
            ...(currentLang === 'en' ? {
                keyThresholds: {
                    ...prev.keyThresholds,
                    [key]: value,
                },
            } : {}),
        }));
    }, [currentLang]);

    // Handle add alias
    const handleAddAlias = useCallback(() => {
        const trimmedAlias = newAlias.trim();
        if (trimmedAlias && !formData.aliases.includes(trimmedAlias)) {
            setFormData(prev => ({
                ...prev,
                aliases: [...prev.aliases, trimmedAlias],
            }));
            setNewAlias('');
        }
    }, [newAlias, formData.aliases]);

    // Handle remove alias
    const handleRemoveAlias = useCallback((aliasToRemove) => {
        setFormData(prev => ({
            ...prev,
            aliases: prev.aliases.filter(a => a !== aliasToRemove),
        }));
    }, []);

    // Handle alias key press (Enter to add)
    const handleAliasKeyPress = useCallback((event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAddAlias();
        }
    }, [handleAddAlias]);

    // Handle save
    const handleSave = useCallback(async () => {
        // Validate required fields
        if (!formData.name.trim()) {
            setError(t('descriptions.dialog.errors.nameRequired'));
            return;
        }

        // Validate at least English content exists
        const enContent = formData.i18n?.en;
        if (!enContent?.description?.trim()) {
            setError(t('descriptions.dialog.errors.englishRequired'));
            setActiveLanguageTab(0); // Switch to English tab
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Prepare data with i18n structure
            const dataToSave = {
                ...formData,
                // Ensure legacy fields sync with English
                description: formData.i18n.en.description,
                tradingImplication: formData.i18n.en.tradingImplication,
                keyThresholds: formData.i18n.en.keyThresholds,
                releaseTime: formData.i18n.en.releaseTime,
            };

            if (isEditing) {
                // Update existing - calculate changes
                const updates = {};
                Object.keys(dataToSave).forEach(key => {
                    if (JSON.stringify(dataToSave[key]) !== JSON.stringify(description[key])) {
                        updates[key] = dataToSave[key];
                    }
                });

                if (Object.keys(updates).length > 0) {
                    await onSave(description.id, updates, 'Dialog edit (i18n)', description);
                }
            } else {
                // Create new
                await onSave(dataToSave);
            }
            onClose();
        } catch (err) {
            setError(err.message || t('descriptions.dialog.errors.saveFailed'));
        } finally {
            setSaving(false);
        }
    }, [formData, isEditing, description, onSave, onClose, t]);

    // Handle language tab change
    const handleLanguageTabChange = useCallback((event, newValue) => {
        setActiveLanguageTab(newValue);
    }, []);

    // Handle close with unsaved changes check
    const handleClose = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    }, [hasUnsavedChanges, onClose]);

    // Confirm close (discard changes)
    const handleConfirmClose = useCallback(() => {
        setShowCloseConfirmation(false);
        setHasUnsavedChanges(false);
        onClose();
    }, [onClose]);

    // Cancel close (keep editing)
    const handleCancelClose = useCallback(() => {
        setShowCloseConfirmation(false);
    }, []);

    // Get current language's i18n content
    const currentI18nContent = formData.i18n?.[currentLang] || emptyI18nContent();

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { maxHeight: '90vh' },
                }}
            >
                <DialogTitle>
                    {isEditing
                        ? t('descriptions.dialog.editTitle')
                        : t('descriptions.dialog.createTitle')}
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        {/* Basic Info Section */}
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {t('descriptions.dialog.sections.basicInfo')}
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label={t('descriptions.dialog.fields.name')}
                                value={formData.name}
                                onChange={handleChange('name')}
                                disabled={isEditing}
                                helperText={isEditing ? t('descriptions.dialog.nameNotEditable') : ''}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('descriptions.dialog.fields.category')}</InputLabel>
                                <Select
                                    value={formData.category}
                                    onChange={handleChange('category')}
                                    label={t('descriptions.dialog.fields.category')}
                                >
                                    <MenuItem value="">{t('descriptions.dialog.selectCategory')}</MenuItem>
                                    {categories.map((cat) => (
                                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                    ))}
                                    <MenuItem value="__new__">
                                        <em>{t('descriptions.dialog.addNewCategory')}</em>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {formData.category === '__new__' && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label={t('descriptions.dialog.fields.newCategory')}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                />
                            </Grid>
                        )}

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>{t('descriptions.dialog.fields.impact')}</InputLabel>
                                <Select
                                    value={formData.impact}
                                    onChange={handleChange('impact')}
                                    label={t('descriptions.dialog.fields.impact')}
                                >
                                    <MenuItem value="high">{t('events.impacts.highImpact')}</MenuItem>
                                    <MenuItem value="medium">{t('events.impacts.mediumImpact')}</MenuItem>
                                    <MenuItem value="low">{t('events.impacts.lowImpact')}</MenuItem>
                                    <MenuItem value="none">{t('events.impacts.nonEconomic')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                label={t('descriptions.dialog.fields.frequency')}
                                value={formData.frequency}
                                onChange={handleChange('frequency')}
                                placeholder="e.g., Monthly, Weekly"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                label={t('descriptions.dialog.fields.source')}
                                value={formData.source}
                                onChange={handleChange('source')}
                                placeholder="e.g., Bureau of Labor Statistics"
                            />
                        </Grid>

                        {/* Aliases Section */}
                        <Grid size={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {t('descriptions.dialog.sections.aliases')}
                            </Typography>
                        </Grid>

                        <Grid size={12}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                    size="small"
                                    label={t('descriptions.dialog.fields.addAlias')}
                                    value={newAlias}
                                    onChange={(e) => setNewAlias(e.target.value)}
                                    onKeyPress={handleAliasKeyPress}
                                    sx={{ flexGrow: 1 }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddAlias}
                                    disabled={!newAlias.trim()}
                                    startIcon={<AddIcon />}
                                >
                                    {t('descriptions.dialog.addAliasButton')}
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {formData.aliases.map((alias, idx) => (
                                    <Chip
                                        key={idx}
                                        label={alias}
                                        onDelete={() => handleRemoveAlias(alias)}
                                        size="small"
                                    />
                                ))}
                                {formData.aliases.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        {t('descriptions.dialog.noAliases')}
                                    </Typography>
                                )}
                            </Box>
                        </Grid>

                        {/* Localized Content Section with Language Tabs */}
                        <Grid size={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                {t('descriptions.dialog.sections.localizedContent')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {t('descriptions.dialog.i18nHint')}
                            </Typography>
                        </Grid>

                        <Grid size={12}>
                            <Tabs
                                value={activeLanguageTab}
                                onChange={handleLanguageTabChange}
                                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                            >
                                {SUPPORTED_LANGUAGES.map((lang, idx) => {
                                    const status = getLanguageStatus(formData.i18n, lang);
                                    return (
                                        <Tab
                                            key={lang}
                                            label={
                                                <Tooltip title={t(`descriptions.dialog.translationStatus.${status}`)}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {LANGUAGE_LABELS[lang]}
                                                        {getStatusIcon(status)}
                                                    </Box>
                                                </Tooltip>
                                            }
                                            id={`lang-tab-${idx}`}
                                            aria-controls={`lang-tabpanel-${idx}`}
                                        />
                                    );
                                })}
                            </Tabs>

                            {/* Localized Description */}
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label={t('descriptions.dialog.fields.description')}
                                value={currentI18nContent.description || ''}
                                onChange={handleI18nChange('description')}
                                placeholder={t('descriptions.dialog.descriptionPlaceholder')}
                                sx={{ mb: 2 }}
                                required={currentLang === 'en'}
                                helperText={currentLang !== 'en' ? t('descriptions.dialog.copyFromEnglish') : ''}
                            />

                            {/* Localized Trading Implication */}
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label={t('descriptions.dialog.fields.tradingImplication')}
                                value={currentI18nContent.tradingImplication || ''}
                                onChange={handleI18nChange('tradingImplication')}
                                placeholder={t('descriptions.dialog.tradingImplicationPlaceholder')}
                                sx={{ mb: 2 }}
                            />

                            {/* Localized Release Time */}
                            <TextField
                                fullWidth
                                label={t('descriptions.dialog.fields.releaseTime')}
                                value={currentI18nContent.releaseTime || ''}
                                onChange={handleI18nChange('releaseTime')}
                                placeholder={t('descriptions.dialog.releaseTimePlaceholder')}
                                helperText={currentLang !== 'en' ? t('descriptions.dialog.releaseTimeHint') : ''}
                                sx={{ mb: 2 }}
                            />

                            {/* Localized Key Thresholds */}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {t('descriptions.dialog.sections.keyThresholds')}
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('descriptions.dialog.fields.thresholdStrong')}
                                        value={currentI18nContent.keyThresholds?.strong || ''}
                                        onChange={handleI18nThresholdChange('strong')}
                                        placeholder="e.g., > 250,000 jobs"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('descriptions.dialog.fields.thresholdModerate')}
                                        value={currentI18nContent.keyThresholds?.moderate || ''}
                                        onChange={handleI18nThresholdChange('moderate')}
                                        placeholder="e.g., 150,000 - 250,000 jobs"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label={t('descriptions.dialog.fields.thresholdWeak')}
                                        value={currentI18nContent.keyThresholds?.weak || ''}
                                        onChange={handleI18nThresholdChange('weak')}
                                        placeholder="e.g., < 150,000 jobs"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={saving}>
                        {t('descriptions.dialog.cancelButton')}
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={saving || !formData.name.trim()}
                    >
                        {saving
                            ? t('descriptions.dialog.saving')
                            : isEditing
                                ? t('descriptions.dialog.updateButton')
                                : t('descriptions.dialog.createButton')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesModal
                open={showCloseConfirmation}
                onConfirm={handleConfirmClose}
                onCancel={handleCancelClose}
                message={t('descriptions.dialog.unsavedChanges.message')}
            />
        </>
    );
};

AdminDescriptionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    description: PropTypes.object,
    categories: PropTypes.array,
};

export default AdminDescriptionDialog;
