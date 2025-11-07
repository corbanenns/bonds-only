# Notifications Setup Guide - Bonds Only Group

**Last Updated:** November 7, 2025

## Overview

The Bonds Only platform has both **Email** and **SMS** notification capabilities built-in. This guide shows you exactly what you need to get them working in production.

---

## 📧 Email Notifications (via SMTP)

### What's Already Built

✅ Email notification system ready (`src/lib/notifications.ts`)
✅ HTML email templates with Bonds Only branding
✅ Nodemailer integration configured
✅ Support for message board notifications

### What You Need to Configure

#### Option 1: Gmail (Easiest - Free)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Bonds Only"
   - Copy the 16-character password

3. **Add to Vercel Environment Variables:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=<16-char-app-password>
   ```

#### Option 2: SendGrid (Recommended for Production)

1. **Sign up for SendGrid**
   - Free tier: 100 emails/day
   - Go to: https://sendgrid.com/

2. **Create API Key**
   - Dashboard → Settings → API Keys → Create API Key
   - Choose "Restricted Access"
   - Enable "Mail Send" permission
   - Copy the API key (starts with `SG.`)

3. **Add to Vercel Environment Variables:**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=<your-sendgrid-api-key>
   ```

#### Option 3: Custom SMTP Server

If you have your own email server:
```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

### Testing Email Notifications

Once configured, test by:
1. Creating a new post on the message board
2. Check if other members receive emails
3. Monitor Vercel logs for any SMTP errors

---

## 📱 SMS Notifications (via Twilio)

### What's Already Built

✅ Twilio SMS integration (`src/lib/twilio.ts`)
✅ SMS notification function (`src/lib/notifications.ts`)
✅ Message board SMS alerts
✅ MFA code sending (if needed in future)

### What You Need to Configure

#### 1. Sign Up for Twilio

- Go to: https://www.twilio.com/try-twilio
- Sign up for free trial ($15 credit)
- Complete phone verification

#### 2. Get a Twilio Phone Number

- Dashboard → Phone Numbers → Buy a Number
- Choose a US number with SMS capability
- Free trial includes 1 phone number
- Cost after trial: ~$1/month + $0.0075 per SMS

#### 3. Get Your Credentials

From Twilio Console (https://console.twilio.com):
- **Account SID**: Starts with `AC...` (NOT `SK...`)
- **Auth Token**: Click "View" next to Auth Token
- **Phone Number**: Format: `+15551234567`

⚠️ **IMPORTANT:** You need the **Account SID** (AC...), not an API Key (SK...)

#### 4. Add to Vercel Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567
```

#### 5. (Free Trial Only) Verify Recipient Numbers

If using Twilio free trial:
- Go to: Phone Numbers → Verified Caller IDs
- Add each member's phone number
- They'll receive a verification code
- Once verified, they can receive SMS

**Production:** Once you upgrade ($20 minimum), you can send to ANY number without verification.

### Testing SMS Notifications

Once configured:
1. Ensure user phone numbers are in E.164 format: `+15551234567`
2. Create a new post on message board
3. Check if SMS arrives to members with SMS enabled
4. Monitor Twilio logs: https://console.twilio.com/us1/monitor/logs/sms

---

## 🔧 Adding Environment Variables to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project: **bonds-only**
3. Settings → Environment Variables
4. Add each variable:
   - **Key**: Variable name (e.g., `SMTP_HOST`)
   - **Value**: Variable value
   - **Environments**: Check all (Production, Preview, Development)
5. Click "Save"

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASSWORD
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
```

### Redeploy After Adding Variables

After adding environment variables:
```bash
# Trigger redeploy via Git push
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin master

# Or via Vercel dashboard: Deployments → [latest] → Redeploy
```

---

## 🎯 User Notification Preferences

### Database Schema

The `User` model needs notification preference fields. Check if these exist in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields
  notifyEmail Boolean @default(true)   // Email notifications enabled?
  notifySms   Boolean @default(false)  // SMS notifications enabled?
}
```

If missing, add them and run:
```bash
npx prisma db push
```

### User Settings Page

Users can toggle notifications in their settings:
- Go to: `/settings`
- Email Notifications: ON/OFF
- SMS Notifications: ON/OFF

**Note:** SMS will only work if user has valid phone number in `+1XXXXXXXXXX` format

---

## 📝 How Notifications Currently Work

### Automatic Triggers

**Message Board Posts:**
- When a user creates a new post
- All other members with notifications enabled get alerted
- Email: Full message preview with link
- SMS: Short message with link

### Manual Triggers (Future)

Can be extended for:
- New event announcements
- Member join notifications
- Admin announcements
- Calendar reminders

### Notification Flow

```
User creates post
    ↓
System fetches all users with notifyEmail=true or notifySms=true
    ↓
For each user:
    → Send email if notifyEmail=true && SMTP configured
    → Send SMS if notifySms=true && Twilio configured
    ↓
Log results (emails sent, SMS sent, failed)
```

---

## 💰 Cost Breakdown

### Email (SendGrid Free Tier)
- **Free:** 100 emails/day
- **Paid:** $19.95/month for 50K emails
- **For 20 active members:** Free tier is plenty

### SMS (Twilio)
- **Free Trial:** $15 credit (~2,000 SMS)
- **After Trial:** $20 minimum top-up
- **Cost:** $0.0075 per SMS (1,333 SMS per $10)
- **Phone Number:** $1.15/month
- **For 20 members getting 5 SMS/week:** ~$4/month

### Total Estimated Cost
- **Email only:** $0 (free tier sufficient)
- **Email + SMS:** ~$5/month for 20 active members

---

## 🧪 Testing Checklist

### Before Going Live

- [ ] Configure SMTP credentials in Vercel
- [ ] Configure Twilio credentials in Vercel
- [ ] Redeploy application
- [ ] Verify environment variables loaded (check Vercel logs)
- [ ] Test email notification (create test post)
- [ ] Test SMS notification (create test post)
- [ ] Verify user preferences toggle works
- [ ] Check notification delivery time (<30 seconds)
- [ ] Verify HTML email renders correctly (Gmail, Outlook, iPhone)
- [ ] Test with invalid phone numbers (should fail gracefully)
- [ ] Monitor error logs for failed deliveries

### Test Users

Create 2-3 test users with different notification preferences:
1. **Email Only** - `notifyEmail: true, notifySms: false`
2. **SMS Only** - `notifyEmail: false, notifySms: true`
3. **Both** - `notifyEmail: true, notifySms: true`

Post a message and verify each receives notifications according to their preferences.

---

## 🚨 Troubleshooting

### Email Not Sending

**Check:**
1. Vercel logs for SMTP errors
2. Gmail app password is correct (16 chars, no spaces)
3. Gmail 2FA is enabled
4. SMTP credentials are in **Production** environment
5. Application redeployed after adding env vars

**Common Errors:**
- `Invalid login` = Wrong SMTP_USER or SMTP_PASSWORD
- `Connection timeout` = Wrong SMTP_HOST or SMTP_PORT
- `Authentication failed` = Need app-specific password for Gmail

### SMS Not Sending

**Check:**
1. Twilio Account SID starts with `AC...` (not `SK...`)
2. Phone numbers in E.164 format: `+15551234567`
3. Twilio free trial: Recipient numbers verified
4. Twilio account has credits ($15 trial or paid top-up)
5. TWILIO_PHONE_NUMBER matches purchased number

**Common Errors:**
- `Invalid account SID` = Using API key instead of Account SID
- `Unverified number` = Recipient not verified (free trial only)
- `Insufficient funds` = Twilio account out of credits
- `Invalid phone number` = Missing `+` or country code

### No Notifications at All

**Check:**
1. User has notification preferences enabled
2. User has valid email/phone in database
3. Notification code is being triggered (check logs)
4. No errors in Vercel function logs
5. Environment variables exist in correct environment

---

## 📋 Quick Setup Summary

### For Email Notifications (5 minutes)

1. Get Gmail app password: https://myaccount.google.com/apppasswords
2. Add to Vercel:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASSWORD=<app-password>`
3. Redeploy application
4. Test by creating a post

### For SMS Notifications (10 minutes)

1. Sign up: https://www.twilio.com/try-twilio
2. Buy a phone number
3. Get credentials from console
4. Add to Vercel:
   - `TWILIO_ACCOUNT_SID=ACxxxx`
   - `TWILIO_AUTH_TOKEN=<token>`
   - `TWILIO_PHONE_NUMBER=+15551234567`
5. Verify recipient numbers (free trial only)
6. Redeploy application
7. Test by creating a post

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Twilio Console:** https://console.twilio.com
- **SendGrid Dashboard:** https://app.sendgrid.com
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
- **Twilio Pricing:** https://www.twilio.com/en-us/sms/pricing/us
- **SendGrid Pricing:** https://sendgrid.com/en-us/pricing

---

## 🎓 Need Help?

If you run into issues:
1. Check Vercel function logs for errors
2. Check Twilio SMS logs: https://console.twilio.com/us1/monitor/logs/sms
3. Test SMTP credentials with a test script
4. Verify phone number formats in database
5. Ensure environment variables are in the correct environment (Production/Preview/Development)

---

**Built for Bonds Only Group** | Last Updated: November 7, 2025
