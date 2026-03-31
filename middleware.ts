import { NextResponse, type NextRequest } from "next/server"
import { betterFetch } from "@better-fetch/fetch"

type Session = {
  user: { id: string; email: string }
}

const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"]
// Routes accessible without a session
const PUBLIC_ROUTES = ["/"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always let the better-auth API and OTP endpoint handle their own routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/otp")) {
    return NextResponse.next()
  }

  // Public routes are accessible to everyone
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: process.env.BETTER_AUTH_URL ?? request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    }
  )

  // Redirect authenticated users away from auth pages to the dashboard
  // (the dashboard layout will redirect further to /profile if no permission)
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  // Redirect unauthenticated users to login
  if (!session && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
}
