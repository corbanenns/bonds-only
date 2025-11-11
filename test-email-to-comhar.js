const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function sendTestEmailToComhar() {
  console.log('🔧 Testing email to corban@comharconsulting.com...\n')

  // Check which method is available
  const usingSendGrid = !!process.env.SENDGRID_API_KEY

  console.log('Configuration:')
  console.log('  SendGrid API Key:', process.env.SENDGRID_API_KEY ? '✓ Found' : '✗ Not found')
  console.log('  SendGrid From Email:', process.env.SENDGRID_FROM_EMAIL || 'Not set')
  console.log('  SMTP Host:', process.env.SMTP_HOST || 'Not set')
  console.log('  SMTP User:', process.env.SMTP_USER || 'Not set')
  console.log('  SMTP Password:', process.env.SMTP_PASSWORD ? '✓ Set' : '✗ Not set')

  if (!usingSendGrid && !process.env.SMTP_HOST) {
    console.error('\n❌ ERROR: No email configuration found!')
    process.exit(1)
  }

  console.log('\n📧 Creating email transporter...')

  let transporter
  if (usingSendGrid) {
    console.log('Using SendGrid configuration\n')
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  } else {
    console.log('Using generic SMTP configuration\n')
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER
  console.log('From email:', fromEmail)
  console.log('To email: corban@comharconsulting.com\n')

  const testData = {
    title: 'Email Test - Bonds Only Group Notifications',
    content: 'This is a test email sent directly to corban@comharconsulting.com to verify that the email notification system is working correctly. If you receive this, the SendGrid integration is functioning properly!',
    author: 'System Test',
  }

  console.log('📤 Sending test email...')

  try {
    const result = await transporter.sendMail({
      from: `"Bonds Only Group" <${fromEmail}>`,
      to: 'corban@comharconsulting.com',
      subject: `Test: ${testData.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
            .test-badge { background: #f59e0b; color: white; padding: 6px 16px; border-radius: 4px; font-size: 14px; display: inline-block; margin-bottom: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>Email System Test</p>
            </div>
            <div class="content">
              <div class="test-badge">🧪 SYSTEM TEST</div>
              <p>Hello Corban,</p>
              <p>This is a <strong>test email</strong> to verify your email notifications are working.</p>

              <div class="message-box">
                <h2>✅ Email System Status: WORKING</h2>
                <p>${testData.content}</p>
                <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                  <strong>Test Details:</strong><br>
                  Sent to: corban@comharconsulting.com<br>
                  From: ${fromEmail}<br>
                  Transport: ${usingSendGrid ? 'SendGrid SMTP' : 'Generic SMTP'}<br>
                  Timestamp: ${new Date().toISOString()}
                </p>
              </div>

              <div class="footer">
                <p><strong>If you received this email, your notifications are working correctly!</strong></p>
                <p>Check your user settings at https://bondsonly.org/settings to ensure "Email Notifications" is enabled.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${testData.title}\n\n${testData.content}\n\nFrom: ${fromEmail}\nTo: corban@comharconsulting.com\nTimestamp: ${new Date().toISOString()}`,
    })

    console.log('\n✅ SUCCESS! Email sent!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Message ID:', result.messageId)
    console.log('Response:', result.response)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📬 Next Steps:')
    console.log('1. Check corban@comharconsulting.com inbox')
    console.log('2. Check spam/junk folder if not in inbox')
    console.log('3. Verify in SendGrid Activity Feed:')
    console.log('   https://app.sendgrid.com/email_activity\n')

    if (usingSendGrid) {
      console.log('🔍 SendGrid Activity Feed will show:')
      console.log('   - Delivered: Email successfully delivered')
      console.log('   - Bounced: Email rejected by recipient server')
      console.log('   - Spam: Email flagged as spam\n')
    }

  } catch (error) {
    console.error('\n❌ ERROR sending email:')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error.message)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (error.message.includes('Invalid login') || error.message.includes('Authentication')) {
      console.error('💡 Authentication Issue:')
      console.error('   - Verify SENDGRID_API_KEY is correct')
      console.error('   - Check it starts with "SG."')
      console.error('   - Ensure it has "Mail Send" permission')
      console.error('   - Try creating a new API key in SendGrid\n')
    }

    if (error.message.includes('from address') || error.message.includes('Sender')) {
      console.error('💡 Sender Verification Issue:')
      console.error('   - The from email address must be verified in SendGrid')
      console.error('   - Go to: https://app.sendgrid.com/settings/sender_auth')
      console.error('   - Verify "Single Sender" or set up "Domain Authentication"')
      console.error('   - Current from email: ' + fromEmail + '\n')
    }

    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('💡 Connection Issue:')
      console.error('   - Check your internet connection')
      console.error('   - Verify SMTP host is correct: smtp.sendgrid.net')
      console.error('   - Check firewall settings\n')
    }

    console.error('📋 Current Configuration:')
    console.error('   SMTP Host: ' + (process.env.SMTP_HOST || 'Not set'))
    console.error('   SMTP Port: ' + (process.env.SMTP_PORT || '587'))
    console.error('   SMTP User: ' + (process.env.SMTP_USER || 'Not set'))
    console.error('   From Email: ' + fromEmail + '\n')

    process.exit(1)
  }
}

sendTestEmailToComhar()
