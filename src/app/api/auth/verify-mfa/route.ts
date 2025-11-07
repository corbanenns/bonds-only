import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and code are required" },
        { status: 400 }
      )
    }

    // Find the most recent unverified MFA code for this user
    const mfaCode = await prisma.mFACode.findFirst({
      where: {
        userId,
        code,
        verified: false,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!mfaCode) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      )
    }

    // Mark the code as verified
    await prisma.mFACode.update({
      where: { id: mfaCode.id },
      data: { verified: true },
    })

    // Clean up old MFA codes for this user
    await prisma.mFACode.deleteMany({
      where: {
        userId,
        id: { not: mfaCode.id },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Verification successful",
    })
  } catch (error) {
    console.error("Error in verify-mfa:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
