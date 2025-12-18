import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST: Mark posts as read for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postIds } = await req.json()

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: "postIds array is required" },
        { status: 400 }
      )
    }

    // Use createMany with skipDuplicates to handle already-read posts
    await prisma.postRead.createMany({
      data: postIds.map((postId: string) => ({
        postId,
        userId: session.user.id,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, markedCount: postIds.length })
  } catch (error) {
    console.error("Error marking posts as read:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: Mark all posts as unread (useful for testing or "mark as unread" feature)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all read records for this user
    await prisma.postRead.deleteMany({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing read status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
