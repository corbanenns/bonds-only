import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Debug endpoint to check environment variables in production
 * SECURITY: Only accessible to ADMIN users
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admins
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const envStatus = {
      SENDGRID_API_KEY: {
        exists: !!process.env.SENDGRID_API_KEY,
        value: process.env.SENDGRID_API_KEY
          ? process.env.SENDGRID_API_KEY.substring(0, 10) + "..."
          : "NOT SET",
      },
      SENDGRID_FROM_EMAIL: {
        exists: !!process.env.SENDGRID_FROM_EMAIL,
        value: process.env.SENDGRID_FROM_EMAIL || "NOT SET",
      },
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || "NOT SET",
      },
      TWILIO_ACCOUNT_SID: {
        exists: !!process.env.TWILIO_ACCOUNT_SID,
        value: process.env.TWILIO_ACCOUNT_SID
          ? process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + "..."
          : "NOT SET",
      },
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    return NextResponse.json({
      message: "Environment variable status",
      environment: envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking environment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
