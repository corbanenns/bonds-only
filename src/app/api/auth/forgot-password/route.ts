import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/notifications"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[FORGOT-PASSWORD] No user found for email: ${email}`)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      })
    }

    // Generate secure token (64 hex characters)
    const token = crypto.randomBytes(32).toString("hex")

    // Set expiration to 30 minutes from now
    const expires = new Date(Date.now() + 30 * 60 * 1000)

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    })

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })

    // Build reset link
    const baseUrl = process.env.NEXTAUTH_URL || "https://bondsonly.org"
    const resetLink = `${baseUrl}/reset-password/${token}`

    // Send email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink
    )

    if (!emailResult.success) {
      console.error(`[FORGOT-PASSWORD] Failed to send email to ${user.email}`)
      // Still return success to prevent enumeration
    } else {
      console.log(`[FORGOT-PASSWORD] Reset email sent to ${user.email}`)
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    })
  } catch (error) {
    console.error("[FORGOT-PASSWORD] Error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
