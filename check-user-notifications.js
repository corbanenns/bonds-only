const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkUserNotifications() {
  try {
    console.log('🔍 Checking notification settings for corban@comharconsulting.com...\n')

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'corban@comharconsulting.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        notifyEmail: true,
        notifySms: true,
        phone: true,
      },
    })

    if (!user) {
      console.log('❌ User not found: corban@comharconsulting.com')
      console.log('\nAvailable users:')

      const allUsers = await prisma.user.findMany({
        select: { email: true, name: true },
      })

      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name})`)
      })

      await prisma.$disconnect()
      process.exit(1)
    }

    console.log('✅ User found!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Name:           ${user.name}`)
    console.log(`Email:          ${user.email}`)
    console.log(`Role:           ${user.role}`)
    console.log(`Email Notify:   ${user.notifyEmail ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log(`SMS Notify:     ${user.notifySms ? '✅ ENABLED' : '❌ DISABLED'}`)
    console.log(`Phone:          ${user.phone || 'Not set'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (!user.notifyEmail) {
      console.log('⚠️  EMAIL NOTIFICATIONS ARE DISABLED!')
      console.log('\nThis is likely why you\'re not receiving emails.\n')
      console.log('To enable email notifications:')
      console.log('1. Log into https://bondsonly.org')
      console.log('2. Go to Settings')
      console.log('3. Toggle "Email Notifications" to ON')
      console.log('4. Click "Save Preferences"\n')

      console.log('OR run this command to enable it now:\n')
      console.log('node enable-email-notifications.js corban@comharconsulting.com\n')
    } else {
      console.log('✅ Email notifications are ENABLED')
      console.log('\nYou should be receiving emails. Let\'s check other potential issues:')
      console.log('1. Verify sender email in SendGrid')
      console.log('2. Check SendGrid activity logs for bounces')
      console.log('3. Check spam folder in your email')
      console.log('4. Run test-email-to-comhar.js to send a test email\n')
    }

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkUserNotifications()
