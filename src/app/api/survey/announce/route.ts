import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSurveyAnnouncement } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allMembers = await prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ADMIN"] }, notifyEmail: true },
      select: { email: true, name: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || "https://bondsonly.org"
    let sent = 0
    let failed = 0

    for (const member of allMembers) {
      const result = await sendSurveyAnnouncement(
        member.email,
        member.name,
        `${baseUrl}/survey`
      )
      if (result.success) sent++
      else failed++
    }

    console.log(`[SURVEY] Announcement sent: ${sent} success, ${failed} failed`)

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: allMembers.length,
    })
  } catch (error) {
    console.error("[SURVEY] Announcement error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
