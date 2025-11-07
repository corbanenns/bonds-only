import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Updating all existing members to require onboarding...")

  // Update all members who have the default password to require password change
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { forcePasswordChange: false },
        { profileCompleted: false },
      ],
    },
    data: {
      forcePasswordChange: true,
      profileCompleted: false,
    },
  })

  console.log(`✅ Updated ${result.count} users to require onboarding`)

  // List all users and their onboarding status
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      forcePasswordChange: true,
      profileCompleted: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  console.log("\nAll users:")
  users.forEach((user) => {
    console.log(
      `- ${user.name} (${user.email}): forcePasswordChange=${user.forcePasswordChange}, profileCompleted=${user.profileCompleted}`
    )
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
