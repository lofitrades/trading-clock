// src/components/AccountModal.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import { updateProfile, updatePassword, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './login-signup.css';

export default function AccountModal({ onClose, user }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [about, setAbout] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile(user, { displayName, photoURL });
      if (newPassword) {
        await updatePassword(user, newPassword);
      }
      await setDoc(
        doc(db, 'users', user.uid),
        { displayName, photoURL, about },
        { merge: true }
      );
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteUser(user);
      } catch (err) {
        setMessage(err.message);
      }
    }
  };

  return (
    <div className="ls-modal-overlay">
      <div className="ls-modal-content">
        <form className="ls-form">
          <h2>Account Information</h2>
          <div className="ls-gap">
            <label className="ls-label">Email:</label>
            <span>{user.email}</span>
          </div>
          <div>
            <label className="ls-label">User Name:</label>
            <input
              className="ls-input"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="ls-label">Profile Picture URL:</label>
            <input
              className="ls-input"
              type="text"
              value={photoURL}
              onChange={e => setPhotoURL(e.target.value)}
            />
          </div>
          <div>
            <label className="ls-label">About Me:</label>
            <textarea
              className="ls-textarea"
              value={about}
              onChange={e => setAbout(e.target.value)}
            />
          </div>
          <div>
            <label className="ls-label">New Password (if you wish to change):</label>
            <input
              className="ls-input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          {message && <p className="ls-success">{message}</p>}
          <button type="button" className="ls-button" onClick={handleSave}>Save</button>
          <button type="button" className="ls-button" onClick={onClose}>Cancel</button>
          <div className="ls-gap">
            <span className="ls-link" onClick={handleLogout}>Log out</span>
          </div>
          <div className="ls-gap">
            <span className="ls-link" onClick={() => setShowDelete(!showDelete)}>
              {showDelete ? 'Hide' : 'More Account Settings'}
            </span>
            {showDelete && (
              <div className="ls-gap">
                <button type="button" className="ls-button" style={{ backgroundColor: 'red' }} onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
