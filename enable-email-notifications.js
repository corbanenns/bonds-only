const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function enableEmailNotifications() {
  const email = process.argv[2]

  if (!email) {
    console.log('Usage: node enable-email-notifications.js <email>')
    console.log('Example: node enable-email-notifications.js corban@comharconsulting.com')
    await prisma.$disconnect()
    process.exit(1)
  }

  try {
    console.log(`🔧 Enabling email notifications for: ${email}...\n`)

    const user = await prisma.user.update({
      where: { email },
      data: { notifyEmail: true },
      select: {
        email: true,
        name: true,
        notifyEmail: true,
        notifySms: true,
      },
    })

    console.log('✅ Success! Email notifications enabled.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Name:           ${user.name}`)
    console.log(`Email:          ${user.email}`)
    console.log(`Email Notify:   ${user.notifyEmail ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log(`SMS Notify:     ${user.notifySms ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log(`${user.email} will now receive email notifications when new messages are posted.\n`)

    await prisma.$disconnect()
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User not found: ${email}\n`)

      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
      })

      console.log('Available users:')
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name})`)
      })
    } else {
      console.error('Error:', error.message)
    }

    await prisma.$disconnect()
    process.exit(1)
  }
}

enableEmailNotifications()
