# 🔧 Firebase Configuration Guide for Passwordless Auth

**Step-by-step guide to configure Firebase for magic link authentication**

---

## 📋 Prerequisites

- Firebase project already created ✅
- Firebase SDK installed ✅
- Firebase config in `src/firebase.js` ✅

---

## 🔑 Enable Email Link Authentication

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com/
2. Select your project: **Time 2 Trade**
3. Navigate to **Authentication** in left sidebar

### Step 2: Enable Email/Password Provider
1. Click **Sign-in method** tab
2. Find **Email/Password** in the list
3. Click the pencil icon (Edit)
4. **Enable** the toggle switch
5. **Enable "Email link (passwordless sign-in)"** toggle
6. Click **Save**

**Screenshot reference:**
```
┌─────────────────────────────────────────┐
│ Sign-in providers                       │
├─────────────────────────────────────────┤
│ Email/Password              [Enabled ✓] │
│   ☑ Enable                              │
│   ☑ Email link (passwordless sign-in)  │ ← Enable this!
│                                          │
│                    [Cancel]    [Save]   │
└─────────────────────────────────────────┘
```

---

## 🌐 Configure Authorized Domains

### Step 3: Add Domains
1. Still in **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Add these domains:

**For Development:**
- `localhost` (should be there by default)

**For Production:**
- `lofitrades.github.io` (your GitHub Pages domain)
- Any custom domains you use

**How to add:**
1. Click **Add domain**
2. Enter domain name
3. Click **Add**

---

## 📧 Customize Email Templates

### Important: Email Link Auth Uses Default Templates

**Email link authentication does NOT have a dedicated template in the Firebase Console.** 

Unlike password reset or email verification, passwordless sign-in uses Firebase's **default email template** which includes:
- A timestamp in the subject/body (prevents email threading)
- The sign-in link
- Basic branding

**You CANNOT customize the email link template through the Firebase Console Templates section.**

### What You CAN Do:

1. **Use Custom SMTP** (Firebase Blaze plan required):
   - Set up custom email sending through SendGrid, Mailgun, etc.
   - Full control over email design
   - Better deliverability

2. **Configure Domain** (for better branding):
   - Go to Authentication → Settings
   - Set up custom domain for email links
   - Makes links look more professional

3. **Customize the Link Domain**:
   ```javascript
   const actionCodeSettings = {
     url: 'https://your-custom-domain.com/login',
     handleCodeInApp: true,
     // Optional: Use Firebase Hosting custom domain
     linkDomain: 'custom-domain.com'
   };
   ```

### Default Email Template Languages

Firebase provides default templates in 20+ languages:
- English, Spanish, French, German, Japanese, Chinese, etc.
- Automatically detects user's language
- No configuration needed

**Don't waste time looking for "Email address sign-in" template - it doesn't exist!**

---

## � Handling Users with Multiple Sign-In Methods

### The Problem
A user signs in with Google, then later tries to use email link with the same email.

### How It Works

**Firebase's Behavior:**
1. **First sign-in** (Google): Creates account with email `user@example.com`
2. **Second sign-in** (Email link with same email): 
   - Firebase **links** the email provider to existing account
   - User can now sign in with EITHER Google OR email link
   - No duplicate accounts created ✅

**Our Implementation:**
We check for existing sign-in methods and warn users:

```javascript
// Before sending email link
const signInMethods = await fetchSignInMethodsForEmail(auth, email);

if (signInMethods.length > 0 && !signInMethods.includes('emailLink')) {
  // User has Google/Facebook/etc. - warn them
  const providers = signInMethods.map(method => {
    if (method.includes('google')) return 'Google';
    // ... etc
  });
  
  setErrorMsg(`This email is registered with ${providers}. 
    Please use that method to sign in.`);
}
```

### What Happens in Each Scenario

**Scenario 1: New User (Email Link)**
- User enters email → Link sent → Clicks link → Account created ✅
- `getAdditionalUserInfo(result).isNewUser === true`

**Scenario 2: Existing User Returns (Email Link)**
- User enters email → Link sent → Clicks link → Signed in ✅
- `getAdditionalUserInfo(result).isNewUser === false`

**Scenario 3: Google User Tries Email Link**
- User enters email → **Warning shown:** "Email registered with Google"
- User should use Google button instead
- OR: We can allow it and Firebase will link accounts automatically

**Scenario 4: Email Link User Tries Google**
- User clicks Google → Google popup → Firebase **links** providers ✅
- User can now use EITHER method

### Enabling Automatic Account Linking

If you want to allow users to add email link to existing Google accounts:

```javascript
// Remove the check in handleSubmit
// Firebase will automatically link the accounts

// After email link sign-in
const result = await signInWithEmailLink(auth, email, url);
// Firebase has now linked email to existing Google account
```

### Manual Account Linking (Advanced)

For explicit control:

```javascript
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';

// If user is signed in with Google and clicks email link
const credential = EmailAuthProvider.credentialWithLink(
  email, 
  window.location.href
);

await linkWithCredential(auth.currentUser, credential);
// Email link is now linked to Google account
```

---

## 🔐 Configure Security Rules

### Step 6: Firestore Rules (if using)
Make sure your Firestore rules allow user document creation:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 7: Authentication Rules
1. Go to **Authentication** → **Settings**
2. Scroll to **User actions**
3. Configure:
   - **Email enumeration protection**: ON (recommended)
   - **Account existence checks**: Allow (optional)

---

## 🎯 Action Code Settings

### Step 8: Configure Link Behavior
In your code (`LoginPage.jsx` and `AuthModal.jsx`):

```javascript
const actionCodeSettings = {
  // URL you want to redirect back to
  url: window.location.origin + '/login',
  
  // This must be true for email link sign-in
  handleCodeInApp: true,
  
  // Optional: iOS and Android settings
  iOS: {
    bundleId: 'com.example.ios'
  },
  android: {
    packageName: 'com.example.android',
    installApp: true,
    minimumVersion: '12'
  },
  
  // Optional: Dynamic link domain
  dynamicLinkDomain: 'example.page.link'
};
```

**Current implementation:**
```javascript
// Simple version (currently in code)
const actionCodeSettings = {
  url: window.location.href, // or `${window.location.origin}/login`
  handleCodeInApp: true,
};
```

---

## 🧪 Testing Configuration

### Step 9: Test Email Link Flow

**Test 1: Send Email**
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:5173/login
3. Enter your email
4. Click "Send Magic Link"
5. Check your email inbox

**Test 2: Click Link**
1. Open email from Firebase
2. Click the magic link
3. Should redirect to your app
4. Should see "Verifying..." modal
5. Should sign in successfully

**Test 3: Error Cases**
- Try expired link (wait 60 mins)
- Try using link twice
- Try on different device/browser
- Try with invalid email

---

## 🐛 Troubleshooting

### Issue: Emails Not Sending
**Possible causes:**
1. Email provider not enabled
2. Passwordless toggle not enabled
3. Domain not authorized
4. Invalid email format
5. **MOST COMMON:** `localhost` not in authorized domains (projects after April 2025)

**Solution:**
```
1. Go to Firebase Console → Authentication → Sign-in method
2. Verify "Email/Password" is enabled
3. Verify "Email link (passwordless sign-in)" toggle is ON
4. Go to Settings tab → Authorized domains
5. Add "localhost" if testing locally
6. Add your production domain
7. Check spam folder
8. Try different email address
```

**Test if Firebase is sending:**
```javascript
// Add detailed error logging
sendSignInLinkToEmail(auth, email, actionCodeSettings)
  .then(() => {
    console.log('✅ Email link sent successfully');
  })
  .catch((error) => {
    console.error('❌ Send email error:', error.code, error.message);
    // Check the specific error code
  });
```

**Common error codes:**
- `auth/invalid-email`: Email format is wrong
- `auth/unauthorized-continue-uri`: Domain not authorized
- `auth/missing-continue-uri`: actionCodeSettings.url missing
- `auth/invalid-continue-uri`: URL format is wrong

### Issue: Can't Find Email Template
**This is NORMAL!** 

Email link auth doesn't have a customizable template in Firebase Console.

**What to do:**
- Accept the default template (it works fine)
- OR set up custom SMTP (advanced)
- OR use Firebase Hosting custom domain for better branding

### Issue: Link Not Working
**Possible causes:**
1. Link expired (60 min timeout)
2. Link already used (one-time use)
3. Domain mismatch
4. Wrong URL in actionCodeSettings

**Solution:**
- Request new link
- Check URL configuration
- Verify authorized domains
- Check browser console for errors

### Issue: "Invalid action code"
**Possible causes:**
1. Link copied incorrectly
2. Link modified by email client
3. Link expired
4. Firebase config mismatch

**Solution:**
- Request new link
- Use "Plain text" email view
- Copy entire URL carefully
- Check Firebase project ID

### Issue: Email Stored but Not Retrieved
**Possible causes:**
1. localStorage cleared
2. Different browser/device
3. Private/incognito mode
4. localStorage disabled

**Solution:**
- Prompt user for email confirmation
- Use the prompt fallback (already implemented)
- Encourage same-device usage

---

## 📊 Monitoring & Analytics

### Step 10: Monitor Authentication
1. Go to **Authentication** → **Users** tab
2. Watch for new sign-ins
3. Check **Usage** tab for metrics
4. Review **Error logs** for issues

**Metrics to track:**
- Sign-in attempts
- Successful sign-ins
- Failed attempts
- Email verification rate
- Link click rate

---

## 🔐 Security Best Practices

### Email Link Security
✅ **DO:**
- Use HTTPS in production
- Expire links after 60 minutes
- One-time use links
- Verify email ownership
- Log authentication attempts
- Monitor for abuse

❌ **DON'T:**
- Share links publicly
- Use HTTP in production
- Allow infinite link reuse
- Skip email verification
- Ignore error logs

### Additional Security
Consider adding:
- **Rate limiting**: Prevent spam
- **CAPTCHA**: Prevent bots
- **MFA**: Multi-factor authentication
- **IP monitoring**: Detect abuse
- **Session management**: Secure tokens

---

## 🎨 Branding Customization

### Email Appearance
Customize in Firebase Console → Authentication → Templates:
- **Logo**: Add your company logo URL
- **Colors**: Match brand colors
- **Footer**: Add social links, address
- **Language**: Multi-language support

### Email Service Provider
Firebase uses:
- **Default**: Google's SMTP
- **Custom**: Connect SendGrid, Mailgun, etc.

---

## 🌍 Localization

### Multi-Language Support
1. Go to **Authentication** → **Templates**
2. Click **Manage languages**
3. Add languages:
   - English (default)
   - Spanish
   - French
   - etc.

4. Translate each template
5. Firebase auto-detects user language

---

## 📱 Mobile App Configuration

### iOS Setup
```javascript
iOS: {
  bundleId: 'com.lofitrades.tradingclock'
}
```

### Android Setup
```javascript
android: {
  packageName: 'com.lofitrades.tradingclock',
  installApp: true,
  minimumVersion: '1.0'
}
```

### Dynamic Links
For better mobile experience:
1. Set up Firebase Dynamic Links
2. Configure domain
3. Update actionCodeSettings
4. Test on mobile devices

---

## ✅ Configuration Checklist

### Firebase Console
- [ ] Email/Password provider enabled
- [ ] Email link (passwordless) toggle ON
- [ ] Authorized domains added
- [ ] Email template customized
- [ ] Test email sent and verified
- [ ] Security rules configured
- [ ] Email enumeration protection ON

### Code Configuration
- [ ] actionCodeSettings correct
- [ ] URL redirects to /login
- [ ] handleCodeInApp is true
- [ ] Email stored in localStorage
- [ ] Email link detection works
- [ ] Sign-in completes successfully
- [ ] LocalStorage cleared after sign-in

### Testing
- [ ] Send email works
- [ ] Email received in inbox
- [ ] Link clicks work
- [ ] Sign-in successful
- [ ] Redirect to home works
- [ ] Error handling works
- [ ] Mobile responsive

---

## 🚀 Production Deployment

### Before Going Live
1. **Update domains:**
   - Add production domain to authorized list
   - Update actionCodeSettings URL
   - Test on production domain

2. **Email templates:**
   - Professional from name
   - Branded email design
   - Correct reply-to address
   - Legal footer (if required)

3. **Security:**
   - Enable all protection features
   - Set up monitoring
   - Configure alerts
   - Review security rules

4. **Testing:**
   - Test all authentication flows
   - Test on multiple devices
   - Test error scenarios
   - Load testing (if high traffic expected)

---

## 📞 Support Resources

### Firebase Documentation
- [Email Link Auth Docs](https://firebase.google.com/docs/auth/web/email-link-auth)
- [Auth Best Practices](https://firebase.google.com/docs/auth/web/best-practices)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

### Community Help
- [Firebase Slack](https://firebase.community/)
- [Stack Overflow - Firebase Tag](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase GitHub Issues](https://github.com/firebase/firebase-js-sdk/issues)

### Professional Support
- [Firebase Support](https://firebase.google.com/support)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

## 💡 Tips & Tricks

### Improve Deliverability
1. **SPF/DKIM**: Set up email authentication
2. **Custom domain**: Use your own sending domain
3. **Warm up**: Gradually increase volume
4. **Monitor bounces**: Check bounce rates

### User Experience
1. **Clear messaging**: Explain magic link process
2. **Fast delivery**: Email should arrive in seconds
3. **Mobile-friendly**: Email looks good on mobile
4. **One-click**: Minimal friction

### Conversion Optimization
1. **A/B testing**: Test different email copy
2. **Analytics**: Track conversion rates
3. **Optimize timing**: Send at optimal times
4. **Follow-up**: Reminder if link not clicked

---

**Configuration Complete! 🎉**

Your passwordless authentication system is now ready to use. Test thoroughly before production deployment.

For implementation details, see [AUTH_REDESIGN_COMPLETE.md](./AUTH_REDESIGN_COMPLETE.md)

For testing procedures, see [AUTH_TESTING_GUIDE.md](./AUTH_TESTING_GUIDE.md)

---

**Last Updated:** December 16, 2025  
**Version:** 2.0.0
