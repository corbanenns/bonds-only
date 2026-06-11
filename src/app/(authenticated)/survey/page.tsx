"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  BedDouble,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  XCircle,
} from "lucide-react"

type Attendance = "YES" | "NO" | "MAYBE"

interface RsvpResponseData {
  id: string
  userId: string
  attendance: Attendance
  guestCount: number
  roomCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    profilePicture: string | null
  }
}

interface NonRespondent {
  id: string
  name: string
  email: string
  profilePicture: string | null
}

interface Aggregates {
  yesCount: number
  noCount: number
  maybeCount: number
  confirmedPeople: number
  confirmedRooms: number
  tentativePeople: number
  tentativeRooms: number
  responseCount: number
  totalMemberCount: number
}

interface RsvpData {
  myResponse: RsvpResponseData | null
  responses: RsvpResponseData[]
  nonRespondents: NonRespondent[]
  aggregates: Aggregates
  isClosed: boolean
  deadline: string
}

function getDaysRemaining(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )
}

const ATTENDANCE_OPTIONS: {
  value: Attendance
  label: string
  description: string
}[] = [
  { value: "YES", label: "Yes, I'll be there", description: "Reserves rooms in the block" },
  { value: "MAYBE", label: "Maybe", description: "Tentative — holds nothing" },
  { value: "NO", label: "No, I can't make it", description: "Won't be attending" },
]

export default function RsvpPage() {
  const { data: session } = useSession()
  const [rsvpData, setRsvpData] = useState<RsvpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [attendance, setAttendance] = useState<Attendance | "">("")
  const [guestCount, setGuestCount] = useState(0)
  const [roomCount, setRoomCount] = useState(1)

  useEffect(() => {
    fetchRsvp()
  }, [])

  const fetchRsvp = async () => {
    try {
      const response = await fetch("/api/survey")
      const data: RsvpData = await response.json()
      setRsvpData(data)

      if (data.myResponse) {
        setAttendance(data.myResponse.attendance)
        setGuestCount(data.myResponse.guestCount)
        setRoomCount(data.myResponse.roomCount)
      }
    } catch (err) {
      console.error("Error fetching RSVP:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSubmitting(true)

    try {
      const showCounts = attendance === "YES" || attendance === "MAYBE"
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance,
          guestCount: showCounts ? guestCount : 0,
          roomCount: showCounts ? roomCount : 0,
        }),
      })

      if (response.ok) {
        setSuccess(rsvpData?.myResponse ? "RSVP updated!" : "RSVP submitted!")
        fetchRsvp()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to submit RSVP")
      }
    } catch (err) {
      console.error("Error submitting:", err)
      setError("Failed to submit RSVP")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading RSVP...</div>
      </div>
    )
  }

  if (!rsvpData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load RSVP</div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(rsvpData.deadline)
  const hasResponded = !!rsvpData.myResponse
  const showCounts = attendance === "YES" || attendance === "MAYBE"
  const partyTotal = 1 + (Number.isFinite(guestCount) ? guestCount : 0)

  return (
    <div className="px-4 sm:px-0 space-y-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            2026 Annual Meeting RSVP
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Join us at The Charleston Place. Let us know if you&apos;ll be
            attending, your headcount, and rooms needed so we can set dinner,
            food, and room-block reservations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {rsvpData.isClosed ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              RSVP Closed
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                daysRemaining <= 7
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
            </span>
          )}
        </div>
      </div>

      {/* RSVP Form */}
      {!rsvpData.isClosed && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {hasResponded ? "Update Your RSVP" : "Submit Your RSVP"}
          </h2>
          {hasResponded && (
            <p className="text-sm text-green-600 mb-4">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              You responded on{" "}
              {new Date(rsvpData.myResponse!.createdAt).toLocaleDateString()}. You
              can update your answer below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Attendance */}
            <div>
              <Label className="text-base font-medium text-gray-900 mb-4 block">
                Will you attend?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`relative flex flex-col gap-1 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      attendance === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="attendance"
                      value={opt.value}
                      checked={attendance === opt.value}
                      onChange={(e) =>
                        setAttendance(e.target.value as Attendance)
                      }
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          attendance === opt.value
                            ? "border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {attendance === opt.value && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 pl-7">
                      {opt.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Yes warning */}
            {attendance === "YES" && (
              <div className="rounded-lg bg-amber-50 border border-amber-300 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  Selecting &apos;Yes&apos; reserves rooms in our group block.
                  Our contract carries a 10% attrition clause — if the
                  group&apos;s actual attendance falls more than 10% below the
                  block we reserve, members who cancel may be invoiced for the
                  shortfall. Please only select &apos;Yes&apos; if you intend to
                  attend.
                </p>
              </div>
            )}

            {/* Maybe warning */}
            {attendance === "MAYBE" && (
              <div className="rounded-lg bg-blue-50 border border-blue-300 p-4 flex gap-3">
                <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  A &apos;Maybe&apos; does not hold a room. Per our contract with
                  the venue, only confirmed &apos;Yes&apos; responses reserve
                  rooms in the block. Your estimated counts below help us plan,
                  but nothing is held.
                </p>
              </div>
            )}

            {/* Counts (Yes / Maybe) */}
            {showCounts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium text-gray-900 flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Guests joining you
                  </Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Not counting yourself (0 = just me, 1 = +1, etc). Guests are
                    welcome at meals and receptions — your count helps us plan
                    catering and seating.
                  </p>
                  <div className="max-w-xs">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={guestCount}
                      onChange={(e) =>
                        setGuestCount(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    Total in your party: {partyTotal}
                  </p>
                </div>

                <div>
                  <Label className="text-base font-medium text-gray-900 flex items-center gap-2 mb-2">
                    <BedDouble className="h-5 w-5 text-indigo-600" />
                    Hotel rooms needed
                  </Label>
                  <p className="text-sm text-gray-500 mb-3">
                    {attendance === "MAYBE"
                      ? "Estimate only — not held until you confirm Yes."
                      : "Rooms to reserve in the group block."}
                  </p>
                  <div className="max-w-xs">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={roomCount}
                      onChange={(e) =>
                        setRoomCount(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Want to arrive early or stay after the meeting? You&apos;re
                    welcome to book extra nights directly with The Charleston
                    Place — those nights are outside our group block, so just
                    arrange them with the hotel.
                  </p>
                </div>
              </div>
            )}

            {/* Error / Success Messages */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
                {success}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || !attendance}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-8 text-base shadow-md"
            >
              {submitting
                ? "Submitting..."
                : hasResponded
                ? "Update RSVP"
                : "Submit RSVP"}
            </Button>
          </form>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">RSVP Results</h2>

        {/* Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Summary</h3>
            <span className="text-sm text-gray-500">
              {rsvpData.aggregates.responseCount} of{" "}
              {rsvpData.aggregates.totalMemberCount} members responded
            </span>
          </div>

          {/* Status counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Yes
              </div>
              <div className="text-2xl font-semibold text-green-800">
                {rsvpData.aggregates.yesCount}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700 flex items-center gap-1">
                <HelpCircle className="h-4 w-4" /> Maybe
              </div>
              <div className="text-2xl font-semibold text-blue-800">
                {rsvpData.aggregates.maybeCount}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <XCircle className="h-4 w-4" /> No
              </div>
              <div className="text-2xl font-semibold text-gray-700">
                {rsvpData.aggregates.noCount}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Not responded</div>
              <div className="text-2xl font-semibold text-gray-700">
                {rsvpData.nonRespondents.length}
              </div>
            </div>
          </div>

          {/* Confirmed vs tentative totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm font-medium text-green-800 mb-2">
                Confirmed (Yes)
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-semibold text-green-900">
                    {rsvpData.aggregates.confirmedPeople}
                  </div>
                  <div className="text-xs text-green-700">people</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-900">
                    {rsvpData.aggregates.confirmedRooms}
                  </div>
                  <div className="text-xs text-green-700">rooms</div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Tentative (Maybe) — not held
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-semibold text-blue-900">
                    +{rsvpData.aggregates.tentativePeople}
                  </div>
                  <div className="text-xs text-blue-700">people</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-900">
                    +{rsvpData.aggregates.tentativeRooms}
                  </div>
                  <div className="text-xs text-blue-700">rooms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Responses Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Party Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rooms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rsvpData.responses.map((r) => {
                  const counts = r.attendance === "YES" || r.attendance === "MAYBE"
                  return (
                    <tr key={r.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {r.user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {r.attendance === "YES" && (
                          <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            Yes
                          </span>
                        )}
                        {r.attendance === "MAYBE" && (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                            <HelpCircle className="h-4 w-4" />
                            Maybe
                          </span>
                        )}
                        {r.attendance === "NO" && (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <XCircle className="h-4 w-4" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {counts ? 1 + r.guestCount : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {counts ? r.roomCount : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(r.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  )
                })}

                {/* Non-respondents */}
                {rsvpData.nonRespondents.map((m) => (
                  <tr key={m.id} className="bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 italic">
                        {m.name}
                      </div>
                    </td>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-sm text-gray-400 italic"
                    >
                      Not responded
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
