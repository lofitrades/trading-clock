/* src/components/ConfirmModal.jsx */
import React from 'react';
import './login-signup.css';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="ls-modal-overlay" onClick={onCancel}>
      <div className="ls-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center' }}>Please Confirm</h2>
        <p style={{ textAlign: 'center' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
          <button className="primary-button" onClick={onConfirm}>Confirm</button>
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
