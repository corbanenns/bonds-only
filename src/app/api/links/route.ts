import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const links = await prisma.link.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(links)
  } catch (error) {
    console.error("Error fetching links:", error)
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

    const formData = await req.formData()
    const title = formData.get("title") as string
    const url = formData.get("url") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const file = formData.get("file") as File | null

    if (!title || !url) {
      return NextResponse.json(
        { error: "Title and URL are required" },
        { status: 400 }
      )
    }

    // Handle file upload if provided
    let attachmentUrl = null
    let attachmentName = null
    let attachmentSize = null
    let attachmentType = null

    if (file && file.size > 0) {
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        )
      }

      // Create unique filename for Vercel Blob
      const fileExtension = file.name.split(".").pop()
      const filename = `resources/${session.user.id}-${Date.now()}.${fileExtension}`

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      attachmentUrl = blob.url
      attachmentName = file.name
      attachmentSize = file.size
      attachmentType = file.type
    }

    const link = await prisma.link.create({
      data: {
        title,
        url,
        description: description || null,
        category: category || null,
        addedBy: session.user.id,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentType,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error("Error creating link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
