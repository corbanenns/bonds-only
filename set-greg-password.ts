import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setGregPassword() {
  try {
    console.log('🔍 Finding Greg Nash in database...')

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'greg', mode: 'insensitive' } },
          { name: { contains: 'Greg Nash', mode: 'insensitive' } },
        ]
      }
    })

    if (!user) {
      console.error('❌ Could not find Greg Nash in database')
      console.log('\nSearching all users...')
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      })
      console.log('Available users:')
      allUsers.forEach(u => console.log(`  - ${u.name} (${u.email})`))
      return
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`)
    console.log(`   ID: ${user.id}`)

    console.log('\n🔐 Hashing password "Marylee27"...')
    const hashedPassword = await bcrypt.hash('Marylee27', 10)

    console.log('💾 Updating user record...')
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        forcePasswordChange: false, // Don't make him reset
      },
      select: {
        id: true,
        email: true,
        name: true,
        forcePasswordChange: true,
      }
    })

    console.log('\n✅ SUCCESS! Password updated for Greg Nash')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Password: Marylee27`)
    console.log(`   Force Password Change: ${updatedUser.forcePasswordChange}`)
    console.log('\n📧 Greg can now login with:')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Password: Marylee27`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setGregPassword()
