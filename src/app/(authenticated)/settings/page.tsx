"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, User, Bell, Lock, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

interface Profile {
  id: string
  name: string
  email: string
  phone: string
  agencyName: string | null
  address: string | null
  role: string
  notifyEmail: boolean
  notifySms: boolean
  profilePicture: string | null
  linkedinUrl: string | null
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    agencyName: "",
    address: "",
    linkedinUrl: "",
    notifyEmail: true,
    notifySms: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      setProfile(data)
      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        agencyName: data.agencyName || "",
        address: data.address || "",
        linkedinUrl: data.linkedinUrl || "",
        notifyEmail: data.notifyEmail,
        notifySms: data.notifySms,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setProfilePicturePreview(data.profilePicture || "")
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setSaving(true)

    // Validate password change if requested
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match")
        setSaving(false)
        return
      }
      if (!formData.currentPassword) {
        setError("Current password is required to change password")
        setSaving(false)
        return
      }
    }

    try {
      // Upload profile picture if provided
      let profilePictureUrl = profilePicturePreview
      if (profilePicture) {
        const uploadFormData = new FormData()
        uploadFormData.append("file", profilePicture)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          profilePictureUrl = uploadData.url
        } else {
          setError("Failed to upload profile picture")
          setSaving(false)
          return
        }
      }

      // Add timeout to prevent indefinite hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            agencyName: formData.agencyName,
            address: formData.address,
            linkedinUrl: formData.linkedinUrl,
            profilePicture: profilePictureUrl,
            notifyEmail: formData.notifyEmail,
            notifySms: formData.notifySms,
            ...(formData.newPassword && {
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword,
            }),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to update profile")
          setSaving(false)
          return
        }

        setProfile(data)
        setMessage("Profile updated successfully!")
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })

        // Update session if name or email changed
        if (session) {
          await update()
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setError("Request timed out. Please check your connection and try again.")
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0 max-w-4xl mx-auto">
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400">
        <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
        <p className="mt-2 text-slate-600">
          Manage your account information and notification preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1"
                required
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
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="agencyName">Agency Name</Label>
              <Input
                id="agencyName"
                value={formData.agencyName}
                onChange={(e) =>
                  setFormData({ ...formData, agencyName: e.target.value })
                }
                className="mt-1"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-1"
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkedinUrl: e.target.value })
                }
                className="mt-1"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <div className="mt-2 flex items-center space-x-4">
                {profilePicturePreview && (
                  <Image
                    src={profilePicturePreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2 border-slate-200"
                  />
                )}
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setProfilePicture(file)
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setProfilePicturePreview(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Upload a clear photo (max 5MB)</p>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <Label htmlFor="notifyEmail" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Receive message board updates via email
                </p>
              </div>
              <input
                id="notifyEmail"
                type="checkbox"
                checked={formData.notifyEmail}
                onChange={(e) =>
                  setFormData({ ...formData, notifyEmail: e.target.checked })
                }
                className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <Label htmlFor="notifySms" className="text-base font-medium">
                  SMS Notifications
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Receive message board updates via text message
                </p>
              </div>
              <input
                id="notifySms"
                type="checkbox"
                checked={formData.notifySms}
                onChange={(e) =>
                  setFormData({ ...formData, notifySms: e.target.checked })
                }
                className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              Change Password
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  className="pr-10"
                  placeholder="Leave blank to keep current"
                />
                {formData.currentPassword && (
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="pr-10"
                  placeholder="Leave blank to keep current"
                />
                {formData.newPassword && (
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="pr-10"
                  placeholder="Leave blank to keep current"
                />
                {formData.confirmPassword && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Saving Overlay */}
        {saving && (
          <div className="bg-blue-50 border-2 border-blue-300 text-blue-800 px-6 py-4 rounded-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-semibold">Saving your profile...</p>
              <p className="text-sm text-blue-600">This may take a few moments, especially when uploading images.</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
