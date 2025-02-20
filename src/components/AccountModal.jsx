/* src/components/AccountModal.jsx */
import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile, deleteUser, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ConfirmModal from './ConfirmModal';
import './login-signup.css';
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
      setMessage('Photo deleted. Click Save to apply.');
    } catch (err) {
      if (err.code === 'storage/object-not-found') {
        setPhotoURL('');
        setMessage('No photo found. Click Save to apply.');
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
    <div className="ls-modal-overlay" onClick={handleOverlayClick}>
      <div className="ls-modal-content account-modal" onClick={stopPropagation}>
        <form className="ls-form">
          <h2>Account Information</h2>
          {error && <p className="ls-error">{error}</p>}
          {message && <p className="ls-success">{message}</p>}

          {/* Email */}
          <div className="ls-gap">
            <label className="ls-label">Email:</label>
            <span>{user.email}</span>
          </div>

          {/* Profile Picture (moved above Name input) */}
          <div className="ls-gap">
            <label className="ls-label">Profile Picture:</label>
            <div style={{ marginBottom: '10px' }}>
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Profile"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '60px' }}>
                  account_circle
                </span>
              )}
            </div>
            {/* Hidden file input & link to trigger it */}
            <span className="ls-link" onClick={() => fileInputRef.current.click()}>
              {photoURL ? 'Replace image' : 'Add image'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            {/* Delete Photo link if photo exists */}
            {photoURL && (
              <>
                {' | '}
                <span className="ls-link" onClick={handleDeletePhoto}>
                  Delete Photo
                </span>
              </>
            )}
          </div>

          {/* User Name */}
          <div className="ls-gap">
            <label className="ls-label">Name:</label>
            <input
              className="ls-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* Change Password */}
          <div className="ls-gap">
            <span className="ls-link" onClick={handleChangePassword}>
              Change Password
            </span>
          </div>

          {/* Buttons: Save (primary) / Cancel (secondary) */}
          <div className="ls-gap">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={handleSave} style={{ marginLeft: '10px' }}>
              Save
            </button>
          </div>

          {/* More Account Settings / Hide -> Delete Account */}
          <div className="ls-gap">
            <span className="ls-link" onClick={() => setShowDelete(!showDelete)}>
              {showDelete ? 'Hide' : 'More Account Settings'}
            </span>
            {showDelete && (
              <div className="ls-gap">
                <button
                  type="button"
                  className="secondary-button"
                  style={{ borderColor: 'red', color: 'red' }}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {showConfirm && (
        <ConfirmModal
          message={`Send a password reset email to ${user.email}?`}
          onConfirm={confirmChangePassword}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
