# SendGrid Email Setup - Bonds Only Group

**Quick Setup Guide** | Estimated Time: 5 minutes

---

## 🎯 What You Need from SendGrid

To enable email notifications, you need **ONE API key** from your SendGrid account.

### Step 1: Log into SendGrid

Go to: https://app.sendgrid.com/login

### Step 2: Create an API Key

1. **Navigate to API Keys:**
   - Click **Settings** in left sidebar
   - Click **API Keys**
   - Or go directly to: https://app.sendgrid.com/settings/api_keys

2. **Create New API Key:**
   - Click **"Create API Key"** button (top right)
   - Name: `Bonds Only Production` (or any name you want)

3. **Set Permissions:**
   - Choose **"Restricted Access"**
   - Scroll to **"Mail Send"**
   - Toggle **"Mail Send"** to **FULL ACCESS** (blue)
   - Leave everything else as "No Access"
   - Click **"Create & View"**

4. **Copy Your API Key:**
   - **⚠️ IMPORTANT:** Copy the API key NOW - you won't be able to see it again!
   - It looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Store it somewhere safe (password manager, secure note, etc.)

---

## 🔐 Add to Vercel (Production Environment)

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project: **bonds-only**

2. **Open Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in left menu

3. **Add These 4 Variables:**

   **Variable 1:**
   - Key: `SMTP_HOST`
   - Value: `smtp.sendgrid.net`
   - Environments: Check **Production** ✓

   **Variable 2:**
   - Key: `SMTP_PORT`
   - Value: `587`
   - Environments: Check **Production** ✓

   **Variable 3:**
   - Key: `SMTP_USER`
   - Value: `apikey`
   - Environments: Check **Production** ✓
   - **⚠️ Note:** This is literally the word "apikey" - not your actual key!

   **Variable 4:**
   - Key: `SMTP_PASSWORD`
   - Value: `SG.xxxxxxxxxxx` (paste your API key from Step 2)
   - Environments: Check **Production** ✓

4. **Save Each Variable:**
   - Click **"Save"** after each one

### Option 2: Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project
cd "C:\Users\corba\_Projects\Bonds Only Group\bonds-only"
vercel link

# Add environment variables
vercel env add SMTP_HOST production
# Enter: smtp.sendgrid.net

vercel env add SMTP_PORT production
# Enter: 587

vercel env add SMTP_USER production
# Enter: apikey

vercel env add SMTP_PASSWORD production
# Enter: SG.xxxxxxxxxx (your API key)
```

---

## 🚀 Deploy to Production

After adding environment variables, you **MUST** redeploy:

### Method 1: Git Push (Triggers Auto-Deploy)

```bash
cd "C:\Users\corba\_Projects\Bonds Only Group\bonds-only"
git commit --allow-empty -m "Trigger redeploy for SendGrid env vars"
git push origin master
```

### Method 2: Vercel Dashboard (Manual Redeploy)

1. Go to: https://vercel.com/dashboard
2. Select project: **bonds-only**
3. Click **Deployments** tab
4. Find latest deployment
5. Click **⋯** (three dots) → **Redeploy**
6. Confirm **"Redeploy"**

---

## ✅ Test Email Notifications

### 1. Verify Environment Variables Loaded

Check Vercel deployment logs:
1. Vercel Dashboard → Deployments → [Latest] → **Functions**
2. Look for successful deployment message
3. No SMTP errors should appear

### 2. Send Test Email

**Option A: Via Application**
1. Log into production site
2. Go to Message Board
3. Create a new post
4. Check if you receive an email notification

**Option B: Via Test Script** (if needed)

Create `test-sendgrid.js`:
```javascript
const nodemailer = require('nodemailer')

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: 'SG.xxxxx' // Your API key
    }
  })

  const result = await transporter.sendMail({
    from: '"Bonds Only" <your-verified-sender@domain.com>',
    to: 'your-test-email@gmail.com',
    subject: 'SendGrid Test',
    text: 'If you receive this, SendGrid is working!'
  })

  console.log('Email sent!', result.messageId)
}

test().catch(console.error)
```

Run:
```bash
node test-sendgrid.js
```

### 3. Check Delivery

- Check your inbox (including spam folder)
- Email should arrive within 1-2 seconds
- Subject: "New Message: [Post Title]"
- From: "Bonds Only Group"

---

## 📧 Configure Sender Email (Important!)

### Single Sender Verification (Free - Recommended)

SendGrid requires you verify the email address you're sending FROM:

1. **Go to Sender Authentication:**
   - https://app.sendgrid.com/settings/sender_auth
   - Or: Settings → Sender Authentication

2. **Single Sender Verification:**
   - Click **"Verify a Single Sender"**
   - Click **"Create New Sender"**

3. **Fill Out Form:**
   - From Name: `Bonds Only Group`
   - From Email Address: `noreply@yourdomain.com` (or your email)
   - Reply To: `your-email@domain.com`
   - Company Address: Your business address
   - Nickname: `Bonds Only`
   - Click **"Create"**

4. **Verify Email:**
   - Check inbox for verification email from SendGrid
   - Click **"Verify Single Sender"** in email
   - Return to SendGrid dashboard

5. **Update Application Code:**

Edit `src/lib/notifications.ts` (line 33):
```typescript
from: `"Bonds Only Group" <noreply@yourdomain.com>`,  // Use verified email
```

**Note:** Use the EXACT email you verified in SendGrid.

### Domain Authentication (Optional - Professional)

For better deliverability and branding:

1. **Go to Domain Authentication:**
   - https://app.sendgrid.com/settings/sender_auth/domain/create

2. **Follow Wizard:**
   - Enter your domain: `bondsonly.com`
   - Click **"Next"**
   - Copy DNS records provided

3. **Add DNS Records:**
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Add CNAME records as shown by SendGrid
   - Wait 24-48 hours for DNS propagation

4. **Verify Domain:**
   - Return to SendGrid → Verify Domain
   - Once verified, you can send from `any-name@bondsonly.com`

---

## 📊 Monitor Email Delivery

### SendGrid Activity Feed

View all sent emails:
- https://app.sendgrid.com/email_activity
- Shows: Delivered, Bounced, Spam Reports, Opens, Clicks

### Vercel Function Logs

View application logs:
- https://vercel.com/dashboard → [Project] → Functions
- Shows: SMTP errors, connection issues

### Check Deliverability

After sending test emails:
1. Check SendGrid Activity Feed
2. Status should be **"Delivered"**
3. If **"Bounced"**: Check recipient email address
4. If **"Spam"**: Sender email not verified

---

## 🚨 Troubleshooting

### Error: "Authentication Failed"

**Cause:** Wrong API key or not using "apikey" as username

**Fix:**
- Verify `SMTP_USER=apikey` (literally the word "apikey")
- Verify `SMTP_PASSWORD` is your SendGrid API key (starts with `SG.`)
- Create new API key if needed

### Error: "The from address does not match a verified Sender Identity"

**Cause:** Sending from unverified email address

**Fix:**
1. Go to SendGrid → Sender Authentication
2. Verify Single Sender
3. Update `from` email in code to match verified sender

### Error: "Bad username / password"

**Cause:** API key is incorrect or expired

**Fix:**
1. Create new API key in SendGrid
2. Update `SMTP_PASSWORD` in Vercel
3. Redeploy application

### Emails Going to Spam

**Common Causes:**
- Sender email not verified
- Domain not authenticated
- Using personal Gmail/Yahoo as sender
- Missing SPF/DKIM records

**Fix:**
- Complete Single Sender Verification
- Or set up Domain Authentication
- Use business email as sender

### No Emails Being Sent

**Check:**
1. Vercel environment variables are saved
2. Application redeployed after adding env vars
3. SendGrid API key has "Mail Send" permission
4. No errors in Vercel function logs
5. User has `notifyEmail=true` in database

---

## 💰 SendGrid Pricing

### Free Tier (What You Have)
- **100 emails/day** (3,000/month)
- Free forever
- Full features
- Perfect for 20-50 active members

### If You Need More
- **Essentials:** $19.95/month for 50K emails
- **Pro:** $89.95/month for 100K emails

**For Bonds Only Group:** Free tier is sufficient unless you're sending 100+ emails/day.

---

## 📋 Configuration Summary

**What you added to Vercel:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**What you verified in SendGrid:**
- API Key created with "Mail Send" permission
- Sender email verified (noreply@yourdomain.com)

**What happens next:**
- Application can send emails via SendGrid
- Members with `notifyEmail=true` receive message notifications
- Emails appear as from "Bonds Only Group <noreply@yourdomain.com>"

---

## ✨ You're Done!

Email notifications should now be working in production. Test by:
1. Creating a new post on message board
2. Checking if notification email arrives
3. Verifying in SendGrid Activity Feed

**Next:** Set up SMS notifications? See `NOTIFICATIONS_SETUP.md` for Twilio configuration.

---

## 🔗 Quick Links

- **SendGrid Dashboard:** https://app.sendgrid.com
- **API Keys:** https://app.sendgrid.com/settings/api_keys
- **Sender Authentication:** https://app.sendgrid.com/settings/sender_auth
- **Activity Feed:** https://app.sendgrid.com/email_activity
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**Need Help?** Check Vercel logs and SendGrid Activity Feed for detailed error messages.
