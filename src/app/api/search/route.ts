import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase()

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { agencyName: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        agencyName: true,
        agency: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    })

    // Search posts
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { content: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
      take: 5,
    })

    // Search events
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { location: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
      },
      take: 5,
    })

    // Search links
    const links = await prisma.link.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { url: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        category: true,
      },
      take: 5,
    })

    // Search agencies
    const agencies = await prisma.agency.findMany({
      where: {
        name: { contains: searchTerm },
      },
      select: {
        id: true,
        name: true,
        address: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      take: 5,
    })

    return NextResponse.json({
      results: {
        users,
        posts,
        events,
        links,
        agencies,
      },
    })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
