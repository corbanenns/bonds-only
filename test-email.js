const nodemailer = require('nodemailer')
require('dotenv').config({ path: '.env.local' })

async function sendTestEmail() {
  console.log('🔧 Checking environment variables...')

  // Check which method is available
  const usingSendGrid = !!process.env.SENDGRID_API_KEY
  const usingGenericSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

  console.log('SendGrid API Key:', process.env.SENDGRID_API_KEY ? '✓ Found' : '✗ Not found')
  console.log('SMTP Host:', process.env.SMTP_HOST || 'Not set')
  console.log('SMTP User:', process.env.SMTP_USER || 'Not set')
  console.log('SMTP Password:', process.env.SMTP_PASSWORD ? '✓ Set' : '✗ Not set')

  if (!usingSendGrid && !usingGenericSMTP) {
    console.error('\n❌ ERROR: No email configuration found!')
    console.error('Please set either:')
    console.error('  - SENDGRID_API_KEY + SENDGRID_FROM_EMAIL')
    console.error('  - SMTP_HOST + SMTP_USER + SMTP_PASSWORD')
    process.exit(1)
  }

  console.log('\n📧 Creating email transporter...')

  let transporter
  if (usingSendGrid) {
    console.log('Using SendGrid configuration')
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
    console.log('Using generic SMTP configuration')
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

  const testData = {
    title: 'Welcome to Bonds Only Group! 🎉',
    content: 'This is a test message to verify that email notifications are working correctly. When members post new messages on the message board, you\'ll receive notifications just like this one with the full post content and a link to view it online.',
    author: 'Claude (Testing)',
  }

  console.log('\n📤 Sending test email to: corban.enns@gmail.com')
  console.log('Subject:', `New Message: ${testData.title}`)

  try {
    const result = await transporter.sendMail({
      from: `"Bonds Only Group" <${fromEmail}>`,
      to: 'corban.enns@gmail.com',
      subject: `New Message: ${testData.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
            .test-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>New Message Board Post</p>
            </div>
            <div class="content">
              <div class="test-badge">🧪 TEST EMAIL</div>
              <p>Hello Corban,</p>
              <p><strong>${testData.author}</strong> posted a new message:</p>

              <div class="message-box">
                <h2>${testData.title}</h2>
                <p>${testData.content}</p>
              </div>

              <a href="https://bondsonly.org/messages" class="button">View Full Message</a>

              <div class="footer">
                <p>✅ <strong>Email notifications are working!</strong></p>
                <p>You're receiving this because you have email notifications enabled.</p>
                <p>To change your notification preferences, log in to your account settings.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    console.log('\n✅ SUCCESS! Email sent!')
    console.log('Message ID:', result.messageId)
    console.log('\n📬 Check your inbox at: corban.enns@gmail.com')
    console.log('(Don\'t forget to check spam folder if you don\'t see it)')

    if (usingSendGrid) {
      console.log('\n🔍 You can also check SendGrid Activity Feed:')
      console.log('   https://app.sendgrid.com/email_activity')
    }

  } catch (error) {
    console.error('\n❌ ERROR sending email:')
    console.error(error.message)

    if (error.message.includes('Invalid login')) {
      console.error('\n💡 TIP: Check your SMTP credentials')
      if (usingSendGrid) {
        console.error('   - Make sure SENDGRID_API_KEY is correct')
        console.error('   - Verify it starts with "SG."')
        console.error('   - Check it has "Mail Send" permission')
      }
    }

    if (error.message.includes('from address')) {
      console.error('\n💡 TIP: Verify your sender email in SendGrid')
      console.error('   https://app.sendgrid.com/settings/sender_auth')
    }

    process.exit(1)
  }
}

sendTestEmail()
