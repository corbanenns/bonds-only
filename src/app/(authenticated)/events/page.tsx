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
import { Calendar, Plus, Trash2, MapPin, Clock, Download, Upload, X, ImageIcon, Pencil } from "lucide-react"
import { format } from "date-fns"
import { createEvent, EventAttributes } from "ics"
import Image from "next/image"

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string | null
  images: string[]
  createdBy: string
  creator: {
    name: string
    email: string
  }
}

export default function EventsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
  })
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null)
  const [viewingImages, setViewingImages] = useState<{ eventTitle: string; images: string[]; currentIndex: number } | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({
          title: "",
          description: "",
          startDate: "",
          endDate: "",
          location: "",
        })
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create event")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      alert("Failed to create event")
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete event")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event")
    }
  }

  const canDeleteEvent = (event: Event) => {
    return (
      session?.user?.id === event.createdBy || session?.user?.role === "ADMIN"
    )
  }

  const handleEditClick = (event: Event) => {
    setEditingEvent(event)
    // Convert ISO dates to datetime-local format
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    setEditFormData({
      title: event.title,
      description: event.description || "",
      startDate: format(startDate, "yyyy-MM-dd'T'HH:mm"),
      endDate: format(endDate, "yyyy-MM-dd'T'HH:mm"),
      location: event.location || "",
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setEditingEvent(null)
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update event")
      }
    } catch (error) {
      console.error("Error updating event:", error)
      alert("Failed to update event")
    }
  }

  const handleImageUpload = async (eventId: string, file: File) => {
    setUploadingImageFor(eventId)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/events/${eventId}/images`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        fetchEvents()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploadingImageFor(null)
    }
  }

  const handleImageDelete = async (eventId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })

      if (response.ok) {
        fetchEvents()
        // Close viewer if we deleted the current image
        if (viewingImages && viewingImages.images.includes(imageUrl)) {
          const newImages = viewingImages.images.filter(img => img !== imageUrl)
          if (newImages.length === 0) {
            setViewingImages(null)
          } else {
            setViewingImages({
              ...viewingImages,
              images: newImages,
              currentIndex: Math.min(viewingImages.currentIndex, newImages.length - 1)
            })
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("Failed to delete image")
    }
  }

  const handleAddToCalendar = (event: Event) => {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    const eventData: EventAttributes = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ],
      title: event.title,
      description: event.description || undefined,
      location: event.location || undefined,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: event.creator.name, email: event.creator.email },
    }

    createEvent(eventData, (error, value) => {
      if (error) {
        console.error("Error creating calendar event:", error)
        alert("Failed to generate calendar file")
        return
      }

      // Create a blob and download the .ics file
      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Events Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upcoming events and meetings for the group
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to the group calendar
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="mt-1"
                    placeholder="Monthly Meeting"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Event details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Office, Zoom link, etc."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No events scheduled
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new event.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id}>
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-col sm:flex-row sm:gap-4 gap-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(event.startDate), "PPp")} -{" "}
                          {format(new Date(event.endDate), "p")}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Created by {event.creator.name}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCalendar(event)}
                        title="Add to Calendar (Outlook, Gmail, iCloud)"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Add to Calendar
                      </Button>

                      {canDeleteEvent(event) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(event.id, event.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Image Gallery */}
                  {event.images && event.images.length > 0 && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {event.images.map((imageUrl, index) => (
                          <div key={imageUrl} className="relative group">
                            <button
                              onClick={() => setViewingImages({ eventTitle: event.title, images: event.images, currentIndex: index })}
                              className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <Image
                                src={imageUrl}
                                alt={`${event.title} photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              />
                            </button>
                            {canDeleteEvent(event) && (
                              <button
                                onClick={() => handleImageDelete(event.id, imageUrl)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                title="Delete image"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {canDeleteEvent(event) && (
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageUpload(event.id, file)
                              e.target.value = ""
                            }
                          }}
                          disabled={uploadingImageFor === event.id}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingImageFor === event.id}
                          asChild
                        >
                          <span>
                            {uploadingImageFor === event.id ? (
                              <>Uploading...</>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Add Photo
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Event Dialog */}
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update event details
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="edit-title">Event Title</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate">Start Date & Time</Label>
                    <Input
                      id="edit-startDate"
                      type="datetime-local"
                      value={editFormData.startDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, startDate: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-endDate">End Date & Time</Label>
                    <Input
                      id="edit-endDate"
                      type="datetime-local"
                      value={editFormData.endDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, endDate: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-location">Location (optional)</Label>
                  <Input
                    id="edit-location"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, location: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Viewer Modal */}
      {viewingImages && (
        <Dialog open={!!viewingImages} onOpenChange={() => setViewingImages(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {viewingImages.eventTitle} - Photo {viewingImages.currentIndex + 1} of {viewingImages.images.length}
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex items-center justify-center">
              {viewingImages.images.length > 1 && viewingImages.currentIndex > 0 && (
                <button
                  onClick={() => setViewingImages({
                    ...viewingImages,
                    currentIndex: viewingImages.currentIndex - 1
                  })}
                  className="absolute left-2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <X className="h-6 w-6 rotate-90" />
                </button>
              )}

              <div className="relative w-full h-[70vh]">
                <Image
                  src={viewingImages.images[viewingImages.currentIndex]}
                  alt={`${viewingImages.eventTitle} photo ${viewingImages.currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {viewingImages.images.length > 1 && viewingImages.currentIndex < viewingImages.images.length - 1 && (
                <button
                  onClick={() => setViewingImages({
                    ...viewingImages,
                    currentIndex: viewingImages.currentIndex + 1
                  })}
                  className="absolute right-2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <X className="h-6 w-6 -rotate-90" />
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
