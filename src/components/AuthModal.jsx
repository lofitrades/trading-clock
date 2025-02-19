// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
} from 'firebase/auth';
import './login-signup.css';

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSocialLogin = async (providerType) => {
    let provider;
    try {
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else if (providerType === 'facebook') {
        provider = new FacebookAuthProvider();
      } else if (providerType === 'twitter' || providerType === 'x') {
        provider = new TwitterAuthProvider();
      }
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="ls-modal-overlay">
      <div className="ls-modal-content">
        <form className="ls-form" onSubmit={handleEmailAuth}>
          <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          {error && <p className="ls-error">{error}</p>}
          <div>
            <label className="ls-label">Email</label>
            <input
              className="ls-input"
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="ls-label">Password</label>
            <input
              className="ls-input"
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ls-button">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
          <p className="ls-link">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <span className="ls-link" onClick={toggleMode}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </p>
          <p className="ls-link">Or with</p>
          <div className="ls-social-buttons">
            <button type="button" className="ls-social-button ls-social-google" onClick={() => handleSocialLogin('google')}>
              Google
            </button>
            <button type="button" className="ls-social-button ls-social-facebook" onClick={() => handleSocialLogin('facebook')}>
              Facebook
            </button>
            <button type="button" className="ls-social-button ls-social-twitter" onClick={() => handleSocialLogin('twitter')}>
              X
            </button>
          </div>
          <p className="ls-link">
            <span className="ls-link" onClick={onClose}>Close</span>
          </p>
        </form>
      </div>
    </div>
  );
}
