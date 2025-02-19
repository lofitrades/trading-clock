// src/components/UnlockModal.jsx
import React from 'react';
import './login-signup.css';

export default function UnlockModal({ onClose, onSignUp }) {
  return (
    <div className="ls-modal-overlay">
      <div className="ls-modal-content">
        <form className="ls-form" style={{ textAlign: 'center' }}>
          <h2>Unlock Pro★ Features for free: $0</h2>
          <p>Create a free account to unlock full access to the pro features, including changing timezones and accessing premium settings.</p>
          <button type="button" className="ls-button" onClick={onSignUp}>
            Create Free Account
          </button>
          <p className="ls-link">
            <span className="ls-link" onClick={onClose}>Close</span>
          </p>
        </form>
      </div>
    </div>
  );
}
