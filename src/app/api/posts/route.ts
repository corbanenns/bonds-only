import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyUsers } from "@/lib/notifications"

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

    // Send notifications to users (async, don't wait)
    prisma.user
      .findMany({
        where: {
          id: { not: session.user.id }, // Don't notify the author
          OR: [
            { notifyEmail: true },
            { notifySms: true },
          ],
        },
        select: {
          email: true,
          name: true,
          phone: true,
          notifyEmail: true,
          notifySms: true,
        },
      })
      .then((users) => {
        console.log(`[NOTIFICATION] Post by ${post.author.name} (${session.user.email})`)
        console.log(`[NOTIFICATION] Found ${users.length} users to notify:`,
          users.map(u => `${u.name} (email:${u.notifyEmail}, sms:${u.notifySms})`).join(', '))

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        return notifyUsers(users, {
          title: post.title,
          content: post.content,
          author: post.author.name,
          link: `${baseUrl}/messages`,
        })
      })
      .then((results) => {
        console.log(`[NOTIFICATION] Results: ${results.emailsSent} emails sent, ${results.smsSent} SMS sent, ${results.failed} failed`)
        return results
      })
      .catch((error) => {
        console.error('[NOTIFICATION] Error sending notifications:', error)
      })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
