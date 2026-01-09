# SendGrid Setup - Quick Reference

## 🚀 TL;DR - 8 Minute Setup

### 1️⃣ SendGrid Account (2 min)
```
https://sendgrid.com → Sign up → Verify email
Settings → API Keys → Create API Key (copy it!)
Settings → Sender Authentication → Verify time2.trade domain
Add CNAME records to DNS, wait 5-15 min
```

### 2️⃣ Firebase (1 min)
```
Firebase Console → Functions → Runtime settings
Add env var: SENDGRID_API_KEY = SG.xxx...
```

### 3️⃣ Deploy (2 min)
```bash
cd functions && npm install
npm run build
firebase deploy --only functions
npm run build  # rebuild frontend
```

### 4️⃣ Test (1 min)
- Go to login page
- Enter your email
- Check inbox for email from `noreply@time2.trade` ✓

---

## 📋 Files Changed

**Created:**
- `functions/src/services/sendgridEmailService.ts` - SendGrid integration
- `src/utils/sendMagicLinkEmail.js` - Frontend utility
- `functions/.env.template` - Config template
- `kb/knowledge/SENDGRID_SETUP_GUIDE.md` - Full setup guide

**Updated:**
- `functions/src/index.ts` - New `sendMagicLink()` endpoint
- `functions/package.json` - Added `@sendgrid/mail`
- `src/components/AuthModal.jsx` - Uses Cloud Function
- `src/components/AuthModal2.jsx` - Uses Cloud Function
- `src/components/LoginPage.jsx` - Uses Cloud Function

---

## ✅ Verification Checklist

- [ ] Email received from `noreply@time2.trade`
- [ ] Email NOT in spam folder
- [ ] Clicking link signs user in
- [ ] Works on signup and login
- [ ] Works on all auth modal variations
- [ ] Cloud Function logs show success

---

## 🐛 If Something Breaks

**Symptom:** "Failed to send magic link"  
**Fix:**
```bash
# 1. Check API key is set
firebase functions:config:get

# 2. Check logs
firebase functions:log

# 3. Redeploy
firebase deploy --only functions
```

**Symptom:** Email not received  
**Fix:**
- Check spam folder
- Verify SendGrid domain is "Verified" status
- Check SendGrid Activity Feed for delivery status

**Symptom:** "Cloud function not found"  
**Fix:**
```bash
firebase deploy --only functions
# Wait 30 seconds for deployment to complete
```

---

## 🎯 Result

✅ Emails now sent from your custom domain  
✅ Professional branding  
✅ Reduced spam folder placement  
✅ Enterprise-grade setup  
✅ Truly free (SendGrid free tier: 100 emails/day)  

---

**Need help?** See `SENDGRID_SETUP_GUIDE.md` for detailed instructions.
