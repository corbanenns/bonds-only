"use client"

import { useEffect, useState } from "react"
import { MessageSquare, CheckCheck, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface UnreadPost {
  id: string
  title: string
  content: string
  createdAt: string
  author: {
    name: string
    email: string
    role: string
  }
  _count?: {
    replies: number
  }
}

interface UnreadData {
  posts: UnreadPost[]
  count: number
}

export default function UnreadMessagesWidget() {
  const [unreadData, setUnreadData] = useState<UnreadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    fetchUnread()
  }, [])

  const fetchUnread = async () => {
    try {
      const response = await fetch("/api/posts/unread")
      const data = await response.json()
      setUnreadData(data)
    } catch (error) {
      console.error("Error fetching unread posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    if (!unreadData || unreadData.posts.length === 0) return

    setMarkingRead(true)
    try {
      const postIds = unreadData.posts.map((post) => post.id)
      await fetch("/api/posts/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds }),
      })
      // Refresh the data
      fetchUnread()
    } catch (error) {
      console.error("Error marking posts as read:", error)
    } finally {
      setMarkingRead(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  const unreadCount = unreadData?.count || 0
  const unreadPosts = unreadData?.posts || []

  return (
    <div className="bg-white shadow-lg rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-white" />
          <h2 className="text-lg font-semibold text-white">Unread Messages</h2>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-sm font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingRead}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {markingRead ? "Marking..." : "Mark All Read"}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {unreadCount === 0 ? (
          <div className="text-center py-4">
            <CheckCheck className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            <p className="text-slate-600">You're all caught up!</p>
            <p className="text-sm text-slate-400">No unread messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unreadPosts.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                href="/messages"
                className="block p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span className="font-medium">{post.author.name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {post._count && post._count.replies > 0 && (
                        <>
                          <span>•</span>
                          <span>{post._count.replies} replies</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded font-medium shrink-0">
                    New
                  </span>
                </div>
              </Link>
            ))}

            {unreadCount > 5 && (
              <p className="text-sm text-slate-500 text-center">
                +{unreadCount - 5} more unread messages
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Link
            href="/messages"
            className="flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
          >
            View All Messages
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
