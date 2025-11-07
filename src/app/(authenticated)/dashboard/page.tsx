import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Calendar, MessageSquare, Link as LinkIcon, Users } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const cards = [
    {
      title: "Events Calendar",
      description: "View and manage group events",
      icon: Calendar,
      href: "/events",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Message Board",
      description: "Discuss with group members",
      icon: MessageSquare,
      href: "/messages",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Resources",
      description: "Shared links and assets",
      icon: LinkIcon,
      href: "/links",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Member Roster",
      description: "View group members",
      icon: Users,
      href: "/roster",
      color: "from-amber-500 to-amber-600",
    },
  ]

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {session.user.name}!
        </h1>
        <p className="mt-2 text-slate-600">
          Bonds Only Group - Surety Bonds Professionals
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white overflow-hidden shadow-md rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-200"
            >
              <div className="p-6">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {card.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 bg-white shadow-lg rounded-xl p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 font-medium">Your Role</p>
            <p className="text-2xl font-bold text-slate-800 capitalize">
              {session.user.role.toLowerCase()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg font-medium text-gray-900 truncate">
              {session.user.email}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-lg font-medium text-gray-900">2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}
