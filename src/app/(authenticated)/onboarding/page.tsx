"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Profile fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [agencyName, setAgencyName] = useState("")
  const [address, setAddress] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("")

  useEffect(() => {
    // If user doesn't need onboarding, redirect to dashboard
    if (session && !session.user.forcePasswordChange && session.user.profileCompleted) {
      router.push("/dashboard")
    }

    // Start with password change if required, otherwise go to profile
    if (session?.user.forcePasswordChange) {
      setStep(1)
    } else {
      setStep(2)
    }
  }, [session, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to change password")
        setLoading(false)
        return
      }

      // Move to next step
      setStep(2)
      setLoading(false)
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Upload profile picture if provided
      let profilePictureUrl = ""
      if (profilePicture) {
        const formData = new FormData()
        formData.append("file", profilePicture)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          profilePictureUrl = uploadData.url
        }
      }

      // Update profile
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          agencyName,
          address,
          linkedinUrl,
          profilePicture: profilePictureUrl,
          profileCompleted: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
        setLoading(false)
        return
      }

      // Update session
      await update()

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Bonds Only Group Logo"
              width={100}
              height={100}
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome to Bonds Only!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Let's set up your profile
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 1 ? 'text-amber-600' : step > 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 1 ? 'border-amber-600 bg-amber-50' : step > 1 ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Password</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center ${step === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step === 2 ? 'border-amber-600 bg-amber-50' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Profile</span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Step 1: Password Change */}
        {step === 1 && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                For security, please change your temporary password.
              </p>

              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1"
                  placeholder="BondsOnly2025!"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="mt-1"
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Continue"}
            </Button>
          </form>
        )}

        {/* Step 2: Profile Completion */}
        {step === 2 && (
          <form onSubmit={handleProfileComplete} className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Help others recognize you by completing your profile.
              </p>

              {/* Profile Picture */}
              <div>
                <Label htmlFor="profilePicture">Profile Picture</Label>
                <div className="mt-2 flex items-center space-x-4">
                  {profilePicturePreview && (
                    <Image
                      src={profilePicturePreview}
                      alt="Profile preview"
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                    />
                  )}
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Upload a clear photo of yourself</p>
              </div>

              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder={session.user.name || "Your name"}
                  defaultValue={session.user.name || ""}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Your surety bond agency"
                />
              </div>

              <div>
                <Label htmlFor="address">Location *</Label>
                <Input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="City, State"
                />
              </div>

              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="mt-1"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              {session.user.forcePasswordChange && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
