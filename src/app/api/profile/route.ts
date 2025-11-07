import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        agencyName: true,
        address: true,
        role: true,
        notifyEmail: true,
        notifySms: true,
        profilePicture: true,
        linkedinUrl: true,
        profileCompleted: true,
        forcePasswordChange: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      name,
      email,
      phone,
      agencyName,
      address,
      notifyEmail,
      notifySms,
      currentPassword,
      newPassword,
      profilePicture,
      linkedinUrl,
      profileCompleted,
    } = await req.json()

    // If changing email or phone, check they're not already taken
    if (email || phone) {
      const existing = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: session.user.id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
              ],
            },
          ],
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Email or phone already in use" },
          { status: 400 }
        )
      }
    }

    // If changing password, verify current password
    let hashedPassword
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        )
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      )

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      hashedPassword = await bcrypt.hash(newPassword, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(agencyName !== undefined && { agencyName }),
        ...(address !== undefined && { address }),
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifySms !== undefined && { notifySms }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(profilePicture !== undefined && { profilePicture }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(profileCompleted !== undefined && { profileCompleted }),
        // Clear forcePasswordChange flag when password is changed
        ...(hashedPassword && { forcePasswordChange: false }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        agencyName: true,
        address: true,
        role: true,
        notifyEmail: true,
        notifySms: true,
        profilePicture: true,
        linkedinUrl: true,
        profileCompleted: true,
        forcePasswordChange: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
