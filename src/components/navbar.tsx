"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Calendar, MessageSquare, Link as LinkIcon, Users, Settings, Search, X, ChevronDown } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => pathname === path

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null)
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        setSearchResults(data.results)
        setShowResults(true)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults(null)
    setShowResults(false)
  }

  const handleResultClick = (type: string, id: string) => {
    clearSearch()
    switch (type) {
      case "user":
        router.push("/roster")
        break
      case "post":
        router.push("/messages")
        break
      case "event":
        router.push("/events")
        break
      case "link":
        router.push("/links")
        break
      case "agency":
        router.push("/roster")
        break
    }
  }

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-slate-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
              <div className="relative w-10 h-10 rounded-full ring-2 ring-amber-400 bg-slate-700 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-lg">BO</span>
              </div>
              <span className="text-xl font-bold text-white hidden xl:inline">Bonds Only Group</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex md:space-x-4">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "border-amber-400 text-white"
                    : "border-transparent text-slate-300 hover:border-slate-400 hover:text-white"
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/events"
                className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/events")
                    ? "border-amber-400 text-white"
                    : "border-transparent text-slate-300 hover:border-slate-400 hover:text-white"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Events
              </Link>

              <Link
                href="/messages"
                className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/messages")
                    ? "border-amber-400 text-white"
                    : "border-transparent text-slate-300 hover:border-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </Link>

              <Link
                href="/links"
                className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/links")
                    ? "border-amber-400 text-white"
                    : "border-transparent text-slate-300 hover:border-slate-400 hover:text-white"
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                Resources
              </Link>

              <Link
                href="/roster"
                className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive("/roster")
                    ? "border-amber-400 text-white"
                    : "border-transparent text-slate-300 hover:border-slate-400 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                Roster
              </Link>
            </div>
          </div>

          {/* Universal Search */}
          <div ref={searchRef} className="relative flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search everything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-amber-400 focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && searchResults && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                  {Object.entries(searchResults).map(([type, items]: [string, any]) => {
                    if (!items || items.length === 0) return null

                    return (
                      <div key={type} className="p-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
                          {type}
                        </h3>
                        {items.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => handleResultClick(type, item.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {item.name || item.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {type === "user" && (item.agency?.name || item.agencyName || item.email)}
                              {type === "post" && item.author?.name}
                              {type === "event" && item.location}
                              {type === "link" && item.url}
                              {type === "agency" && `${item._count?.members || 0} members`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}

                  {(!searchResults || Object.values(searchResults).every((arr: any) => arr.length === 0)) && (
                    <div className="p-6 text-center text-gray-500 text-sm">
                      No results found
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors focus:outline-none">
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  {session?.user?.role === "ADMIN" && (
                    <span className="px-2 py-0.5 text-xs bg-amber-400 text-slate-900 rounded font-semibold">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 shadow-lg">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
