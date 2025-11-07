import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

const client = twilio(accountSid, authToken)

export async function sendMFACode(phoneNumber: string, code: string) {
  try {
    await client.messages.create({
      body: `Your Bonds Only verification code is: ${code}. This code will expire in 5 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending SMS:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

export function generateMFACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
