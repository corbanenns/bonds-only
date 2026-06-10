import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// RSVP configuration
// June 16, 2026, 11:59 PM Eastern (Charleston). After this the RSVP is closed.
const RSVP_DEADLINE = new Date("2026-06-16T23:59:59-04:00")

const VALID_ATTENDANCE = ["YES", "NO", "MAYBE"] as const
type Attendance = (typeof VALID_ATTENDANCE)[number]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const isClosed = now > RSVP_DEADLINE

    // Fetch all RSVPs with user info
    const responses = await prisma.meetingRsvp.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Fetch all members (MEMBER + ADMIN roles) for non-respondent list
    const allMembers = await prisma.user.findMany({
      where: { role: { in: ["MEMBER", "ADMIN"] } },
      select: { id: true, name: true, email: true, profilePicture: true },
      orderBy: { name: "asc" },
    })

    const respondentIds = new Set(responses.map((r) => r.userId))
    const nonRespondents = allMembers.filter((m) => !respondentIds.has(m.id))

    // Current user's response
    const myResponse =
      responses.find((r) => r.userId === session.user.id) || null

    // Aggregate stats
    let yesCount = 0
    let noCount = 0
    let maybeCount = 0
    let confirmedPeople = 0
    let confirmedRooms = 0
    let tentativePeople = 0
    let tentativeRooms = 0

    for (const r of responses) {
      if (r.attendance === "YES") {
        yesCount++
        confirmedPeople += 1 + r.guestCount
        confirmedRooms += r.roomCount
      } else if (r.attendance === "MAYBE") {
        maybeCount++
        tentativePeople += 1 + r.guestCount
        tentativeRooms += r.roomCount
      } else {
        noCount++
      }
    }

    const aggregates = {
      yesCount,
      noCount,
      maybeCount,
      confirmedPeople,
      confirmedRooms,
      tentativePeople,
      tentativeRooms,
      responseCount: responses.length,
      totalMemberCount: allMembers.length,
    }

    return NextResponse.json({
      myResponse,
      responses,
      nonRespondents,
      aggregates,
      isClosed,
      deadline: RSVP_DEADLINE.toISOString(),
    })
  } catch (error) {
    console.error("[RSVP] GET error:", error)
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

    // Check deadline
    const now = new Date()
    if (now > RSVP_DEADLINE) {
      return NextResponse.json(
        { error: "RSVP is closed. The deadline was June 16, 2026." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { attendance } = body as { attendance?: string }

    // Validation
    const errors: string[] = []

    if (!attendance || !VALID_ATTENDANCE.includes(attendance as Attendance)) {
      errors.push("Please select whether you are attending")
    }

    // Counts only apply when attending or tentative; No zeroes them out.
    const isAttendingOrMaybe = attendance === "YES" || attendance === "MAYBE"
    let guestCount = isAttendingOrMaybe ? Number(body.guestCount) : 0
    let roomCount = isAttendingOrMaybe ? Number(body.roomCount) : 0

    if (isAttendingOrMaybe) {
      if (!Number.isInteger(guestCount) || guestCount < 0 || guestCount > 10) {
        errors.push("Number of guests must be between 0 and 10")
      }
      if (!Number.isInteger(roomCount) || roomCount < 0 || roomCount > 10) {
        errors.push("Number of rooms must be between 0 and 10")
      }
    } else {
      guestCount = 0
      roomCount = 0
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 })
    }

    const userId = session.user.id

    const existing = await prisma.meetingRsvp.findUnique({ where: { userId } })

    await prisma.meetingRsvp.upsert({
      where: { userId },
      create: {
        userId,
        attendance: attendance as Attendance,
        guestCount,
        roomCount,
      },
      update: {
        attendance: attendance as Attendance,
        guestCount,
        roomCount,
      },
    })

    return NextResponse.json(
      { message: existing ? "RSVP updated" : "RSVP submitted" },
      { status: existing ? 200 : 201 }
    )
  } catch (error) {
    console.error("[RSVP] POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
