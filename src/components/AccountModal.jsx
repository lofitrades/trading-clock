/* src/components/AccountModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
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
  Collapse,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { auth, db, storage } from '../firebase';
import { updateProfile, deleteUser, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ConfirmModal from './ConfirmModal';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';

export default function AccountModal({ onClose, user, resetSettings }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // We'll use a ref to open the hidden file input.
  const fileInputRef = useRef(null);

  const handleOverlayClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  useEffect(() => {
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
  }, [user]);

  const handleSave = async () => {
    setMessage('');
    setError('');
    try {
      await updateProfile(user, { displayName, photoURL });
      await setDoc(
        doc(db, 'users', user.uid),
        { displayName, photoURL, updatedAt: new Date() },
        { merge: true }
      );
      setMessage(getSuccessMessage('profile-updated'));
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code) || err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteUser(user);
        onClose();
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code) || err.message);
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    setError('');
    setMessage('');
    const file = e.target.files[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setPhotoURL(downloadURL);
      setMessage('Photo uploaded. Click Save to apply.');
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code) || err.message);
    }
  };

  const handleDeletePhoto = async () => {
    setError('');
    setMessage('');
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await deleteObject(storageRef);
      setPhotoURL('');
      setMessage('Image deleted. Click Save to apply.');
    } catch (err) {
      if (err.code === 'storage/object-not-found') {
        setPhotoURL('');
        setMessage('Image deleted. Click Save to apply.');
      } else {
        setError(getFriendlyErrorMessage(err.code) || err.message);
      }
    }
  };

  const handleChangePassword = () => {
    setShowConfirm(true);
  };

  const confirmChangePassword = async () => {
    setShowConfirm(false);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage(getSuccessMessage('change-password'));
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <>
      <Dialog 
        open={true} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          }
        }}
      >
        <DialogTitle>Account Information</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Profile Picture */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                {photoURL ? (
                  <Avatar
                    src={photoURL}
                    alt="Profile"
                    sx={{ width: 100, height: 100 }}
                    imgProps={{
                      referrerPolicy: "no-referrer",
                      crossOrigin: "anonymous"
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}>
                    <AccountCircleIcon sx={{ fontSize: 80 }} />
                  </Avatar>
                )}
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    right: -5,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'primary.dark' },
                  }}
                  size="small"
                  onClick={() => fileInputRef.current.click()}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  size="small" 
                  onClick={() => fileInputRef.current.click()}
                  sx={{ textTransform: 'none' }}
                >
                  {photoURL ? 'Replace' : 'Add image'}
                </Button>
                {photoURL && (
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={handleDeletePhoto}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>

            {/* Email (read-only) */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email
              </Typography>
              <Typography variant="body1">{user.email}</Typography>
            </Box>

            {/* Display Name */}
            <TextField
              label="Name"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            {/* Change Password */}
            <Button 
              variant="outlined" 
              onClick={handleChangePassword}
              sx={{ textTransform: 'none' }}
            >
              Change Password
            </Button>

            {/* Error/Success Messages */}
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {message && (
              <Alert severity="success" onClose={() => setMessage('')}>
                {message}
              </Alert>
            )}

            {/* More Account Settings (collapsible) */}
            <Box>
              <Button 
                onClick={() => setShowDelete(!showDelete)}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                {showDelete ? 'Hide' : 'More Account Settings'}
              </Button>
              <Collapse in={showDelete}>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleDeleteAccount}
                    sx={{ textTransform: 'none' }}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            sx={{ textTransform: 'none' }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {showConfirm && (
        <ConfirmModal
          message={`Send a password reset email to ${user.email}?`}
          onConfirm={confirmChangePassword}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
