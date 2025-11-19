/**
 * Test the cron endpoint locally
 * ⚠️ WARNING: This will send REAL emails!
 */

const http = require('http')
require('dotenv').config({ path: '.env.local' })

async function testCronEndpoint() {
  try {
    console.log('🔔 Testing Cron Endpoint\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (!process.env.CRON_SECRET) {
      console.error('❌ ERROR: CRON_SECRET is not set in .env.local')
      console.error('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
      console.error('   Then add it to .env.local: CRON_SECRET=<generated-value>')
      process.exit(1)
    }

    const cronSecret = process.env.CRON_SECRET
    console.log(`📤 Calling: http://localhost:3000/api/cron/send-notifications`)
    console.log(`🔑 Using CRON_SECRET: ${cronSecret.substring(0, 16)}...`)
    console.log()
    console.log('⚠️  WARNING: This will send REAL emails to users!')
    console.log('   Press Ctrl+C now if you want to cancel...\n')

    // Wait 3 seconds to give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('📡 Making request...\n')

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/cron/send-notifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`
      }
    }

    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}\n`)

        try {
          const parsed = JSON.parse(data)
          console.log('📊 Response:')
          console.log(JSON.stringify(parsed, null, 2))
          console.log()

          if (parsed.success) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
            console.log('✅ SUCCESS!')
            console.log()

            if (parsed.notified > 0) {
              console.log(`📧 Notifications sent to ${parsed.notified} users`)
              console.log(`   Emails: ${parsed.results.emailsSent}`)
              console.log(`   SMS: ${parsed.results.smsSent}`)
              console.log(`   Failed: ${parsed.results.failed}`)
              console.log()
              console.log('📬 Check email inboxes and SendGrid dashboard:')
              console.log('   https://app.sendgrid.com/email_activity')
            } else {
              console.log('ℹ️  No users were notified.')
              console.log('   Reason: ' + parsed.message)
            }
            console.log()
          } else {
            console.log('❌ FAILED!')
            console.log('   Error: ' + (parsed.error || 'Unknown error'))
            console.log()
          }
        } catch (e) {
          console.log('Raw Response:')
          console.log(data)
          console.log()
        }
      })
    })

    req.on('error', (error) => {
      console.error('\n❌ REQUEST ERROR:', error.message)
      console.error()
      console.error('Troubleshooting:')
      console.error('1. Make sure the dev server is running: npm run dev')
      console.error('2. Check that the server is on http://localhost:3000')
      console.error('3. Verify CRON_SECRET is set in .env.local')
      console.error()
    })

    req.end()

  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testCronEndpoint()
