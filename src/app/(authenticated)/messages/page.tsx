"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Plus, Search, Trash2, User, Reply as ReplyIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  title: string
  content: string
  authorId: string
  createdAt: string
  isRead: boolean
  author: {
    name: string
    email: string
    role: string
  }
  replies?: Post[]
  _count?: {
    replies: number
  }
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })
  const [replyingTo, setReplyingTo] = useState<Post | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const markedAsReadRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetchPosts()
  }, [])

  // Mark unread posts as read after fetching
  useEffect(() => {
    if (posts.length === 0) return

    const unreadPostIds = posts
      .filter((post) => !post.isRead && !markedAsReadRef.current.has(post.id))
      .map((post) => post.id)

    // Also include unread replies
    posts.forEach((post) => {
      post.replies?.forEach((reply) => {
        if (!reply.isRead && !markedAsReadRef.current.has(reply.id)) {
          unreadPostIds.push(reply.id)
        }
      })
    })

    if (unreadPostIds.length > 0) {
      // Mark as read in the background
      fetch("/api/posts/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: unreadPostIds }),
      }).then(() => {
        // Update local state to show as read
        unreadPostIds.forEach((id) => markedAsReadRef.current.add(id))
        setPosts((prevPosts) =>
          prevPosts.map((post) => ({
            ...post,
            isRead: true,
            replies: post.replies?.map((reply) => ({
              ...reply,
              isRead: true,
            })),
          }))
        )
      })
    }
  }, [posts])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts")
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({
          title: "",
          content: "",
        })
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post")
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyingTo) return

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parentId: replyingTo.id,
        }),
      })

      if (response.ok) {
        setReplyingTo(null)
        setReplyContent("")
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to post reply")
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      alert("Failed to post reply")
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchPosts()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post")
    }
  }

  const canDeletePost = (post: Post) => {
    return (
      session?.user?.id === post.authorId || session?.user?.role === "ADMIN"
    )
  }

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Board</h1>
          <p className="mt-2 text-sm text-gray-700">
            Group discussions and announcements
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Share a message or announcement with the group
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="mt-1"
                    placeholder="Post title"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Message</Label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Share your thoughts..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Post Message</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search posts by title, content, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No messages yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a conversation by creating a new post.
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`shadow rounded-lg overflow-hidden transition-colors ${
                !post.isRead ? "bg-blue-50 border-l-4 border-blue-400" : "bg-white"
              }`}
            >
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {post.title}
                      {!post.isRead && (
                        <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded font-medium">
                          New
                        </span>
                      )}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{post.author.name}</span>
                      {post.author.role === "ADMIN" && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          Admin
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  {canDeletePost(post) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id, post.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 text-gray-700 whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Reply button and count */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(post)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <ReplyIcon className="h-4 w-4 mr-1" />
                    Reply
                    {post._count && post._count.replies > 0 && (
                      <span className="ml-1">({post._count.replies})</span>
                    )}
                  </Button>
                </div>

                {/* Reply form */}
                {replyingTo?.id === post.id && (
                  <form onSubmit={handleReply} className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <Label htmlFor="replyContent" className="text-sm font-medium">
                      Reply to {post.author.name}
                    </Label>
                    <textarea
                      id="replyContent"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      required
                      className="mt-2 flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Write your reply..."
                    />
                    <div className="mt-3 flex gap-2">
                      <Button type="submit" size="sm">Post Reply</Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {/* Display replies */}
                {post.replies && post.replies.length > 0 && (
                  <div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span className="font-medium">{reply.author.name}</span>
                              {reply.author.role === "ADMIN" && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  Admin
                                </span>
                              )}
                              <span>•</span>
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(reply.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                              {reply.content}
                            </div>
                          </div>
                          {canDeletePost(reply) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reply.id, "this reply")}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
