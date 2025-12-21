import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  const role = req.cookies.get("role")?.value
  const { pathname } = req.nextUrl

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  /* 1️⃣ Not logged in */
  if (!token) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  /* 2️⃣ Logged in but NOT admin */
  if (token && role !== "Admin") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  /* 3️⃣ Admin trying to access user pages (optional rule) */
  if (token && role === "Admin") {
    if (pathname.startsWith("/user")) {
      return NextResponse.redirect(new URL("/admin"))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/user/:path*",
    "/admin/:path*",
  ],
}
