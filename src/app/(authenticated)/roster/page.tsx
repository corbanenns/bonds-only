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
import { Plus, Trash2, UserCircle } from "lucide-react"
import { MemberMap } from "@/components/MemberMap"
import Image from "next/image"
import Link from "next/link"

interface Agency {
  id: string
  name: string
  address: string | null
}

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: string
  address: string | null
  agencyName: string | null
  agencyId: string | null
  agency: Agency | null
  profilePicture: string | null
  linkedinUrl: string | null
  createdAt: string
}

export default function RosterPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isAgencyOpen, setIsAgencyOpen] = useState(false)

  // Format phone number to (XXX) XXX-XXXX
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')

    // Format based on length
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      // Handle numbers starting with 1
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }

    // Return original if doesn't match expected format
    return phone
  }
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "MEMBER",
    address: "",
    agencyName: "",
    agencyId: "",
  })
  const [agencyFormData, setAgencyFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
  })

  const isAdmin = session?.user?.role === "ADMIN"

  useEffect(() => {
    fetchUsers()
    fetchAgencies()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgencies = async () => {
    try {
      const response = await fetch("/api/agencies")
      const data = await response.json()
      setAgencies(data)
    } catch (error) {
      console.error("Error fetching agencies:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsOpen(false)
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "MEMBER",
          address: "",
          agencyName: "",
          agencyId: "",
        })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add member")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      alert("Failed to add member")
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the group?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete member")
    }
  }

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agencyFormData),
      })

      if (response.ok) {
        setIsAgencyOpen(false)
        setAgencyFormData({
          name: "",
          address: "",
          phone: "",
          email: "",
          website: "",
        })
        fetchAgencies()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add agency")
      }
    } catch (error) {
      console.error("Error adding agency:", error)
      alert("Failed to add agency")
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Member Roster</h1>
          <p className="mt-2 text-sm text-gray-700">
            {users.length} member{users.length !== 1 ? "s" : ""} in the group
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Dialog open={isAgencyOpen} onOpenChange={setIsAgencyOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Agency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAgencySubmit}>
                  <DialogHeader>
                    <DialogTitle>Add New Agency</DialogTitle>
                    <DialogDescription>
                      Create a new agency to organize members
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="agency-name">Agency Name</Label>
                      <Input
                        id="agency-name"
                        value={agencyFormData.name}
                        onChange={(e) =>
                          setAgencyFormData({ ...agencyFormData, name: e.target.value })
                        }
                        required
                        className="mt-1"
                        placeholder="e.g., Comhar Consulting, LLC"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agency-address">Address</Label>
                      <Input
                        id="agency-address"
                        value={agencyFormData.address}
                        onChange={(e) =>
                          setAgencyFormData({ ...agencyFormData, address: e.target.value })
                        }
                        className="mt-1"
                        placeholder="City, State"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agency-phone">Phone</Label>
                      <Input
                        id="agency-phone"
                        type="tel"
                        value={agencyFormData.phone}
                        onChange={(e) =>
                          setAgencyFormData({ ...agencyFormData, phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agency-email">Email</Label>
                      <Input
                        id="agency-email"
                        type="email"
                        value={agencyFormData.email}
                        onChange={(e) =>
                          setAgencyFormData({ ...agencyFormData, email: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agency-website">Website</Label>
                      <Input
                        id="agency-website"
                        type="url"
                        value={agencyFormData.website}
                        onChange={(e) =>
                          setAgencyFormData({ ...agencyFormData, website: e.target.value })
                        }
                        className="mt-1"
                        placeholder="https://"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit">Create Agency</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Add a new member to the Bonds Only group
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone (for MFA)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="agencyId">Agency</Label>
                    <select
                      id="agencyId"
                      value={formData.agencyId}
                      onChange={(e) =>
                        setFormData({ ...formData, agencyId: e.target.value })
                      }
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">No Agency</option>
                      {agencies.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="mt-1"
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Add Member</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border-2 border-slate-200"
                      />
                    ) : (
                      <UserCircle className="h-12 w-12 text-gray-400" />
                    )}
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user.role === "ADMIN" && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              Admin
                            </span>
                          )}
                        </p>
                        {user.linkedinUrl && (
                          <Link
                            href={user.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </Link>
                        )}
                      </div>
                      {(user.agency || user.agencyName) && (
                        <p className="text-sm text-gray-600 font-medium">
                          {user.agency ? user.agency.name : user.agencyName}
                        </p>
                      )}
                      <a
                        href={`mailto:${user.email}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {user.email}
                      </a>
                      <p className="text-xs text-gray-400">{formatPhoneNumber(user.phone)}</p>
                      {(user.agency?.address || user.address) && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {user.agency?.address || user.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && session?.user?.id !== user.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Member Map */}
      <div className="mt-6">
        <MemberMap members={users} />
      </div>
    </div>
  )
}
