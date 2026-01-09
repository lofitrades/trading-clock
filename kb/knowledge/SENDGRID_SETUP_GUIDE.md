# SendGrid Magic Link Email Setup Guide

**Version:** 1.0.0  
**Date:** January 8, 2026  
**Purpose:** Setup SendGrid to send magic links from `noreply@time2.trade` instead of Firebase's firebaseapp.com

---

## 📋 Quick Setup (5 minutes)

### Step 1: Create SendGrid Free Account

1. Go to https://sendgrid.com
2. Click **Sign up** 
3. Fill in form with:
   - Email: Your admin email
   - Password: Strong password
   - Company: Lofi Trades
   - Accept terms
4. Click **Create Account**
5. Verify your email in the confirmation link

---

### Step 2: Create API Key

1. Log in to SendGrid dashboard
2. Navigate to **Settings → API Keys** (left sidebar)
3. Click **Create API Key** (top right)
4. Fill in:
   - **Name:** `Time2Trade_Firebase_Magic_Links`
   - **API Key Permissions:** Select **Full Access** (for simplicity)
5. Click **Create & View**
6. **COPY THE API KEY** (you'll only see it once!)
   - Format: `SG.xxx...xxx`
   - Save it securely in Firebase environment variables

---

### Step 3: Verify Sender Domain

1. In SendGrid dashboard, go to **Settings → Sender Authentication**
2. Click **Verify a Domain** (or your existing time2.trade domain)
3. Enter domain: `time2.trade`
4. SendGrid will generate **CNAME records** (3 records)
5. Add these records to your DNS provider (same place where you host time2.trade):
   - Copy each CNAME record
   - Add to your DNS provider's settings
   - Wait 5-15 minutes for DNS propagation
6. Click **Verify** in SendGrid once DNS is updated
7. Status should show as **Verified** ✓

---

### Step 4: Add API Key to Firebase

#### Option A: Firebase Console (Easiest)

1. Go to **Firebase Console → Functions**
2. Select your project
3. Click **Environment variables** or settings
4. Add new variable:
   - **Name:** `SENDGRID_API_KEY`
   - **Value:** `SG.xxx...xxx` (from Step 2)
5. Save

#### Option B: Firebase CLI (If using emulator)

Create `.env` file in `functions/` directory:

```bash
SENDGRID_API_KEY=SG.xxx...xxx
```

**⚠️ IMPORTANT:** Never commit `.env` to git!

---

### Step 5: Install Dependencies

```bash
# In functions directory
cd functions
npm install @sendgrid/mail
npm run build
```

---

### Step 6: Deploy Cloud Function

```bash
# From root directory
firebase deploy --only functions
```

This deploys:
- `sendMagicLink()` - HTTP endpoint for sending magic links
- Updated `functions/src/index.ts` with SendGrid integration

---

### Step 7: Test Magic Link

1. Start the app: `npm run dev`
2. Go to login page
3. Enter your email
4. Click "Send magic link"
5. Check your email inbox (or spam folder)
6. Email should be from: `noreply@time2.trade` ✓

---

## 🔍 Troubleshooting

### Issue: "Failed to send magic link"

**Cause 1:** API key not configured  
**Solution:** 
- Go to Firebase Console → Functions → Runtime settings
- Verify `SENDGRID_API_KEY` is set
- Redeploy: `firebase deploy --only functions`

**Cause 2:** SendGrid account not verified  
**Solution:**
- Check SendGrid dashboard → Account Overview
- Confirm email address is verified
- Verify domain is complete

**Cause 3:** Domain not verified in SendGrid  
**Solution:**
- Go to SendGrid → Settings → Sender Authentication
- Check domain status shows "Verified"
- If not, add CNAME records to DNS and wait 15 minutes

### Issue: Email in spam folder

**Solution:**
- This shouldn't happen with verified domain + SPF/DKIM
- Check SendGrid dashboard for bounce/spam reports
- Review email template in Cloud Function (looks good!)

### Issue: "Domain authorization failed"

**Cause:** Sender domain not in Firebase authorized domains  
**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Scroll to **Authorized domains**
3. Verify `time2.trade` is listed
4. If not, add it

---

## 📊 SendGrid Free Tier Limits

- **100 emails/day** (enough for most users)
- **Unlimited months** (truly free)
- **Full features** available

**When to upgrade:**
- If you exceed 100 emails/day regularly
- Pay-as-you-go starts at $19.95/month for up to 40,000 emails

---

## 🔐 Security Checklist

- [ ] API Key stored in Firebase environment variables (not in code)
- [ ] API Key never committed to git
- [ ] Domain verified in SendGrid with CNAME records
- [ ] Sender domain authorized in Firebase
- [ ] Email template includes unsubscribe/security notices
- [ ] Error messages don't leak sensitive info

---

## 📧 Email Template Customization

The Cloud Function sends branded HTML emails with:
- ✅ Professional design
- ✅ Clear call-to-action button
- ✅ Fallback copy/paste link
- ✅ Security notices
- ✅ Responsive mobile design
- ✅ Privacy/terms footer

To customize:
1. Edit `functions/src/services/sendgridEmailService.ts`
2. Modify the `htmlContent` variable (HTML email template)
3. Update sender name, subject, footer, etc.
4. Run `firebase deploy --only functions`

---

## 🚀 Monitoring

### Check Email Delivery

1. SendGrid Dashboard → **Activity Feed**
   - Shows all sent/failed emails
   - Click email to see delivery status
   - Check bounce/spam reports

### Monitor Function Logs

```bash
firebase functions:log
```

Look for:
- ✅ `✅ Magic link email sent` - Success
- ❌ `❌ Failed to send magic link email` - Error
- 📧 `✉️ Magic link generated` - Link created

### Test in Firebase Emulator

```bash
firebase emulators:start
# In another terminal:
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/us-central1/sendMagicLink \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "continueUrl": "http://localhost:5173/app",
    "isNewUser": true
  }'
```

---

## 🎯 What's Changed

### Frontend
- ✅ `src/utils/sendMagicLinkEmail.js` - New utility to call Cloud Function
- ✅ `src/components/AuthModal.jsx` - Uses Cloud Function instead of Firebase
- ✅ `src/components/AuthModal2.jsx` - Uses Cloud Function instead of Firebase
- ✅ `src/components/LoginPage.jsx` - Uses Cloud Function instead of Firebase
- ✅ Email messages now show `noreply@time2.trade` instead of firebaseapp.com

### Backend
- ✅ `functions/src/services/sendgridEmailService.ts` - New SendGrid integration
- ✅ `functions/src/index.ts` - New `sendMagicLink()` HTTP endpoint
- ✅ `functions/package.json` - Added `@sendgrid/mail` dependency

---

## 📞 Support

**SendGrid Support:**
- Documentation: https://docs.sendgrid.com/
- Help Center: https://support.sendgrid.com/

**Firebase Support:**
- Functions: https://firebase.google.com/docs/functions
- Authentication: https://firebase.google.com/docs/auth

---

## ✅ Checklist

Before going live:

- [ ] SendGrid account created and email verified
- [ ] Domain verified in SendGrid (CNAME records added to DNS)
- [ ] API key created and saved
- [ ] API key added to Firebase environment variables
- [ ] Dependencies installed: `npm install @sendgrid/mail`
- [ ] Cloud Function deployed: `firebase deploy --only functions`
- [ ] Frontend rebuilt: `npm run build`
- [ ] Test email sent and received successfully
- [ ] Email shows from `noreply@time2.trade`
- [ ] Email not in spam folder
- [ ] All auth flows tested (signup, login, new user)

---

**Setup Complete!** 🎉

Magic links are now being sent from your custom domain `noreply@time2.trade` instead of Firebase's firebaseapp.com, reducing spam folder placement.

For any issues, check the troubleshooting section above or review Cloud Function logs with `firebase functions:log`.
