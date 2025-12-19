import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Update the lastViewedMessages timestamp for the current user
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the lastViewedMessages timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastViewedMessages: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating lastViewedMessages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
