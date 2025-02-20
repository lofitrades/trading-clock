/* src/components/ForgotPasswordModal.jsx */
import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import './login-signup.css';

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleOverlayClick = () => {
    onClose();
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        setError('No account exists with that email.');
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setMessage(getSuccessMessage('password-reset'));
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
    }
  };

  return (
    <div className="ls-modal-overlay" onClick={handleOverlayClick}>
      <div className="ls-modal-content" onClick={stopPropagation}>
        <form className="ls-form" onSubmit={handleReset}>
          <h2>Forgot Password</h2>
          {error && <p className="ls-error">{error}</p>}
          {message && <p className="ls-success">{message}</p>}
          <div>
            <label className="ls-label">Email</label>
            <input
              className="ls-input"
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ls-button">Reset Password</button>
          <p className="ls-link">
            <span className="ls-link" onClick={onClose}>Close</span>
          </p>
        </form>
      </div>
    </div>
  );
}
