/**
 * EMAIL LINK DIAGNOSTIC TOOL
 * Temporary component for testing email link authentication
 * 
 * HOW TO USE:
 * 1. Import this component in App.jsx
 * 2. Add <EmailLinkTest /> at the top of your app
 * 3. Click "Test Email Link" button
 * 4. Check browser console for detailed logs
 * 5. Remove this component once working
 */

import { useState } from 'react';
import { Box, Button, TextField, Alert, Typography, Paper } from '@mui/material';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function EmailLinkTest() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const runDiagnostics = () => {
    console.log('\n🔍 ===== FIREBASE EMAIL LINK DIAGNOSTICS =====\n');
    
    console.log('📍 Current Location:');
    console.log('  - URL:', window.location.href);
    console.log('  - Hostname:', window.location.hostname);
    console.log('  - Protocol:', window.location.protocol);
    console.log('  - Port:', window.location.port);
    
    console.log('\n🔥 Firebase Config:');
    console.log('  - Auth:', !!auth);
    console.log('  - Auth Domain:', auth?.config?.apiHost);
    console.log('  - Current User:', auth?.currentUser?.email || 'None');
    
    console.log('\n💾 LocalStorage:');
    console.log('  - emailForSignIn:', localStorage.getItem('emailForSignIn'));
    console.log('  - isNewUser:', localStorage.getItem('isNewUser'));
    
    console.log('\n⚙️ Environment:');
    console.log('  - Mode:', import.meta.env.MODE);
    console.log('  - Base URL:', import.meta.env.BASE_URL);
    
    console.log('\n✅ DIAGNOSTICS COMPLETE\n');
  };

  const testEmailLink = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setStatus('');
    setError('');
    runDiagnostics();

    console.log('\n🚀 ===== TESTING EMAIL LINK SEND =====\n');
    console.log('📧 Test Email:', email);

    const actionCodeSettings = {
      // Use production URL when deployed, localhost for development
      url: window.location.hostname === 'localhost'
        ? 'http://localhost:5173/trading-clock/'
        : 'https://lofitrades.github.io/trading-clock/',
      handleCodeInApp: true,
    };

    console.log('📋 ActionCodeSettings:', JSON.stringify(actionCodeSettings, null, 2));

    try {
      console.log('⏳ Calling sendSignInLinkToEmail...');
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      console.log('✅ SUCCESS! Email link sent!');
      console.log('📬 Check your email:', email);
      console.log('💾 Saving email to localStorage...');
      
      localStorage.setItem('emailForSignIn', email);
      
      setStatus(`✅ SUCCESS! Email sent to ${email}. Check your inbox (and spam folder).`);
      
      console.log('\n🎉 ===== EMAIL SENT SUCCESSFULLY =====\n');
      
    } catch (error) {
      console.error('\n❌ ===== ERROR SENDING EMAIL =====\n');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Full Error:', error);
      
      let errorMessage = `❌ ERROR: ${error.code}\n`;
      
      if (error.code === 'auth/unauthorized-continue-uri') {
        errorMessage += '\n⚠️ DOMAIN NOT AUTHORIZED!\n\n';
        errorMessage += '🔧 FIX THIS:\n';
        errorMessage += '1. Go to: https://console.firebase.google.com/\n';
        errorMessage += '2. Select your project\n';
        errorMessage += '3. Authentication → Settings → Authorized domains\n';
        errorMessage += `4. Click "Add domain"\n`;
        errorMessage += `5. Add: ${window.location.hostname}\n`;
        errorMessage += '6. Save and try again\n';
        
        console.error('\n🔧 TO FIX:');
        console.error('Add this domain to Firebase Console → Authentication → Settings → Authorized domains:');
        console.error('Domain to add:', window.location.hostname);
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += '\n📧 Invalid email format';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage += '\n⚠️ EMAIL LINK AUTH NOT ENABLED!\n\n';
        errorMessage += '🔧 FIX THIS:\n';
        errorMessage += '1. Go to: https://console.firebase.google.com/\n';
        errorMessage += '2. Authentication → Sign-in method\n';
        errorMessage += '3. Enable "Email/Password"\n';
        errorMessage += '4. Enable "Email link (passwordless sign-in)"\n';
        errorMessage += '5. Save and try again\n';
      }
      
      setError(errorMessage);
      console.error('\n' + errorMessage);
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        top: 60, 
        right: 20, 
        p: 3, 
        zIndex: 9999,
        maxWidth: 400,
        border: '2px solid #ff9800',
        bgcolor: '#fff3e0'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: '#e65100' }}>
        🧪 Email Link Test Tool
      </Typography>
      
      <Typography variant="caption" display="block" gutterBottom>
        Temporary diagnostic tool. Remove after testing.
      </Typography>
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          type="email"
          label="Test Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button 
          variant="contained" 
          size="small"
          onClick={testEmailLink}
          fullWidth
        >
          Test Email Link
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          onClick={runDiagnostics}
        >
          Diagnostics
        </Button>
      </Box>
      
      {status && (
        <Alert severity="success" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
          {status}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
        📝 Check browser console (F12) for detailed logs
      </Typography>
    </Paper>
  );
}
