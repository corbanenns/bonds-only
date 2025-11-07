import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateMFACode, sendMFACode } from "@/lib/twilio"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate MFA code
    const code = generateMFACode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Save MFA code to database
    await prisma.mFACode.create({
      data: {
        userId: user.id,
        code,
        expires: expiresAt,
      },
    })

    // Send MFA code via SMS
    const result = await sendMFACode(user.phone, code)

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your phone",
      userId: user.id,
    })
  } catch (error) {
    console.error("Error in send-mfa:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
