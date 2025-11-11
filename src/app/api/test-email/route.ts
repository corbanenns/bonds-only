import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmailNotification } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admins to use this endpoint
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { to } = await req.json()

    if (!to) {
      return NextResponse.json(
        { error: "Recipient email 'to' is required" },
        { status: 400 }
      )
    }

    console.log(`[TEST-EMAIL] Admin ${session.user.email} testing email to ${to}`)

    const testData = {
      title: "🧪 Email Notification Test",
      content:
        "This is a test message from Bonds Only Group to verify that email notifications are working correctly. If you're reading this, email delivery is functioning! When members post new messages on the message board, you'll receive notifications just like this one.",
      author: "System Test",
      link: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/messages`,
    }

    const result = await sendEmailNotification(to, "Test Recipient", testData)

    if (result.success) {
      console.log(`[TEST-EMAIL] ✓ Successfully sent test email to ${to}`)
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log(`[TEST-EMAIL] ✗ Failed to send test email to ${to}`)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
          details: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[TEST-EMAIL] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET method for quick browser testing
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only allow admins to use this endpoint
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const to = searchParams.get("to")

    if (!to) {
      return NextResponse.json(
        {
          error: "Recipient email 'to' query parameter is required",
          usage: "GET /api/test-email?to=email@example.com",
        },
        { status: 400 }
      )
    }

    console.log(`[TEST-EMAIL] Admin ${session.user.email} testing email to ${to}`)

    const testData = {
      title: "🧪 Email Notification Test",
      content:
        "This is a test message from Bonds Only Group to verify that email notifications are working correctly. If you're reading this, email delivery is functioning! When members post new messages on the message board, you'll receive notifications just like this one.",
      author: "System Test",
      link: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/messages`,
    }

    const result = await sendEmailNotification(to, "Test Recipient", testData)

    if (result.success) {
      console.log(`[TEST-EMAIL] ✓ Successfully sent test email to ${to}`)
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
        timestamp: new Date().toISOString(),
        note: "Check your inbox (and spam folder) for the test email",
      })
    } else {
      console.log(`[TEST-EMAIL] ✗ Failed to send test email to ${to}`)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
          details: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[TEST-EMAIL] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
