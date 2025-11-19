import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { notifyUsers } from "@/lib/notifications"

/**
 * Scheduled cron job that sends notifications to users who haven't logged in
 * since the last post was made.
 *
 * Runs daily at 3 AM PST (configured in vercel.json)
 *
 * Logic:
 * - Find the most recent post
 * - Find all users whose lastLogin is before that post's createdAt (or never logged in)
 * - Send notifications to those users (excluding the author of the most recent post)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('[CRON] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting scheduled notification check at', new Date().toISOString())
    console.log('[CRON] Timezone: PST')

    // Find the most recent post (including replies)
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
      console.log('[CRON] No posts found. Nothing to notify about.')
      return NextResponse.json({
        success: true,
        message: 'No posts found',
        notified: 0,
      })
    }

    console.log('[CRON] Most recent post:')
    console.log(`[CRON]   Title: "${mostRecentPost.title}"`)
    console.log(`[CRON]   Author: ${mostRecentPost.author.name}`)
    console.log(`[CRON]   Created: ${mostRecentPost.createdAt.toISOString()}`)

    // Find users who should be notified:
    // 1. Either haven't logged in since the post was created
    // 2. Or have never logged in (lastLogin is null)
    // 3. AND have notifications enabled
    // 4. AND are not the author of the most recent post
    const usersToNotify = await prisma.user.findMany({
      where: {
        AND: [
          // Not the author of the most recent post
          { id: { not: mostRecentPost.author.id } },

          // Have notifications enabled
          {
            OR: [
              { notifyEmail: true },
              { notifySms: true },
            ],
          },

          // Haven't logged in since the post OR never logged in
          {
            OR: [
              { lastLogin: null }, // Never logged in
              { lastLogin: { lt: mostRecentPost.createdAt } }, // Logged in before the post
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
        lastLogin: true,
      },
    })

    console.log(`[CRON] Found ${usersToNotify.length} users to notify:`)
    usersToNotify.forEach(user => {
      const lastLoginStr = user.lastLogin
        ? user.lastLogin.toISOString()
        : 'Never'
      console.log(`[CRON]   - ${user.name} (${user.email}) - Last login: ${lastLoginStr}`)
    })

    if (usersToNotify.length === 0) {
      console.log('[CRON] No users to notify. All users have logged in since the last post.')
      return NextResponse.json({
        success: true,
        message: 'No users to notify',
        mostRecentPost: {
          title: mostRecentPost.title,
          author: mostRecentPost.author.name,
          createdAt: mostRecentPost.createdAt,
        },
        notified: 0,
      })
    }

    // Send notifications
    const baseUrl = process.env.NEXTAUTH_URL || 'https://bondsonly.org'
    const results = await notifyUsers(usersToNotify, {
      title: mostRecentPost.title,
      content: mostRecentPost.content,
      author: mostRecentPost.author.name,
      link: `${baseUrl}/messages`,
    })

    console.log('[CRON] Notification results:')
    console.log(`[CRON]   Emails sent: ${results.emailsSent}`)
    console.log(`[CRON]   SMS sent: ${results.smsSent}`)
    console.log(`[CRON]   Failed: ${results.failed}`)
    console.log('[CRON] Completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      mostRecentPost: {
        title: mostRecentPost.title,
        author: mostRecentPost.author.name,
        createdAt: mostRecentPost.createdAt,
      },
      notified: usersToNotify.length,
      results: {
        emailsSent: results.emailsSent,
        smsSent: results.smsSent,
        failed: results.failed,
      },
    })

  } catch (error) {
    console.error('[CRON] ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
