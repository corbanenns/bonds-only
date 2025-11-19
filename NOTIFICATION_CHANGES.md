# Notification System Changes

## Summary
Changed the notification system from immediate notifications (sent when a post is created) to scheduled daily notifications that only notify users who haven't logged in since the last post was made.

## Changes Made

### 1. Database Schema Update
**File**: `prisma/schema.prisma`

Added `lastLogin` field to the User model to track when users last logged in:
```prisma
lastLogin DateTime? @map("last_login")
```

**Action Required**: Run migration to update the database:
```bash
npx prisma db push
```

### 2. Authentication Update
**File**: `src/lib/auth.ts`

Updated the NextAuth JWT callback to set `lastLogin` timestamp whenever a user logs in.

### 3. Removed Immediate Notifications
**File**: `src/app/api/posts/route.ts`

Removed the code that sent notifications immediately when a post was created. Posts are now created without triggering notifications.

### 4. Created Scheduled Notification Job
**File**: `src/app/api/cron/send-notifications/route.ts`

New API endpoint that runs daily at 3 AM PST to send notifications.

**Logic**:
- Finds the most recent post
- Finds all users whose `lastLogin` is before that post's `createdAt` (or who have never logged in)
- Sends notifications to those users (excluding the author of the most recent post)
- Respects user notification preferences (`notifyEmail` and `notifySms`)

### 5. Vercel Cron Configuration
**File**: `vercel.json`

Created Vercel cron job configuration to run the notification job daily at 3 AM PST (11 AM UTC).

```json
{
  "crons": [
    {
      "path": "/api/cron/send-notifications",
      "schedule": "0 11 * * *"
    }
  ]
}
```

**Note**: The schedule is `0 11 * * *` which is 11 AM UTC = 3 AM PST (during standard time). During daylight saving time (PDT), this will run at 4 AM PDT. If you want it to always run at 3 AM Pacific time regardless of DST, you may need to adjust the schedule seasonally or use a different scheduling approach.

## Environment Variables Required

### CRON_SECRET
Add this to your `.env.local`, `.env.production`, and Vercel environment variables:

```bash
CRON_SECRET=your-secret-key-here
```

**How to generate**:
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Where to add**:
1. Local development: `.env.local`
2. Production (Vercel):
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `CRON_SECRET` with the same value

## Testing

### Test Locally
You can test the cron job locally by calling it directly:

```bash
# Create a test script
node test-cron-notification.js
```

**test-cron-notification.js**:
```javascript
const https = require('https')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cron/send-notifications',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2))
  })
})

req.on('error', (error) => {
  console.error(error)
})

req.end()
```

Or use curl:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-notifications
```

### Test in Production
After deploying, you can manually trigger the cron job in Vercel:
1. Go to Vercel Dashboard → Your Project → Deployments → (Latest) → Functions
2. Find `/api/cron/send-notifications`
3. Click "Invoke" to test

## Deployment Steps

1. **Push schema changes**:
   ```bash
   npx prisma db push
   ```

2. **Add CRON_SECRET to Vercel**:
   - Vercel Dashboard → Settings → Environment Variables
   - Add `CRON_SECRET` with a secure random value

3. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Update notification system to scheduled daily notifications"
   git push
   ```

4. **Verify cron job is registered**:
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see the job listed with schedule "0 11 * * *"

## Example Scenarios

### Scenario 1: Manny posts at 2 AM, cron runs at 3 AM
- **Result**: Everyone except Manny gets notified (since they haven't logged in since his post)

### Scenario 2: Manny posts at 2 AM, Sarah logs in at 2:30 AM, cron runs at 3 AM
- **Result**: Everyone except Manny and Sarah gets notified (Sarah has logged in since Manny's post)

### Scenario 3: No posts since yesterday, cron runs at 3 AM
- **Result**: No one gets notified (the most recent post is from yesterday, everyone has already been notified or logged in since then)

### Scenario 4: Multiple posts throughout the day
- **Result**: At 3 AM, only users who haven't logged in since the MOST RECENT post get notified

## Monitoring

Check the cron job logs in Vercel:
1. Vercel Dashboard → Your Project → Deployments → (Latest) → Functions
2. Click on `/api/cron/send-notifications`
3. View logs to see:
   - When the job ran
   - Which post was the most recent
   - Which users were notified
   - Email/SMS send results

## Rollback Plan

If you need to revert to immediate notifications:

1. Uncomment the notification code in `src/app/api/posts/route.ts`
2. Remove or disable the cron job in `vercel.json`
3. Redeploy
