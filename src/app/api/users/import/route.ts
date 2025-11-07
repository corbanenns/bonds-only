import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { users } = await req.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const userData of users) {
      try {
        const { name, email, phone, agencyName, address, role } = userData

        if (!name || !email || !phone) {
          results.failed++
          results.errors.push(`Missing required fields for: ${name || email || "Unknown"}`)
          continue
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { phone },
            ],
          },
        })

        if (existingUser) {
          results.failed++
          results.errors.push(`User already exists: ${email}`)
          continue
        }

        // Generate default password (can be changed later)
        const defaultPassword = "BondsOnly2025!"
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        await prisma.user.create({
          data: {
            name,
            email,
            phone,
            password: hashedPassword,
            role: role === "ADMIN" ? "ADMIN" : "MEMBER",
            agencyName: agencyName || null,
            address: address || null,
          },
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Error importing ${userData.name || userData.email}: ${error.message}`)
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
