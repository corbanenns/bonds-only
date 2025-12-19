/**
 * Debug script to diagnose unread messages and notification issues
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function debugUnreadIssue() {
  try {
    console.log('🔍 Debugging Unread Messages & Notification Issues\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        lastViewedMessages: true,
        notifyEmail: true,
        notifySms: true,
      },
    })

    // Get recent posts (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log('📝 RECENT POSTS (Last 7 Days):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (recentPosts.length === 0) {
      console.log('   No posts in the last 7 days\n')
    } else {
      recentPosts.forEach((post, i) => {
        const isReply = post.parentId !== null
        const typeIcon = isReply ? '↳ REPLY' : '📄 POST'
        console.log(`\n${i + 1}. ${typeIcon}: "${post.title || '(no title - reply)'}"`)
        console.log(`   Author: ${post.author.name}`)
        console.log(`   Created: ${post.createdAt.toLocaleString()}`)
        console.log(`   Type: ${isReply ? '↪️  REPLY' : '📄 Top-level post'}`)
        if (isReply) {
          console.log(`   Parent ID: ${post.parentId}`)
        }
      })
    }

    console.log('\n\n👥 USER STATUS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    for (const user of users) {
      console.log(`\n📧 ${user.name} (${user.email})`)
      console.log(`   Last Viewed Messages: ${user.lastViewedMessages ? user.lastViewedMessages.toLocaleString() : 'Never'}`)
      console.log(`   Email Notifications: ${user.notifyEmail ? '✅ ON' : '❌ OFF'}`)
      console.log(`   SMS Notifications: ${user.notifySms ? '✅ ON' : '❌ OFF'}`)

      // Check PostRead records for this user
      const readRecords = await prisma.postRead.findMany({
        where: { userId: user.id },
        include: {
          post: {
            select: { title: true, createdAt: true },
          },
        },
        orderBy: { readAt: 'desc' },
        take: 5,
      })

      // Count unread top-level posts for this user
      const readIds = readRecords.map(r => r.postId)
      const unreadTopLevel = await prisma.post.count({
        where: {
          parentId: null,
          id: { notIn: readIds.length > 0 ? readIds : ['none'] },
        },
      })

      // Count unread replies (which dashboard doesn't track!)
      const unreadReplies = await prisma.post.count({
        where: {
          parentId: { not: null },
          id: { notIn: readIds.length > 0 ? readIds : ['none'] },
        },
      })

      console.log(`   Unread Top-Level Posts: ${unreadTopLevel}`)
      console.log(`   Unread Replies: ${unreadReplies}`)
      console.log(`   Total Unread: ${unreadTopLevel + unreadReplies} (all shown on dashboard)`)

      // Check if user would get notified
      const mostRecentPost = recentPosts[0]
      if (mostRecentPost) {
        const wouldNotify =
          user.id !== mostRecentPost.authorId &&
          (user.notifyEmail || user.notifySms) &&
          (!user.lastViewedMessages || user.lastViewedMessages < mostRecentPost.createdAt)

        if (wouldNotify) {
          console.log(`   Cron Notification: ✅ Would be notified`)
        } else {
          let reason = ''
          if (user.id === mostRecentPost.authorId) {
            reason = 'Is the post author'
          } else if (!user.notifyEmail && !user.notifySms) {
            reason = 'Notifications disabled'
          } else if (user.lastViewedMessages && user.lastViewedMessages >= mostRecentPost.createdAt) {
            reason = `Viewed messages AFTER the post (${user.lastViewedMessages.toLocaleString()} >= ${mostRecentPost.createdAt.toLocaleString()})`
          }
          console.log(`   Cron Notification: ❌ Would NOT be notified - ${reason}`)
        }
      }
    }

    // Summary
    console.log('\n\n📊 DIAGNOSIS SUMMARY:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const replyCount = recentPosts.filter(p => p.parentId !== null).length
    const topLevelCount = recentPosts.filter(p => p.parentId === null).length

    console.log(`\nRecent posts breakdown:`)
    console.log(`   Top-level posts: ${topLevelCount}`)
    console.log(`   Replies: ${replyCount}`)

    if (replyCount > 0) {
      console.log(`\nℹ️  Note: ${replyCount} recent messages are REPLIES`)
      console.log(`   Replies are now tracked as unread on the dashboard.`)
    }

    console.log('\n\n✅ FIXES APPLIED:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. ✅ Unread API now counts replies (not just top-level posts)')
    console.log('2. ✅ Notification logic uses "lastViewedMessages" instead of "lastLogin"')
    console.log('3. Consider: Add real-time notifications when posts are created (currently disabled)')

    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    await prisma.$disconnect()
    process.exit(1)
  }
}

debugUnreadIssue()
