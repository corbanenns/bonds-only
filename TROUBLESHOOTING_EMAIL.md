# Email Delivery Troubleshooting Guide

## GoDaddy Email & Notification Issues

This guide helps diagnose why emails aren't reaching GoDaddy-hosted email accounts.

---

## Step 1: Verify Email is Actually Being Sent

### Check Vercel Logs

After a post is created, check your Vercel function logs:

1. Go to **Vercel Dashboard** → Your Project → **Deployments** → Latest → **Functions**
2. Click on any function execution (especially `/api/posts`)
3. Look for `[NOTIFICATION]` and `[EMAIL]` log entries:

**✅ Success looks like:**
```
[NOTIFICATION] Post by Tom King (tom@example.com)
[NOTIFICATION] Found 3 users to notify: Corban Enns (email:true, sms:false), ...
[NOTIFICATION] Attempting email to Corban Enns (corban@comharins.com)
[EMAIL] Preparing to send to corban@comharins.com from noreply@yourdomain.com
[EMAIL] Successfully sent to corban@comharins.com
[NOTIFICATION] ✓ Email sent successfully to Corban Enns
[NOTIFICATION] Results: 3 emails sent, 0 SMS sent, 0 failed
```

**❌ Failure looks like:**
```
[NOTIFICATION] Found 0 users to notify
OR
[NOTIFICATION] Skipping email to Corban Enns (notifyEmail=false)
OR
[EMAIL] Error sending to corban@comharins.com: Error: Invalid login
[NOTIFICATION] ✗ Email failed to Corban Enns: Failed to send email
```

### What Each Error Means

| Log Message | Issue | Solution |
|------------|-------|----------|
| `Found 0 users to notify` | No users have notifications enabled | Check user settings in database |
| `Skipping email to X (notifyEmail=false)` | User's email notifications are OFF | Enable in `/settings` page |
| `Invalid login` | SMTP credentials are wrong | Verify SMTP_USER and SMTP_PASSWORD in Vercel |
| `Connection timeout` | Can't reach SMTP server | Check SMTP_HOST and SMTP_PORT |
| `Recipient address rejected` | Email address is invalid | Check user's email in database |

---

## Step 2: Check Your SMTP Provider Logs

Different SMTP providers have different dashboards to check delivery:

### If Using Gmail SMTP
- Gmail doesn't provide detailed sending logs
- Check your Gmail **Sent** folder - sent emails should appear there
- Check **Google Account Activity**: https://myaccount.google.com/notifications

### If Using SendGrid
1. Go to: https://app.sendgrid.com/email_activity
2. Search for recipient email: `corban@comharins.com`
3. Check the status:
   - **Delivered** ✅ = SendGrid delivered it to GoDaddy's mail server
   - **Bounce** ❌ = GoDaddy rejected it
   - **Deferred** ⚠️ = Temporarily delayed
   - **Dropped** ❌ = SendGrid blocked it (invalid/spam)

### If Using GoDaddy SMTP
1. Login to GoDaddy Webmail
2. Check the **Sent** folder of the sending account
3. Check **Email & Office Dashboard** for any blocks

---

## Step 3: GoDaddy-Specific Email Issues

GoDaddy has strict spam filtering that can block legitimate emails. Here's how to diagnose:

### Check GoDaddy Spam/Junk Folder

1. Login to GoDaddy Webmail: https://email.godaddy.com
2. Check **Junk Email** folder
3. Check **Quarantine** (if using GoDaddy Email Security Plus)

### Check GoDaddy Email Protection Settings

GoDaddy may be blocking emails at the server level:

1. Go to: https://account.godaddy.com/products
2. Click on your email product
3. Go to **Email Settings** → **Spam Filter**
4. Check if your notification sender is being blocked

### Whitelist the Sender Email

To ensure emails from your notification system aren't blocked:

1. **In GoDaddy Webmail:**
   - Click **Settings** (gear icon)
   - Go to **Filter Rules** or **Safe Senders**
   - Add the sender email (e.g., `noreply@bondsonly.org`)

2. **In Workspace Email (if using):**
   - Go to **Admin Console** → **Email Settings**
   - Add to **Allowlist** or **Safe Senders List**

---

## Step 4: Email Authentication Issues

Emails without proper authentication are often blocked by GoDaddy. Check if your sending domain has:

### SPF (Sender Policy Framework)

**What it does:** Tells receiving servers which IPs can send email from your domain.

**Check your SPF record:**
```bash
nslookup -type=txt yourdomain.com
# OR
dig yourdomain.com TXT
```

**If using Gmail SMTP, you need:**
```
v=spf1 include:_spf.google.com ~all
```

**If using SendGrid, you need:**
```
v=spf1 include:sendgrid.net ~all
```

**If using both:**
```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

**How to fix:**
1. Login to GoDaddy Domain Manager
2. Go to **DNS Management**
3. Add/Edit TXT record with SPF value above

### DKIM (DomainKeys Identified Mail)

**What it does:** Cryptographically signs emails to prove they're legitimate.

**For SendGrid:**
1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click **Authenticate Your Domain**
3. Follow instructions to add CNAME records to GoDaddy DNS

**For Gmail:**
- Gmail automatically handles DKIM for @gmail.com addresses
- If using custom domain with Gmail Workspace, set up DKIM in Google Admin

### DMARC (Domain-based Message Authentication)

**What it does:** Tells receiving servers what to do with emails that fail SPF/DKIM.

**Add DMARC record:**
```
Type: TXT
Name: _dmarc.yourdomain.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

This tells GoDaddy to accept emails even if SPF/DKIM fail (during testing).

---

## Step 5: Test Email Delivery Directly

Use the test API endpoint to send a direct test email:

### Via Browser (when logged in):

Navigate to:
```
https://yourdomain.com/api/test-email?to=corban@comharins.com
```

Or use the test button in your admin panel (if added).

### Via curl:

```bash
curl -X POST https://yourdomain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "corban@comharins.com"}'
```

### Expected Response:

**Success:**
```json
{
  "success": true,
  "message": "Test email sent to corban@comharins.com",
  "messageId": "abc123..."
}
```

**Failure:**
```json
{
  "success": false,
  "error": "Failed to send email",
  "details": "Invalid login: 535-5.7.8 Username and Password not accepted"
}
```

---

## Step 6: Common GoDaddy Blocking Scenarios

### Scenario 1: "From" Address Not Verified

**Problem:** Sending from `noreply@bondsonly.org` but using Gmail SMTP

**Solution:**
- Either use Gmail's SMTP with a Gmail address as sender
- OR set up GoDaddy SMTP to send from your domain
- OR use SendGrid and verify your domain

### Scenario 2: GoDaddy Blocking External SMTP

**Problem:** GoDaddy might block incoming emails from certain SMTP providers

**Solution:**
- Use GoDaddy's own SMTP server:
  ```
  SMTP_HOST=smtpout.secureserver.net
  SMTP_PORT=465 (or 587)
  SMTP_USER=your-email@yourdomain.com
  SMTP_PASSWORD=your-password
  ```

### Scenario 3: Rate Limiting

**Problem:** Too many emails sent too quickly

**Solution:**
- GoDaddy limits: 250-500 emails/day depending on plan
- Consider using SendGrid or another transactional email service
- Add delays between email sends (if needed)

### Scenario 4: Email in Quarantine (GoDaddy Email Security Plus)

**Problem:** Emails caught by advanced spam filter

**Solution:**
1. Check quarantine: https://emailsecurity.godaddy.com
2. Release the email
3. Add sender to whitelist
4. Adjust spam filter sensitivity

---

## Step 7: Recommended Solutions

### Option A: Use GoDaddy SMTP (If You Have GoDaddy Email)

**Pros:**
- Emails from your domain won't be blocked
- Proper authentication automatically
- No external dependencies

**Cons:**
- Limited to 250-500 emails/day
- Slower than dedicated services

**Setup:**
```bash
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com  # Must be actual GoDaddy email account
SMTP_PASSWORD=your-godaddy-email-password
```

### Option B: Use SendGrid with Domain Authentication (Recommended)

**Pros:**
- 100 emails/day free
- Fast, reliable delivery
- Detailed tracking and analytics
- Better deliverability

**Cons:**
- Requires DNS configuration
- External service dependency

**Setup:**
1. Sign up: https://sendgrid.com
2. Authenticate your domain (adds DNS records)
3. Add to Vercel:
   ```bash
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

### Option C: Use Gmail SMTP (Easiest for Testing)

**Pros:**
- Quick to set up
- Free
- Reliable

**Cons:**
- Emails come from Gmail address, not your domain
- May be flagged as spam if not your domain
- Limited to 500 emails/day

**Setup:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=16-char-app-password
```

---

## Step 8: Quick Diagnostic Checklist

Run through this checklist:

- [ ] Check Vercel logs - are emails being sent? (`[EMAIL] Successfully sent`)
- [ ] Check SMTP provider logs - did they deliver it?
- [ ] Check GoDaddy **Junk/Spam** folder
- [ ] Check GoDaddy **Quarantine** (if Email Security Plus)
- [ ] Verify user's `notifyEmail` setting is `true`
- [ ] Verify user's email address is correct
- [ ] Test with `/api/test-email` endpoint
- [ ] Check SPF record exists for your domain
- [ ] Check sender email is whitelisted in GoDaddy
- [ ] Try sending to a Gmail/Outlook address to rule out GoDaddy

---

## Step 9: Contact GoDaddy Support (If All Else Fails)

If emails are being sent but not arriving:

1. Get the **Message-ID** from Vercel logs or SMTP provider
2. Contact GoDaddy Email Support
3. Ask them to check their mail server logs for the Message-ID
4. They can tell you if/why the email was blocked

**GoDaddy Support:**
- Phone: 480-505-8877
- Chat: https://www.godaddy.com/contact-us

Provide them:
- Recipient email: `corban@comharins.com`
- Sender email: (from your SMTP config)
- Approximate timestamp
- Message-ID (if available)

---

## Expected Timeline After Fix

Once you fix the issue:

1. **Immediate (< 1 minute):** Logs should show `[EMAIL] Successfully sent`
2. **Within 30 seconds:** Email should arrive in inbox (or spam)
3. **Within 5 minutes:** If not in inbox, check spam/junk
4. **After 10+ minutes:** Check quarantine or contact GoDaddy

---

## Testing Matrix

| Test | Purpose | How |
|------|---------|-----|
| Send to Gmail | Verify SMTP works | Create post, check Gmail |
| Send to GoDaddy | Verify GoDaddy accepts | Create post, check GoDaddy inbox |
| Check logs | Verify code triggers | Read Vercel function logs |
| Use test endpoint | Direct SMTP test | Call `/api/test-email` |
| Check spam | Verify not filtered | Check GoDaddy junk folder |

---

## Additional Resources

- **Vercel Logs:** https://vercel.com/dashboard → Your Project → Functions
- **SendGrid Activity:** https://app.sendgrid.com/email_activity
- **GoDaddy Webmail:** https://email.godaddy.com
- **GoDaddy Email Security:** https://emailsecurity.godaddy.com
- **GoDaddy DNS Manager:** https://dcc.godaddy.com/manage/dns
- **MXToolbox (Check SPF/DKIM):** https://mxtoolbox.com/SuperTool.aspx

---

**Built for Bonds Only Group** | Last Updated: 2025-11-11
