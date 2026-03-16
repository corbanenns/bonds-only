import nodemailer from 'nodemailer'
import { sendMFACode } from './twilio'

// Create email transporter (supports both SendGrid and generic SMTP)
const createTransporter = () => {
  // Trim whitespace/newlines from env vars (common copy-paste issue)
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim()
  const smtpHost = process.env.SMTP_HOST?.trim()
  const smtpPort = process.env.SMTP_PORT?.trim()
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPassword = process.env.SMTP_PASSWORD?.trim()

  // If using SendGrid
  if (sendgridApiKey) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'apikey', // This is literal string 'apikey' for SendGrid
        pass: sendgridApiKey,
      },
    })
  }

  // Fallback to generic SMTP
  return nodemailer.createTransport({
    host: smtpHost || 'smtp.gmail.com',
    port: parseInt(smtpPort || '587'),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
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
    console.log(`[EMAIL] Sending to ${to} (${toName})`)
    const transporter = createTransporter()

    // Use SendGrid verified sender or SMTP user
    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER)?.trim()
    console.log(`[EMAIL] From: ${fromEmail}`)

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

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] ✓ Sent to ${to}`, result.messageId)
    return { success: true }
  } catch (error) {
    console.error(`[EMAIL] ✗ Failed to send to ${to}:`, error)
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

export async function sendPasswordResetEmail(
  to: string,
  toName: string,
  resetLink: string
) {
  try {
    console.log(`[EMAIL] Sending password reset to ${to}`)
    const transporter = createTransporter()

    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER)?.trim()

    const mailOptions = {
      from: `"Bonds Only Group" <${fromEmail}>`,
      to,
      subject: 'Reset Your Password - Bonds Only Group',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #d97706; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>

              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </div>

              <div class="warning">
                <strong>This link expires in 30 minutes.</strong><br>
                If you didn't request this password reset, you can safely ignore this email.
              </div>

              <p>If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6366f1;">${resetLink}</p>

              <div class="footer">
                <p>This is an automated message from Bonds Only Group.</p>
                <p>Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] ✓ Password reset email sent to ${to}`, result.messageId)
    return { success: true }
  } catch (error) {
    console.error(`[EMAIL] ✗ Failed to send password reset to ${to}:`, error)
    return { success: false, error: 'Failed to send email' }
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
  console.log(`[NOTIFY] Starting notifications for ${users.length} users`)
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
      console.error(`[NOTIFY] Error notifying user ${user.email}:`, error)
      results.failed++
    }
  }

  console.log(`[NOTIFY] Completed - Emails: ${results.emailsSent}, SMS: ${results.smsSent}, Failed: ${results.failed}`)
  return results
}

export async function sendSurveyAnnouncement(
  to: string,
  toName: string,
  surveyUrl: string
) {
  try {
    console.log(`[EMAIL] Sending survey announcement to ${to}`)
    const transporter = createTransporter()
    const fromEmail = (
      process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER
    )?.trim()

    const mailOptions = {
      from: `"Bonds Only Group" <${fromEmail}>`,
      to,
      subject: "New: 2026 Annual Meeting Poll — Please Respond",
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
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>2026 Annual Meeting Survey</p>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p>We've added a new polling feature to the website to help plan our <strong>2026 Annual Meeting</strong>.</p>
              <div class="message-box">
                <h2>We Need Your Input</h2>
                <p>Please take a moment to share your preferences on:</p>
                <ul>
                  <li><strong>Location</strong> — Jackson Hole, Charlotte, Orlando, or suggest your own</li>
                  <li><strong>Budget</strong> — What you're comfortable spending (ex. accommodations)</li>
                  <li><strong>Attendance</strong> — Whether you're committing and bringing guests</li>
                </ul>
                <p><strong>Deadline: April 1, 2026</strong></p>
              </div>
              <p>All responses are visible to the group so we can make a collective decision.</p>
              <a href="${surveyUrl}" class="button">Take the Survey</a>
              <div class="footer">
                <p>Bonds Only Group — bondsonly.org</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] ✓ Survey announcement sent`, result.messageId)
    return { success: true }
  } catch (error) {
    console.error(`[EMAIL] ✗ Survey announcement failed:`, error)
    return { success: false, error: "Failed" }
  }
}

export async function sendSurveyFirstFollowup(
  to: string,
  toName: string,
  surveyUrl: string
) {
  try {
    console.log(`[EMAIL] Sending survey first follow-up to ${to}`)
    const transporter = createTransporter()
    const fromEmail = (
      process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER
    )?.trim()

    const mailOptions = {
      from: `"Bonds Only Group" <${fromEmail}>`,
      to,
      subject: "Meeting Survey — We Need Your Input",
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
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>Meeting Survey Reminder</p>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p>We haven't heard from you yet on the <strong>2026 Annual Meeting Survey</strong>.</p>
              <div class="message-box">
                <p>Your input is important — it helps us determine the location, set the budget, and hit venue minimums.</p>
                <p>Other members can see who has and hasn't responded. The survey closes <strong>April 1, 2026</strong>.</p>
              </div>
              <a href="${surveyUrl}" class="button">Take the Survey</a>
              <div class="footer">
                <p>Bonds Only Group — bondsonly.org</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] ✓ Survey first follow-up sent`, result.messageId)
    return { success: true }
  } catch (error) {
    console.error(`[EMAIL] ✗ Survey first follow-up failed:`, error)
    return { success: false, error: "Failed" }
  }
}

export async function sendSurveyReminder(
  to: string,
  toName: string,
  surveyUrl: string,
  daysRemaining: number
) {
  try {
    console.log(`[EMAIL] Sending survey reminder to ${to} (${daysRemaining} days left)`)
    const transporter = createTransporter()
    const fromEmail = (
      process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER
    )?.trim()

    let subject: string
    let urgencyText: string

    if (daysRemaining <= 1) {
      subject = "Final Reminder: Survey Closes Today"
      urgencyText = "This is your <strong>last chance</strong> to have your voice heard."
    } else if (daysRemaining <= 2) {
      subject = "Last Day: Meeting Survey Closes Tomorrow"
      urgencyText = "The survey closes <strong>tomorrow</strong>. Please respond today."
    } else {
      subject = `Meeting Survey Closes in ${daysRemaining} Days`
      urgencyText = `The survey closes in <strong>${daysRemaining} days</strong> on April 1st.`
    }

    const mailOptions = {
      from: `"Bonds Only Group" <${fromEmail}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bonds Only Group</h1>
              <p>Meeting Survey Reminder</p>
            </div>
            <div class="content">
              <p>Hello ${toName},</p>
              <p>We still need your input on the <strong>2026 Annual Meeting</strong>.</p>
              <div class="message-box">
                <p>${urgencyText}</p>
                <p>Your response helps us hit venue minimums and set the budget. Other members can see who hasn't responded yet.</p>
              </div>
              <a href="${surveyUrl}" class="button">Respond Now</a>
              <div class="footer">
                <p>Bonds Only Group — bondsonly.org</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`[EMAIL] ✓ Survey reminder sent`, result.messageId)
    return { success: true }
  } catch (error) {
    console.error(`[EMAIL] ✗ Survey reminder failed:`, error)
    return { success: false, error: "Failed" }
  }
}
