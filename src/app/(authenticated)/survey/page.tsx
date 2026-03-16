"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"

interface SurveyResponseData {
  id: string
  userId: string
  locationChoice: string
  locationOther: string | null
  budgetPerMember: number
  committedToAttend: boolean
  guestCount: number
  guestBudget: number | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    profilePicture: string | null
  }
  history: {
    id: string
    fieldChanged: string
    oldValue: string
    newValue: string
    changedAt: string
  }[]
}

interface NonRespondent {
  id: string
  name: string
  email: string
  profilePicture: string | null
}

interface Aggregates {
  locationCounts: Record<string, number>
  budgetAvg: number
  budgetMin: number
  budgetMax: number
  totalMembers: number
  totalGuests: number
  totalAttendees: number
  totalCommitted: number
  totalMemberCount: number
  responseCount: number
}

interface SurveyData {
  myResponse: SurveyResponseData | null
  responses: SurveyResponseData[]
  nonRespondents: NonRespondent[]
  aggregates: Aggregates
  isClosed: boolean
  deadline: string
}

const LOCATION_LABELS: Record<string, string> = {
  JACKSON_HOLE: "Jackson Hole, WY",
  CHARLOTTE: "Charlotte, NC",
  ORLANDO: "Orlando, FL",
  OTHER: "Other",
}

function formatLocationLabel(choice: string, other: string | null): string {
  if (choice === "OTHER") return other || "Other"
  return LOCATION_LABELS[choice] || choice
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    locationChoice: "location",
    locationOther: "location (other)",
    budgetPerMember: "budget",
    committedToAttend: "commitment",
    guestCount: "guest count",
    guestBudget: "guest budget",
  }
  return labels[field] || field
}

function formatFieldValue(field: string, value: string): string {
  if (field === "locationChoice") return LOCATION_LABELS[value] || value
  if (field === "budgetPerMember" || field === "guestBudget") {
    const num = parseInt(value)
    return isNaN(num) ? value : formatCurrency(num)
  }
  if (field === "committedToAttend") return value === "true" ? "Yes" : "No"
  return value
}

function getDaysRemaining(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function SurveyPage() {
  const { data: session } = useSession()
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [locationChoice, setLocationChoice] = useState("")
  const [locationOther, setLocationOther] = useState("")
  const [budgetPerMember, setBudgetPerMember] = useState("")
  const [committedToAttend, setCommittedToAttend] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [guestBudget, setGuestBudget] = useState("")

  useEffect(() => {
    fetchSurvey()
  }, [])

  const fetchSurvey = async () => {
    try {
      const response = await fetch("/api/survey")
      const data: SurveyData = await response.json()
      setSurveyData(data)

      // Pre-fill form if user already responded
      if (data.myResponse) {
        setLocationChoice(data.myResponse.locationChoice)
        setLocationOther(data.myResponse.locationOther || "")
        setBudgetPerMember(String(data.myResponse.budgetPerMember))
        setCommittedToAttend(data.myResponse.committedToAttend)
        setGuestCount(data.myResponse.guestCount)
        setGuestBudget(data.myResponse.guestBudget ? String(data.myResponse.guestBudget) : "")
      }
    } catch (err) {
      console.error("Error fetching survey:", err)
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
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationChoice,
          locationOther: locationChoice === "OTHER" ? locationOther : null,
          budgetPerMember: parseInt(budgetPerMember),
          committedToAttend,
          guestCount,
          guestBudget: guestCount > 0 ? parseInt(guestBudget) : null,
        }),
      })

      if (response.ok) {
        setSuccess(surveyData?.myResponse ? "Response updated!" : "Response submitted!")
        fetchSurvey()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to submit response")
      }
    } catch (err) {
      console.error("Error submitting:", err)
      setError("Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading survey...</div>
      </div>
    )
  }

  if (!surveyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load survey</div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(surveyData.deadline)
  const hasResponded = !!surveyData.myResponse

  return (
    <div className="px-4 sm:px-0 space-y-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            2026 Annual Meeting Survey
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Help us plan the next annual meeting. Your input determines location,
            budget, and headcount.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          {surveyData.isClosed ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              Survey Closed
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

      {/* Survey Form */}
      {!surveyData.isClosed && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {hasResponded ? "Update Your Response" : "Submit Your Response"}
          </h2>
          {hasResponded && (
            <p className="text-sm text-green-600 mb-4">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              You responded on{" "}
              {new Date(surveyData.myResponse!.createdAt).toLocaleDateString()}
              . You can update your answers below.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Location Preference */}
            <div>
              <Label className="text-base font-medium text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                Location Preference
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["JACKSON_HOLE", "CHARLOTTE", "ORLANDO", "OTHER"] as const).map(
                  (loc) => (
                    <label
                      key={loc}
                      className={`relative flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        locationChoice === loc
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="locationChoice"
                        value={loc}
                        checked={locationChoice === loc}
                        onChange={(e) => setLocationChoice(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          locationChoice === loc
                            ? "border-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {locationChoice === loc && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {LOCATION_LABELS[loc]}
                      </span>
                    </label>
                  )
                )}
              </div>
              {locationChoice === "OTHER" && (
                <div className="mt-3">
                  <Input
                    type="text"
                    placeholder="Enter your suggested location..."
                    value={locationOther}
                    onChange={(e) => setLocationOther(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              )}
            </div>

            {/* Budget */}
            <div>
              <Label className="text-base font-medium text-gray-900 flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Budget Per Member
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Excludes accommodations. Historical average: ~$1,500
              </p>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  type="number"
                  min={100}
                  max={10000}
                  placeholder="1500"
                  value={budgetPerMember}
                  onChange={(e) => setBudgetPerMember(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Attendance Commitment */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={committedToAttend}
                  onChange={(e) => setCommittedToAttend(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-base font-medium text-gray-900">
                    I commit to attending the 2026 annual meeting
                  </span>
                  <p className="text-sm text-gray-500">
                    This helps us gauge firm headcount for venue booking.
                  </p>
                </div>
              </label>
            </div>

            {/* Guests */}
            <div>
              <Label className="text-base font-medium text-gray-900 flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-600" />
                Guests for Social Events & Activities
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Guests join dinners, cocktail parties, and shared activities.
              </p>
              <div className="max-w-xs">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                />
              </div>

              {guestCount > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Estimated Cost Per Guest
                  </Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Covers dinners, cocktail parties, and shared expenses.
                  </p>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      type="number"
                      min={50}
                      max={5000}
                      placeholder="500"
                      value={guestBudget}
                      onChange={(e) => setGuestBudget(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
            </div>

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
              disabled={submitting || !locationChoice || !budgetPerMember}
              className="w-full sm:w-auto"
            >
              {submitting
                ? "Submitting..."
                : hasResponded
                ? "Update Response"
                : "Submit Response"}
            </Button>
          </form>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Survey Results</h2>

        {/* Aggregate Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Summary</h3>
            <span className="text-sm text-gray-500">
              {surveyData.aggregates.responseCount} of{" "}
              {surveyData.aggregates.totalMemberCount} members responded
            </span>
          </div>

          {surveyData.aggregates.responseCount > 0 ? (
            <div className="space-y-6">
              {/* Location Bars */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Location Preference
                </h4>
                <div className="space-y-2">
                  {Object.entries(surveyData.aggregates.locationCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([location, count]) => {
                      const pct = Math.round(
                        (count / surveyData.aggregates.responseCount) * 100
                      )
                      return (
                        <div key={location} className="flex items-center gap-3">
                          <div className="w-32 text-sm text-gray-600 truncate">
                            {LOCATION_LABELS[location] || location}
                          </div>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-20 text-sm text-gray-600 text-right">
                            {count} ({pct}%)
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Budget & Headcount Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Budget Range</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(surveyData.aggregates.budgetMin)} –{" "}
                    {formatCurrency(surveyData.aggregates.budgetMax)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {formatCurrency(surveyData.aggregates.budgetAvg)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Total Attendees</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {surveyData.aggregates.totalAttendees}
                  </div>
                  <div className="text-sm text-gray-500">
                    {surveyData.aggregates.totalMembers} members +{" "}
                    {surveyData.aggregates.totalGuests} guests
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Committed</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {surveyData.aggregates.totalCommitted}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {surveyData.aggregates.responseCount} respondents
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No responses yet.</p>
          )}
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
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Guest Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Committed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Respondents */}
                {surveyData.responses.map((r) => (
                  <tr key={r.id} className="group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {r.user.name}
                      </div>
                      {/* Change history */}
                      {r.history.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {(() => {
                            // Group history by changedAt timestamp (within 2 seconds = same update)
                            const groups: {
                              changedAt: string
                              changes: typeof r.history
                            }[] = []
                            for (const h of r.history) {
                              const lastGroup = groups[groups.length - 1]
                              if (
                                lastGroup &&
                                Math.abs(
                                  new Date(h.changedAt).getTime() -
                                    new Date(lastGroup.changedAt).getTime()
                                ) < 2000
                              ) {
                                lastGroup.changes.push(h)
                              } else {
                                groups.push({
                                  changedAt: h.changedAt,
                                  changes: [h],
                                })
                              }
                            }
                            return groups.map((group, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-400 italic"
                              >
                                Changed{" "}
                                {group.changes
                                  .map(
                                    (c) =>
                                      `${formatFieldLabel(c.fieldChanged)} from ${formatFieldValue(c.fieldChanged, c.oldValue)}`
                                  )
                                  .join(", ")}{" "}
                                on{" "}
                                {new Date(group.changedAt).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatLocationLabel(r.locationChoice, r.locationOther)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(r.budgetPerMember)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r.guestCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r.guestBudget ? formatCurrency(r.guestBudget) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {r.committedToAttend ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(r.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}

                {/* Non-respondents */}
                {surveyData.nonRespondents.map((m) => (
                  <tr key={m.id} className="bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400 italic">
                        {m.name}
                      </div>
                    </td>
                    <td
                      colSpan={6}
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
