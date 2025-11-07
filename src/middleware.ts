import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Allow access to onboarding page
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.next()
    }

    // Check if user needs to complete onboarding
    if (token?.forcePasswordChange || !token?.profileCompleted) {
      return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/messages/:path*",
    "/links/:path*",
    "/roster/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
}
