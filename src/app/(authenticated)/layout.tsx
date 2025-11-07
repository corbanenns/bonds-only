import { Navbar } from "@/components/navbar"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
