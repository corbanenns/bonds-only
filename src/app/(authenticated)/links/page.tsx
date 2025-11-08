"use client"

import { useEffect, useState } from "react"
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
import { Link as LinkIcon, Plus, Trash2, ExternalLink, Tag, Paperclip, Download } from "lucide-react"

interface Link {
  id: string
  title: string
  url: string
  description: string | null
  category: string | null
  addedBy: string
  attachmentUrl: string | null
  attachmentName: string | null
  attachmentSize: number | null
  attachmentType: string | null
  createdAt: string
  user: {
    name: string
    email: string
  }
}

export default function LinksPage() {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links")
      const data = await response.json()
      setLinks(data)
    } catch (error) {
      console.error("Error fetching links:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create FormData for file upload
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title)
      submitFormData.append("url", formData.url)
      submitFormData.append("description", formData.description)
      submitFormData.append("category", formData.category)

      if (selectedFile) {
        submitFormData.append("file", selectedFile)
      }

      const response = await fetch("/api/links", {
        method: "POST",
        body: submitFormData,
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({
          title: "",
          url: "",
          description: "",
          category: "",
        })
        setSelectedFile(null)
        fetchLinks()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add link")
      }
    } catch (error) {
      console.error("Error creating link:", error)
      alert("Failed to add link")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/links/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchLinks()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete link")
      }
    } catch (error) {
      console.error("Error deleting link:", error)
      alert("Failed to delete link")
    }
  }

  const canDeleteLink = (link: Link) => {
    return (
      session?.user?.id === link.addedBy || session?.user?.role === "ADMIN"
    )
  }

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800"
    const colors: { [key: string]: string } = {
      documentation: "bg-blue-100 text-blue-800",
      tools: "bg-green-100 text-green-800",
      resources: "bg-purple-100 text-purple-800",
      forms: "bg-orange-100 text-orange-800",
      regulations: "bg-red-100 text-red-800",
    }
    return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Resource Links</h1>
          <p className="mt-2 text-sm text-gray-700">
            Shared resources and important links for the group
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Link</DialogTitle>
                <DialogDescription>
                  Share a resource or important link with the group
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
                    placeholder="Resource name"
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    required
                    className="mt-1"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Brief description of the resource..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1"
                    placeholder="e.g., Documentation, Tools, Forms"
                  />
                </div>

                <div>
                  <Label htmlFor="file">Attach File (optional)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                      }
                    }}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Add Link</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No links yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by adding a useful resource link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {link.title}
                      </h3>
                      {link.category && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${getCategoryColor(
                            link.category
                          )}`}
                        >
                          <Tag className="h-3 w-3 inline mr-1" />
                          {link.category}
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {link.description}
                      </p>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {link.url}
                    </a>
                    {link.attachmentUrl && (
                      <a
                        href={link.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="font-medium">{link.attachmentName}</span>
                        {link.attachmentSize && (
                          <span className="text-xs text-slate-500">
                            ({formatFileSize(link.attachmentSize)})
                          </span>
                        )}
                        <Download className="h-4 w-4 ml-auto" />
                      </a>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Added by {link.user.name}
                    </p>
                  </div>

                  {canDeleteLink(link) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(link.id, link.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
