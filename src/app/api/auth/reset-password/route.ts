import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      )
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 }
      )
    }

    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          forcePasswordChange: false,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    console.log(`[RESET-PASSWORD] Password reset successful for user ${resetToken.user.email}`)

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully.",
    })
  } catch (error) {
    console.error("[RESET-PASSWORD] Error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}

// GET endpoint to validate token (for client-side validation)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: {
        used: true,
        expires: true,
        user: {
          select: { name: true },
        },
      },
    })

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: "Invalid reset link" })
    }

    if (resetToken.used) {
      return NextResponse.json({ valid: false, error: "This reset link has already been used" })
    }

    if (resetToken.expires < new Date()) {
      return NextResponse.json({ valid: false, error: "This reset link has expired" })
    }

    return NextResponse.json({
      valid: true,
      userName: resetToken.user.name,
    })
  } catch (error) {
    console.error("[RESET-PASSWORD] Validation error:", error)
    return NextResponse.json(
      { valid: false, error: "An error occurred" },
      { status: 500 }
    )
  }
}
