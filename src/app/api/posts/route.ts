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

    const { title, content } = await req.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: session.user.id,
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
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        return notifyUsers(users, {
          title: post.title,
          content: post.content,
          author: post.author.name,
          link: `${baseUrl}/messages`,
        })
      })
      .catch((error) => {
        console.error('Error sending notifications:', error)
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
