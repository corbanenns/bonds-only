import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const posts = await prisma.post.findMany({
      where: {
        parentId: null, // Only get top-level posts
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
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
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, parentId } = await req.json()

    // For replies, title is optional (will use parent's title)
    if (!content || (!parentId && !title)) {
      return NextResponse.json(
        { error: parentId ? "Content is required" : "Title and content are required" },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title: title || "Reply", // Default title for replies
        content,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // NOTIFICATIONS DISABLED - Now handled by scheduled cron job at 3 AM PST
    // This ensures users only get notified if they haven't logged in since the last post
    // See: src/app/api/cron/send-notifications/route.ts
    console.log('[POST] Post created successfully. Notifications will be sent by scheduled job.')

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
