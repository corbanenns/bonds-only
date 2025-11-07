require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Updating Kara Skinner and Sara O\'Linn to admin role...')

  // Update Kara Skinner
  const kara = await prisma.user.updateMany({
    where: {
      email: 'kara@integritysurety.com'
    },
    data: {
      role: 'ADMIN'
    }
  })

  // Update Sara O'Linn (note: it's Sarah in the database)
  const sara = await prisma.user.updateMany({
    where: {
      email: 'sarah@floridasuretybonds.com'
    },
    data: {
      role: 'ADMIN'
    }
  })

  console.log(`✅ Updated ${kara.count + sara.count} users to ADMIN role`)

  // List all admins
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN'
    },
    select: {
      name: true,
      email: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  console.log('\nAll admins:')
  admins.forEach((admin) => {
    console.log(`- ${admin.name} (${admin.email})`)
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
