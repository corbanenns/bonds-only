import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { notifyUsers, sendSurveyReminder, sendSurveyFirstFollowup } from "@/lib/notifications"

/**
 * Scheduled cron job that sends notifications to users who haven't viewed the
 * messages page since the last post was made.
 *
 * Runs daily at 11:00 UTC = 6:00 AM CDT (schedule "0 11 * * *" in vercel.json).
 *
 * Logic:
 * - Find the most recent post
 * - If that post is more than 24h old, do nothing (it was already notified on
 *   the run after it was created; this prevents the same post being emailed
 *   every day to users who never open the messages page)
 * - Otherwise find all users whose lastViewedMessages is before that post's
 *   createdAt (or null), and send them a one-time notification (excluding the
 *   author of the most recent post)
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

    // Guard against re-notifying about the same post every day.
    // The cron runs once daily, so a post should only ever be eligible for a
    // notification on the single run that follows its creation. Without this,
    // any user who never opens the messages page keeps matching the
    // "haven't viewed since the post" condition below and gets emailed the
    // identical notification every morning, indefinitely.
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000
    const postAgeMs = Date.now() - mostRecentPost.createdAt.getTime()
    if (postAgeMs > TWENTY_FOUR_HOURS_MS) {
      console.log(
        `[CRON] Most recent post is ${Math.round(postAgeMs / TWENTY_FOUR_HOURS_MS * 24)}h old ` +
        `(> 24h); skipping post notifications to avoid daily repeats.`
      )
      return NextResponse.json({
        success: true,
        message: 'Most recent post is older than 24h; no notifications sent',
        mostRecentPost: {
          title: mostRecentPost.title,
          author: mostRecentPost.author.name,
          createdAt: mostRecentPost.createdAt,
        },
        notified: 0,
      })
    }

    // Find users who should be notified:
    // 1. Either haven't viewed the messages page since the post was created
    // 2. Or have never viewed the messages page (lastViewedMessages is null)
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

          // Haven't viewed messages since the post OR never viewed messages
          {
            OR: [
              { lastViewedMessages: null }, // Never viewed messages
              { lastViewedMessages: { lt: mostRecentPost.createdAt } }, // Viewed messages before the post
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

    console.log(`[CRON] Found ${usersToNotify.length} users to notify:`)
    usersToNotify.forEach(user => {
      const lastViewedStr = user.lastViewedMessages
        ? user.lastViewedMessages.toISOString()
        : 'Never'
      console.log(`[CRON]   - ${user.name} (${user.email}) - Last viewed messages: ${lastViewedStr}`)
    })

    if (usersToNotify.length === 0) {
      console.log('[CRON] No users to notify. All users have viewed messages since the last post.')
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

    // --- Survey Reminders ---
    const SURVEY_FIRST_FOLLOWUP = "2026-03-21"
    const SURVEY_DAILY_START = "2026-03-26"
    const SURVEY_DEADLINE = "2026-04-01"

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    const isFirstFollowup = today === SURVEY_FIRST_FOLLOWUP
    const isDailyReminder = today >= SURVEY_DAILY_START && today <= SURVEY_DEADLINE
    const shouldSendSurveyReminder = isFirstFollowup || isDailyReminder

    let surveyRemindersResult = { sent: 0, failed: 0 }

    if (shouldSendSurveyReminder) {
      console.log("[CRON] Checking survey reminders for", today)

      // Find members who haven't responded
      const respondedUserIds = await prisma.surveyResponse.findMany({
        select: { userId: true },
      })
      const respondedSet = new Set(respondedUserIds.map((r) => r.userId))

      const nonRespondents = await prisma.user.findMany({
        where: {
          role: { in: ["MEMBER", "ADMIN"] },
          notifyEmail: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      })

      const toRemind = nonRespondents.filter((u) => !respondedSet.has(u.id))
      console.log(`[CRON] ${toRemind.length} non-respondents to remind`)

      const surveyBaseUrl = process.env.NEXTAUTH_URL || "https://bondsonly.org"

      if (isFirstFollowup) {
        // Mar 21: distinct "We Need Your Input" email
        for (const user of toRemind) {
          const result = await sendSurveyFirstFollowup(
            user.email,
            user.name,
            `${surveyBaseUrl}/survey`
          )
          if (result.success) surveyRemindersResult.sent++
          else surveyRemindersResult.failed++
        }
      } else {
        // Mar 26–Apr 1: daily countdown reminders
        const deadlineDate = new Date(SURVEY_DEADLINE + "T23:59:59-07:00")
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        )

        for (const user of toRemind) {
          const result = await sendSurveyReminder(
            user.email,
            user.name,
            `${surveyBaseUrl}/survey`,
            daysRemaining
          )
          if (result.success) surveyRemindersResult.sent++
          else surveyRemindersResult.failed++
        }
      }

      console.log(
        `[CRON] Survey reminders: ${surveyRemindersResult.sent} sent, ${surveyRemindersResult.failed} failed`
      )
    }
    // --- End Survey Reminders ---

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
      surveyReminders: surveyRemindersResult,
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
