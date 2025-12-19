/**
 * Test the scheduled notification logic manually
 * This simulates what the cron job will do at 3 AM PST
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testNotificationLogic() {
  try {
    console.log('🧪 Testing Scheduled Notification Logic\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Find the most recent post
    const mostRecentPost = await prisma.post.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!mostRecentPost) {
      console.log('❌ No posts found. Nothing to test.')
      await prisma.$disconnect()
      return
    }

    console.log('📝 Most Recent Post:')
    console.log(`   Title: "${mostRecentPost.title}"`)
    console.log(`   Author: ${mostRecentPost.author.name}`)
    console.log(`   Created: ${mostRecentPost.createdAt.toLocaleString()}`)
    console.log()

    // Find all users (for comparison)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastViewedMessages: true,
        notifyEmail: true,
        notifySms: true,
      },
    })

    console.log('👥 All Users:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    allUsers.forEach(user => {
      const lastViewedStr = user.lastViewedMessages
        ? user.lastViewedMessages.toLocaleString()
        : 'Never'
      const willNotify = shouldNotifyUser(user, mostRecentPost)
      const icon = willNotify ? '✅' : '❌'
      console.log(`${icon} ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Last Viewed Messages: ${lastViewedStr}`)
      console.log(`   Email Notifications: ${user.notifyEmail ? 'ON' : 'OFF'}`)
      console.log(`   SMS Notifications: ${user.notifySms ? 'ON' : 'OFF'}`)
      console.log(`   Will be notified: ${willNotify ? 'YES' : 'NO'}`)
      if (!willNotify) {
        console.log(`   Reason: ${getNotNotifyReason(user, mostRecentPost)}`)
      }
      console.log()
    })

    // Find users who WILL be notified
    const usersToNotify = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: mostRecentPost.author.id } },
          {
            OR: [
              { notifyEmail: true },
              { notifySms: true },
            ],
          },
          {
            OR: [
              { lastViewedMessages: null },
              { lastViewedMessages: { lt: mostRecentPost.createdAt } },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        notifyEmail: true,
        notifySms: true,
        lastViewedMessages: true,
      },
    })

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📊 Summary:`)
    console.log(`   Total users: ${allUsers.length}`)
    console.log(`   Users to notify: ${usersToNotify.length}`)
    console.log()

    if (usersToNotify.length > 0) {
      console.log('✅ The following users WILL receive notifications:')
      usersToNotify.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`)
      })
      console.log()
      console.log('💡 To actually send notifications, call the cron endpoint:')
      console.log(`   curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/send-notifications`)
    } else {
      console.log('ℹ️  No users will be notified.')
      console.log('   All users have either:')
      console.log('   - Viewed messages since the last post')
      console.log('   - Are the author of the last post')
      console.log('   - Have notifications disabled')
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    await prisma.$disconnect()
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
    await prisma.$disconnect()
    process.exit(1)
  }
}

function shouldNotifyUser(user, mostRecentPost) {
  // Don't notify the author
  if (user.id === mostRecentPost.author.id) return false

  // Must have notifications enabled
  if (!user.notifyEmail && !user.notifySms) return false

  // Must not have viewed messages since the post (or never viewed)
  if (!user.lastViewedMessages) return true
  return user.lastViewedMessages < mostRecentPost.createdAt
}

function getNotNotifyReason(user, mostRecentPost) {
  if (user.id === mostRecentPost.author.id) {
    return 'User is the author of the most recent post'
  }
  if (!user.notifyEmail && !user.notifySms) {
    return 'Notifications are disabled'
  }
  if (user.lastViewedMessages && user.lastViewedMessages >= mostRecentPost.createdAt) {
    return 'User viewed messages after the most recent post'
  }
  return 'Unknown'
}

testNotificationLogic()
