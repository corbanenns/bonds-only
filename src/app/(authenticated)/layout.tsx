"use client"

import { Navbar } from "@/components/navbar"
import { useEffect } from "react"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Suppress hydration warnings for Radix UI components
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Hydration') &&
        args[0].includes('radix')
      ) {
        return
      }
      originalError.call(console, ...args)
    }
    return () => {
      console.error = originalError
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
