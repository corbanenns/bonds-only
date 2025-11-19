# Testing Guide: Scheduled Notifications

## Step-by-Step Testing Process

### Step 1: Run Database Migration

First, update the database schema to add the `lastLogin` field:

```bash
cd "C:\Users\corba\_Projects\Bonds Only Group\bonds-only"
npx prisma db push
```

**Expected Output:**
```
✔ Generated Prisma Client
🚀 Your database is now in sync with your Prisma schema
```

### Step 2: Generate and Add CRON_SECRET

Generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to `.env.local`:

```bash
# Add this line to .env.local
CRON_SECRET=<paste-the-generated-secret-here>
```

**Example:**
```
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 3: Test Database Schema

Verify the `lastLogin` field was added:

```bash
node verify-schema.js
```

This will show all users and their current `lastLogin` status (should all be `null` initially).

### Step 4: Test lastLogin Tracking

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Log in to the website:**
   - Go to http://localhost:3000
   - Log in with any user account
   - Check the console logs for: `🕒 JWT - Updated lastLogin for user: <user-id>`

3. **Verify lastLogin was set:**
   ```bash
   node verify-schema.js
   ```

   You should now see that user has a `lastLogin` timestamp.

### Step 5: Test Notification Logic (Without Sending Emails)

This test shows WHO would be notified without actually sending emails:

```bash
node test-scheduled-notifications.js
```

**What it shows:**
- The most recent post
- All users and their login status
- Which users WILL be notified and why
- Which users WON'T be notified and why

**Example Output:**
```
📝 Most Recent Post:
   Title: "Test Post"
   Author: Manny
   Created: 11/17/2025, 11:30:00 PM

👥 All Users:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Corban
   Email: corban@comharconsulting.com
   Last Login: Never
   Email Notifications: ON
   Will be notified: YES

❌ Manny
   Email: manny@example.com
   Last Login: 11/18/2025, 12:30:00 AM
   Email Notifications: ON
   Will be notified: NO
   Reason: User is the author of the most recent post

📊 Summary:
   Total users: 10
   Users to notify: 9
```

### Step 6: Test Cron Endpoint Locally (With Actual Emails)

**⚠️ WARNING: This will send REAL emails to users!**

Make sure your `SENDGRID_API_KEY` is set in `.env.local` first.

```bash
node test-cron-endpoint.js
```

**What it does:**
- Calls the actual cron endpoint
- Uses the CRON_SECRET for authentication
- Sends real emails to users who haven't logged in since the last post

**Example Output:**
```
🔔 Testing Cron Endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 Calling: http://localhost:3000/api/cron/send-notifications
🔑 Using CRON_SECRET: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...

📊 Response:
{
  "success": true,
  "message": "Notifications sent",
  "mostRecentPost": {
    "title": "Test Post",
    "author": "Manny",
    "createdAt": "2025-11-17T23:30:00.000Z"
  },
  "notified": 9,
  "results": {
    "emailsSent": 9,
    "smsSent": 0,
    "failed": 0
  }
}

✅ SUCCESS! Check SendGrid dashboard for email activity.
```

### Step 7: Test Different Scenarios

#### Scenario A: User Logs In After Post
1. Create a post
2. Run `node test-scheduled-notifications.js` → User should be in "will notify" list
3. Log in as that user
4. Run `node test-scheduled-notifications.js` again → User should now be in "won't notify" list

#### Scenario B: Author of Post
1. Log in as User A
2. Create a post as User A
3. Run `node test-scheduled-notifications.js`
4. User A should NOT be in the "will notify" list (author exclusion)

#### Scenario C: Multiple Posts
1. Create a post at Time X
2. User logs in at Time Y (after X)
3. Create another post at Time Z (after Y)
4. Run `node test-scheduled-notifications.js`
5. User should be in "will notify" list (hasn't logged in since the most recent post)

### Step 8: Deploy and Test in Production

1. **Add CRON_SECRET to Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `CRON_SECRET` with the same value from `.env.local`

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Add scheduled notification system"
   git push
   ```

3. **Verify Cron Job is Registered:**
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see: `/api/cron/send-notifications` with schedule `0 11 * * *`

4. **Manually Trigger in Production (Optional):**
   - Vercel Dashboard → Deployments → (Latest) → Functions
   - Find `/api/cron/send-notifications`
   - Click "Invoke" to test immediately

5. **Monitor Logs:**
   - After triggering or waiting for 3 AM PST
   - Check Function logs to see notification results

## Troubleshooting

### "lastLogin is null for all users"
**Solution:** Users need to log in after the migration. The `lastLogin` field is only set when users log in, not retroactively.

### "No users to notify"
**Possible reasons:**
1. All users have logged in since the last post
2. No posts exist
3. All users have notifications disabled
4. Run `node test-scheduled-notifications.js` to see detailed breakdown

### "Unauthorized" error when calling cron endpoint
**Solution:**
1. Check that `CRON_SECRET` is set in `.env.local`
2. Check that the test script is using the correct secret
3. Make sure you're not including quotes in the env var (should be `CRON_SECRET=abc123` not `CRON_SECRET="abc123"`)

### Emails not sending
**Check:**
1. `SENDGRID_API_KEY` is set
2. `SENDGRID_FROM_EMAIL` is set
3. Check SendGrid dashboard for errors: https://app.sendgrid.com/email_activity
4. Check console logs for `[EMAIL]` messages

## Useful Commands

```bash
# Check which users would be notified (safe, no emails sent)
node test-scheduled-notifications.js

# Verify database schema
node verify-schema.js

# Actually send notifications (SENDS REAL EMAILS)
node test-cron-endpoint.js

# Check production logs
vercel logs --follow
```

## What to Expect on First Run

1. **Before any logins after migration:**
   - All users have `lastLogin = null`
   - Everyone (except the author) will be notified at 3 AM

2. **After users start logging in:**
   - `lastLogin` updates on each login
   - Only users who haven't logged in since the last post get notified

3. **Daily at 3 AM PST:**
   - Cron job checks the most recent post
   - Sends notifications to users with `lastLogin < post.createdAt` OR `lastLogin = null`
   - Excludes the author of that post
