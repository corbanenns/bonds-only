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

    const agencies = await prisma.agency.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(agencies)
  } catch (error) {
    console.error("Error fetching agencies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, address, phone, email, website } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Agency name is required" },
        { status: 400 }
      )
    }

    // Check if agency already exists
    const existingAgency = await prisma.agency.findUnique({
      where: { name },
    })

    if (existingAgency) {
      return NextResponse.json(
        { error: "Agency with this name already exists" },
        { status: 400 }
      )
    }

    const agency = await prisma.agency.create({
      data: {
        name,
        address,
        phone,
        email,
        website,
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(agency, { status: 201 })
  } catch (error) {
    console.error("Error creating agency:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
