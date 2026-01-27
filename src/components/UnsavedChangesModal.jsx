/**
 * src/components/UnsavedChangesModal.jsx
 * 
 * Purpose: Reusable navigation guard modal for unsaved changes confirmation
 * Key responsibility: Prevent accidental data loss by prompting users before discarding unsaved changes
 * 
 * Changelog:
 * v1.1.0 - 2026-01-27 - i18n migration: Added useTranslation hook, migrated all strings to dialogs namespace
 * v1.0.0 - 2026-01-23 - Initial implementation: Extracted from EventModal for reusability
 */

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';

/**
 * UnsavedChangesModal Component
 * 
 * Displays a confirmation dialog when user attempts to close a form with unsaved changes
 * 
 * @param {boolean} open - Whether the modal is open
 * @param {Function} onConfirm - Callback when user confirms discarding changes
 * @param {Function} onCancel - Callback when user cancels and continues editing
 * @param {string} title - Modal title (default: i18n dialogs:unsavedChangesTitle)
 * @param {string} message - Modal message (default: i18n dialogs:unsavedChangesMessage)
 * @param {string} confirmLabel - Confirm button label (default: i18n dialogs:discardChangesButton)
 * @param {string} cancelLabel - Cancel button label (default: i18n dialogs:continueEditingButton)
 * @param {number} zIndex - Z-index for modal stacking (default: 12002)
 */
export default function UnsavedChangesModal({
    open,
    onConfirm,
    onCancel,
    title,
    message,
    confirmLabel,
    cancelLabel,
    zIndex = 12002,
}) {
    const { t } = useTranslation(['dialogs']);

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex }}
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: -1,
                    },
                },
            }}
        >
            <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
                {title || t('dialogs:unsavedChangesTitle')}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    {message || t('dialogs:unsavedChangesMessage')}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button
                    onClick={onCancel}
                    color="inherit"
                    sx={{ borderRadius: 999 }}
                >
                    {cancelLabel || t('dialogs:continueEditingButton')}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    sx={{ borderRadius: 999 }}
                >
                    {confirmLabel || t('dialogs:discardChangesButton')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

UnsavedChangesModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    zIndex: PropTypes.number,
};
