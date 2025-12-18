import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Get unread posts for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get IDs of posts this user has read
    const readPostIds = await prisma.postRead.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        postId: true,
      },
    })

    const readIds = readPostIds.map((r) => r.postId)

    // Get unread top-level posts (not replies)
    const unreadPosts = await prisma.post.findMany({
      where: {
        parentId: null, // Only top-level posts
        id: {
          notIn: readIds.length > 0 ? readIds : ["none"], // Prisma requires non-empty array
        },
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit for dashboard widget
    })

    // Also get total unread count
    const unreadCount = await prisma.post.count({
      where: {
        parentId: null,
        id: {
          notIn: readIds.length > 0 ? readIds : ["none"],
        },
      },
    })

    return NextResponse.json({
      posts: unreadPosts,
      count: unreadCount,
    })
  } catch (error) {
    console.error("Error fetching unread posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
