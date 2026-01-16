/**
 * src/components/AccountModal.jsx
 * 
 * Purpose: Standalone account management modal with profile editing and account deletion.
 * Mobile-first responsive design with enterprise UX patterns.
 * 
 * Features:
 * - Simple initials avatar (preserves Google account photos)
 * - Display name editing
 * - Password reset via email
 * - Account deletion with confirmation
 * - Fully responsive (mobile → desktop)
 * - Self-contained with proper error handling
 * 
 * Changelog:
 * v2.1.4 - 2026-01-15 - Hide AccountModal when password reset flow is triggered to prevent stacking conflicts.
 * v2.1.3 - 2026-01-15 - Hide AccountModal when higher-priority auth modals (e.g., ForgotPasswordModal) are active.
 * v2.1.2 - 2026-01-15 - Modal layering: keep backdrop behind paper and ensure modal stacks above AppBar.
 * v2.1.1 - 2025-12-16 - ESLint compliance: PropTypes and storage imports
 * v2.1.0 - 2025-12-16 - Simplified avatar: removed upload/delete, kept Google photos and initials fallback
 * v2.0.0 - 2025-12-16 - Complete redesign: mobile-first, responsive, enterprise UX, separation of concerns
 * v1.0.0 - 2025-09-15 - Initial implementation
 */

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Avatar,
  IconButton,
  Stack,
  Divider,
  Collapse,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { updateProfile, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';
import { getFriendlyErrorMessage } from '../utils/messages';

export default function AccountModal({ open, onClose, user }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isHiddenByAuthModal, setIsHiddenByAuthModal] = useState(false);
  const [hideAccountModal, setHideAccountModal] = useState(false);

  const REQUIRED_DELETE_TEXT = 'Delete Account Permanently';

  // Update local state when user prop changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  // Reset messages when modal opens
  useEffect(() => {
    if (open) {
      setMessage('');
      setError('');
      setDeleteConfirmText('');
    }
  }, [open]);

  useEffect(() => {
    const handlePriorityEvent = (event) => {
      if (event?.detail && typeof event.detail.active === 'boolean') {
        setIsHiddenByAuthModal(event.detail.active);
      }
    };

    window.addEventListener('t2t-modal-priority', handlePriorityEvent);
    return () => {
      window.removeEventListener('t2t-modal-priority', handlePriorityEvent);
    };
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setMessage('');
    setError('');
    setSaving(true);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim() || null
      });

      // Update Firestore user document
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: displayName.trim() || null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setMessage('Profile updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('[AccountModal] Save failed:', err);
      setError(getFriendlyErrorMessage(err.code) || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setShowPasswordConfirm(false);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage(`Password reset email sent to ${user.email}. Check your inbox!`);
      setHideAccountModal(false);
    } catch (err) {
      console.error('[AccountModal] Password reset failed:', err);
      setError(getFriendlyErrorMessage(err.code) || 'Failed to send password reset email.');
      setHideAccountModal(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setShowDeleteConfirm(false);
    setError('');
    setMessage('');

    try {
      // Step 1: Delete user's profile photo from Storage (if exists)
      try {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await deleteObject(storageRef);
      } catch {
        // Ignore if photo doesn't exist
      }

      // Step 2: Delete Firestore user document (GDPR/CCPA compliance - right to be forgotten)
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (firestoreErr) {
        console.warn('[AccountModal] Firestore deletion failed:', firestoreErr);
        // Continue with auth deletion even if Firestore fails
      }

      // Step 3: Delete Firebase Auth user (must be last - user loses access after this)
      await deleteUser(user);

      // User will be signed out automatically after deletion
      onClose();
    } catch (err) {
      console.error('[AccountModal] Account deletion failed:', err);

      if (err.code === 'auth/requires-recent-login') {
        setError('For security, please sign out and sign back in before deleting your account.');
      } else {
        setError(getFriendlyErrorMessage(err.code) || 'Failed to delete account.');
      }
    }
  };

  if (!user) return null;

  const hasChanges = displayName.trim() !== (user.displayName || '');

  // Get initials: two names = two initials, one name = one initial
  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      // Two or more names: first letter of first two names
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    // Single name: first letter only
    return parts[0].charAt(0).toUpperCase();
  };

  const avatarInitials = getInitials(displayName || user?.email?.split('@')[0] || '');

  return (
    <>
      {!isHiddenByAuthModal && !hideAccountModal && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          sx={{ zIndex: 1701 }}
          slotProps={{
            backdrop: { sx: { zIndex: -1 } },
          }}
          PaperProps={{
            sx: {
              borderRadius: { xs: 0, sm: 3 },
              m: { xs: 0, sm: 2 },
              width: { xs: '100%', sm: 'calc(100% - 32px)' },
              maxHeight: { xs: '100%', sm: 'calc(100% - 32px)' },
            }
          }}
        >
          {/* Header */}
          <DialogTitle sx={{
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 },
            fontWeight: 700,
          }}>
            Account Settings
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: { xs: 2.5, sm: 2 }, px: { xs: 2, sm: 2 }, pb: { xs: 2, sm: 3 } }}>
            <Stack spacing={{ xs: 2.5, sm: 2 }} sx={{ mt: { xs: 0.5, sm: 2 } }}>
              {/* Profile Header - Avatar + Basic Info */}
              <Box sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start'
              }}>
                <Avatar
                  src={user?.photoURL || undefined}
                  alt={displayName || user?.email}
                  sx={{
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    bgcolor: 'primary.main',
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    fontWeight: 500,
                    flexShrink: 0
                  }}
                  imgProps={{
                    referrerPolicy: 'no-referrer',
                    crossOrigin: 'anonymous'
                  }}
                >
                  {!user?.photoURL && avatarInitials}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {displayName || 'No name set'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Personal Information */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Personal Information
                </Typography>
                <Stack spacing={2} sx={{ mt: 1.5 }}>
                  <TextField
                    label="Display Name"
                    fullWidth
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    size="small"
                    disabled={saving}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Security Section */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Security
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<LockResetIcon />}
                  onClick={() => {
                    setHideAccountModal(true);
                    setShowPasswordConfirm(true);
                  }}
                  fullWidth
                  sx={{ mt: 1.5, textTransform: 'none', justifyContent: 'flex-start' }}
                >
                  Send Password Reset Email
                </Button>
              </Box>

              {/* Messages */}
              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError('')}
                  sx={{ borderRadius: 2 }}
                >
                  {error}
                </Alert>
              )}
              {message && (
                <Alert
                  severity="success"
                  onClose={() => setMessage('')}
                  sx={{ borderRadius: 2 }}
                >
                  {message}
                </Alert>
              )}

              <Divider />

              {/* Danger Zone */}
              <Box>
                <Button
                  onClick={() => setShowDangerZone(!showDangerZone)}
                  startIcon={<WarningAmberIcon />}
                  sx={{
                    textTransform: 'none',
                    color: 'text.secondary',
                    justifyContent: 'flex-start',
                  }}
                  fullWidth
                >
                  {showDangerZone ? 'Hide Danger Zone' : 'Show Danger Zone'}
                </Button>
                <Collapse in={showDangerZone}>
                  <Box sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alpha('#d32f2f', 0.05),
                    border: 1,
                    borderColor: 'error.light',
                    borderRadius: 2,
                  }}>
                    <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>
                      Delete Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => setShowDeleteConfirm(true)}
                      fullWidth
                      sx={{ textTransform: 'none' }}
                    >
                      Delete My Account
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            </Stack>
          </DialogContent>

          {/* Footer Actions */}
          <DialogActions sx={{
            p: { xs: 2, sm: 2.5 },
            pt: 0,
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}>
            <Button
              onClick={onClose}
              fullWidth={{ xs: true, sm: false }}
              sx={{ textTransform: 'none' }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!hasChanges || saving}
              fullWidth={{ xs: true, sm: false }}
              sx={{ textTransform: 'none', minWidth: { sm: 120 } }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Password Reset Confirmation */}
      {showPasswordConfirm && (
        <ConfirmModal
          open={showPasswordConfirm}
          onClose={() => {
            setShowPasswordConfirm(false);
            setHideAccountModal(false);
          }}
          onConfirm={handlePasswordReset}
          title="Reset Password"
          message={`Send a password reset email to ${user.email}?`}
          confirmText="Send Email"
          cancelText="Cancel"
        />
      )}

      {/* Delete Account Confirmation - Manual Typing Required */}
      {showDeleteConfirm && (
        <Dialog
          open={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
          }}
          maxWidth="sm"
          fullWidth
          sx={{ zIndex: 1701 }}
          slotProps={{
            backdrop: { sx: { zIndex: -1 } },
          }}
          PaperProps={{
            sx: { borderRadius: { xs: 0, sm: 3 } }
          }}
        >
          <DialogTitle sx={{
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'error.main',
          }}>
            <WarningAmberIcon />
            Delete Account Permanently
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3 } }}>
            <Alert severity="error" sx={{ my: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ⚠️ This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                All your data will be permanently deleted:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>Profile information and photos</li>
                <li>Settings and preferences</li>
                <li>All saved data</li>
              </Box>
            </Alert>

            <Typography variant="body2" color="text.secondary" paragraph>
              To confirm deletion, please type the following exactly (case-sensitive):
            </Typography>

            <Box sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              mb: 2,
              fontFamily: 'monospace',
              textAlign: 'center',
              fontWeight: 600,
            }}>
              {REQUIRED_DELETE_TEXT}
            </Box>

            <TextField
              fullWidth
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              placeholder="Type here to confirm..."
              autoComplete="off"
              autoFocus
              error={deleteConfirmText.length > 0 && deleteConfirmText !== REQUIRED_DELETE_TEXT}
              helperText={
                deleteConfirmText.length > 0 && deleteConfirmText !== REQUIRED_DELETE_TEXT
                  ? 'Text must match exactly (case-sensitive)'
                  : 'Paste is disabled - you must type manually'
              }
              sx={{
                '& input': {
                  fontFamily: 'monospace',
                }
              }}
            />
          </DialogContent>

          <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 0, gap: 1 }}>
            <Button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              variant="contained"
              color="error"
              disabled={deleteConfirmText !== REQUIRED_DELETE_TEXT}
              sx={{ textTransform: 'none' }}
            >
              Delete Forever
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

AccountModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
  }).isRequired,
};
