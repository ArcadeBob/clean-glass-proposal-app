import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Allow access to auth routes and API routes for everyone
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // Check if user is authenticated for protected routes
  if (!session) {
    // Redirect to sign in page with callback URL
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/profile/:path*",
    "/proposals/:path*",
    "/admin/:path*",
  ]
} 