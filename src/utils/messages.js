/* src/utils/messages.js */
export function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset it.';
      case 'auth/user-not-found':
        return 'No account found with that email. Please sign up first.';
      case 'auth/email-already-in-use':
        return 'That email is already registered. You have been logged in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'Your account is currently disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An unexpected error occurred. Please try again or use another method.';
    }
  }
  
  export function getSuccessMessage(type) {
    switch (type) {
      case 'login':
        return 'Welcome back! You have successfully logged in.';
      case 'signup':
        return 'Your account was created! A verification email was sent to you.';
      case 'verify-email':
        return 'We’ve sent a verification email. Please check your inbox.';
      case 'password-reset':
        return 'We’ve sent a password reset link to your email.';
      case 'profile-updated':
        return 'Profile updated successfully!';
      case 'change-password':
        return 'A password reset email has been sent. Please check your inbox.';
      default:
        return 'Success!';
    }
  }
  