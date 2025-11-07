import nodemailer from 'nodemailer'
import { sendMFACode } from './twilio'

// Create email transporter (supports both SendGrid and generic SMTP)
const createTransporter = () => {
  // If using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'apikey', // This is literal string 'apikey' for SendGrid
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }

  // Fallback to generic SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export interface NotificationData {
  title: string
  content: string
  author: string
  link?: string
}

export async function sendEmailNotification(
  to: string,
  toName: string,
  data: NotificationData
) {
  try {
    const transporter = createTransporter()

    // Use SendGrid verified sender or SMTP user
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER

    const mailOptions = {
      from: `"Bonds Only Group" <${fromEmail}>`,
      to,
      subject: `New Message: ${data.title}`,
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>New Message Board Post</p>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p><strong>${data.author}</strong> posted a new message:</p>

              <div class="message-box">
                <h2>${data.title}</h2>
                <p>${data.content.substring(0, 200)}${data.content.length > 200 ? '...' : ''}</p>
              </div>

              ${data.link ? `<a href="${data.link}" class="button">View Full Message</a>` : ''}

              <div class="footer">
                <p>You're receiving this because you have email notifications enabled.</p>
                <p>To change your notification preferences, log in to your account settings.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error sending email notification:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendSmsNotification(
  phone: string,
  data: NotificationData
) {
  try {
    const message = `Bonds Only Group - New post by ${data.author}: "${data.title}". ${data.link ? `View: ${data.link}` : ''}`

    // Reuse Twilio function but with different message
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending SMS notification:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

export async function notifyUsers(
  users: Array<{
    email: string
    name: string
    phone: string
    notifyEmail: boolean
    notifySms: boolean
  }>,
  data: NotificationData
) {
  const results = {
    emailsSent: 0,
    smsSent: 0,
    failed: 0,
  }

  for (const user of users) {
    try {
      if (user.notifyEmail) {
        const result = await sendEmailNotification(user.email, user.name, data)
        if (result.success) results.emailsSent++
        else results.failed++
      }

      if (user.notifySms && process.env.TWILIO_ACCOUNT_SID) {
        const result = await sendSmsNotification(user.phone, data)
        if (result.success) results.smsSent++
        else results.failed++
      }
    } catch (error) {
      console.error(`Error notifying user ${user.email}:`, error)
      results.failed++
    }
  }

  return results
}
