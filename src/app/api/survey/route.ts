import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Survey configuration
const SURVEY_DEADLINE = new Date("2026-04-01T23:59:59-07:00") // April 1 PST

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const isClosed = now > SURVEY_DEADLINE

    // Fetch all responses with user info and change history
    const responses = await prisma.surveyResponse.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
        history: {
          orderBy: { changedAt: "desc" },
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
    const myResponse = responses.find((r) => r.userId === session.user.id) || null

    // Aggregate stats
    const locationCounts: Record<string, number> = {}
    let budgetTotal = 0
    let budgetMin = Infinity
    let budgetMax = 0
    let totalMembers = 0
    let totalGuests = 0
    let totalCommitted = 0

    for (const r of responses) {
      const locLabel =
        r.locationChoice === "OTHER" ? r.locationOther || "Other" : r.locationChoice
      locationCounts[locLabel] = (locationCounts[locLabel] || 0) + 1

      budgetTotal += r.budgetPerMember
      budgetMin = Math.min(budgetMin, r.budgetPerMember)
      budgetMax = Math.max(budgetMax, r.budgetPerMember)
      totalMembers++
      totalGuests += r.guestCount
      if (r.committedToAttend) totalCommitted++
    }

    const aggregates = {
      locationCounts,
      budgetAvg: totalMembers > 0 ? Math.round(budgetTotal / totalMembers) : 0,
      budgetMin: totalMembers > 0 ? budgetMin : 0,
      budgetMax: totalMembers > 0 ? budgetMax : 0,
      totalMembers,
      totalGuests,
      totalAttendees: totalMembers + totalGuests,
      totalCommitted,
      totalMemberCount: allMembers.length,
      responseCount: responses.length,
    }

    return NextResponse.json({
      myResponse,
      responses,
      nonRespondents,
      aggregates,
      isClosed,
      deadline: SURVEY_DEADLINE.toISOString(),
    })
  } catch (error) {
    console.error("[SURVEY] GET error:", error)
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
    if (now > SURVEY_DEADLINE) {
      return NextResponse.json(
        { error: "Survey is closed. The deadline was April 1, 2026." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { locationChoice, locationOther, budgetPerMember, committedToAttend, guestCount, guestBudget } = body

    // Validation
    const errors: string[] = []

    const validLocations = ["JACKSON_HOLE", "CHARLOTTE", "ORLANDO", "OTHER"]
    if (!validLocations.includes(locationChoice)) {
      errors.push("Invalid location choice")
    }
    if (locationChoice === "OTHER" && (!locationOther || !locationOther.trim())) {
      errors.push("Please specify a location when selecting Other")
    }
    if (!budgetPerMember || budgetPerMember < 100 || budgetPerMember > 10000) {
      errors.push("Budget must be between $100 and $10,000")
    }
    if (guestCount < 0 || guestCount > 10) {
      errors.push("Guest count must be between 0 and 10")
    }
    if (guestCount > 0 && (guestBudget === null || guestBudget === undefined || guestBudget < 50 || guestBudget > 5000)) {
      errors.push("Guest budget must be between $50 and $5,000 when bringing guests")
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 })
    }

    const userId = session.user.id

    // Check for existing response
    const existing = await prisma.surveyResponse.findUnique({
      where: { userId },
    })

    if (existing) {
      // Log changes to history
      const fields = [
        { key: "locationChoice", old: existing.locationChoice, new: locationChoice },
        { key: "locationOther", old: existing.locationOther || "", new: locationOther || "" },
        { key: "budgetPerMember", old: String(existing.budgetPerMember), new: String(budgetPerMember) },
        { key: "committedToAttend", old: String(existing.committedToAttend), new: String(committedToAttend) },
        { key: "guestCount", old: String(existing.guestCount), new: String(guestCount) },
        { key: "guestBudget", old: String(existing.guestBudget ?? ""), new: String(guestBudget ?? "") },
      ]

      const changes = fields.filter((f) => f.old !== f.new)

      if (changes.length > 0) {
        await prisma.$transaction([
          prisma.surveyResponse.update({
            where: { userId },
            data: {
              locationChoice,
              locationOther: locationChoice === "OTHER" ? locationOther?.trim() : null,
              budgetPerMember,
              committedToAttend: committedToAttend ?? false,
              guestCount,
              guestBudget: guestCount > 0 ? guestBudget : null,
            },
          }),
          ...changes.map((c) =>
            prisma.surveyResponseHistory.create({
              data: {
                responseId: existing.id,
                userId,
                fieldChanged: c.key,
                oldValue: c.old,
                newValue: c.new,
              },
            })
          ),
        ])
      }

      return NextResponse.json({ message: "Response updated" })
    }

    // Create new response
    await prisma.surveyResponse.create({
      data: {
        userId,
        locationChoice,
        locationOther: locationChoice === "OTHER" ? locationOther?.trim() : null,
        budgetPerMember,
        committedToAttend: committedToAttend ?? false,
        guestCount,
        guestBudget: guestCount > 0 ? guestBudget : null,
      },
    })

    return NextResponse.json({ message: "Response submitted" }, { status: 201 })
  } catch (error) {
    console.error("[SURVEY] POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
