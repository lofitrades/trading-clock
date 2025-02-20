/* src/components/AuthModal.jsx */
import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  sendEmailVerification,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFriendlyErrorMessage, getSuccessMessage } from '../utils/messages';
import ForgotPasswordModal from './ForgotPasswordModal';
import './login-signup.css';

function ActivationModal({ onClose }) {
  return (
    <div className="ls-modal-overlay" onClick={onClose}>
      <div className="ls-modal-content" onClick={(e) => e.stopPropagation()}>
        <p>Please follow the steps we send via email to activate your account.</p>
        <button className="primary-button" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export default function AuthModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);

  const handleOverlayClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Social login remains unchanged.
  const handleSocialLogin = async (providerType) => {
    setErrorMsg('');
    setSuccessMsg('');
    let provider;
    try {
      if (providerType === 'google') provider = new GoogleAuthProvider();
      else if (providerType === 'facebook') provider = new FacebookAuthProvider();
      else if (providerType === 'twitter') provider = new TwitterAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMsg(getSuccessMessage('login'));
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err.code));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check if email is verified before proceeding.
        if (!userCredential.user.emailVerified) {
          setErrorMsg("Please verify your email address before logging in.");
          await signOut(auth);
          return;
        }
        setSuccessMsg(getSuccessMessage('login'));
        setTimeout(() => onClose(), 1000);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccessMsg(getSuccessMessage('signup'));
        setShowActivationModal(true);
      }
    } catch (err) {
      const code = err.code;
      // Automatically sign up if user is not found in login view.
      if (isLogin && code === 'auth/user-not-found') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(userCredential.user);
          setSuccessMsg('No account was found, so we created one for you.');
          setShowActivationModal(true);
        } catch (signUpErr) {
          setErrorMsg(getFriendlyErrorMessage(signUpErr.code));
        }
      } else if (!isLogin && code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          setSuccessMsg('That email is already registered. You have been logged in.');
          setTimeout(() => onClose(), 1500);
        } catch (signInErr) {
          setErrorMsg(getFriendlyErrorMessage(signInErr.code));
        }
      } else {
        setErrorMsg(getFriendlyErrorMessage(code));
      }
    }
  };

  if (showForgotModal) {
    return <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />;
  }

  return (
    <>
      <div className="ls-modal-overlay" onClick={handleOverlayClick}>
        <div className="ls-modal-content" onClick={stopPropagation}>
          <div className="container">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <h2 style={{ textAlign: 'center' }}>
                  {isLogin ? 'Login to access all Pro★ Features' : 'Create a free account to access all Pro★ Features'}
                </h2>
                <div className="vl">
                  <span className="vl-innertext">or</span>
                </div>
                <div className="col">
                  <div className="social-buttons">
                    <a href="#" className="fb btn" onClick={() => handleSocialLogin('facebook')}>
                      <i className="fa fa-facebook fa-fw"></i> Login with Facebook
                    </a>
                    <a href="#" className="twitter btn" onClick={() => handleSocialLogin('twitter')}>
                      <i className="fa fa-times fa-fw"></i> Login with X
                    </a>
                    <a href="#" className="google btn" onClick={() => handleSocialLogin('google')}>
                      <i className="fa fa-google fa-fw"></i> Login with Google+
                    </a>
                  </div>
                </div>
                <div className="col">
                  <div className="hide-md-lg">
                    <p>Or sign in manually:</p>
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <input type="submit" value={isLogin ? "Login" : "Create free account"} />
                </div>
              </div>
            </form>
          </div>
          {errorMsg && <p className="ls-error">{errorMsg}</p>}
          {successMsg && <p className="ls-success">{successMsg}</p>}
          <div className="bottom-container">
            <div className="row">
              <div className="col">
                <a href="#" style={{ color: 'white' }} className="btn" onClick={toggleMode}>
                  {isLogin ? 'Sign up' : 'Login'}
                </a>
              </div>
              <div className="col">
                <a href="#" style={{ color: 'white' }} className="btn" onClick={() => setShowForgotModal(true)}>
                  Forgot password?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showActivationModal && (
        <ActivationModal onClose={() => { setShowActivationModal(false); onClose(); }} />
      )}
    </>
  );
}
