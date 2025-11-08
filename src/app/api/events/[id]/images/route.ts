import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put, del } from "@vercel/blob"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Only creator or admin can add images
    if (event.createdBy !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB for event photos
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    const fileExtension = file.name.split(".").pop()
    const filename = `events/${id}/${Date.now()}.${fileExtension}`

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Add image URL to event's images array
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        images: {
          push: blob.url,
        },
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ url: blob.url, event: updatedEvent })
  } catch (error) {
    console.error("Error uploading event image:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      )
    }

    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Only creator or admin can delete images
    if (event.createdBy !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Remove image URL from event's images array
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        images: {
          set: event.images.filter((img) => img !== imageUrl),
        },
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Delete from Vercel Blob storage
    try {
      await del(imageUrl)
    } catch (blobError) {
      console.error("Error deleting blob:", blobError)
      // Continue even if blob deletion fails
    }

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error("Error deleting event image:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}
