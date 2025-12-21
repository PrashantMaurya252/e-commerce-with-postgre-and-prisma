import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access-token")?.value;
  const role = req.cookies.get("role")?.value; // admin | user
  const { pathname } = req.nextUrl;

 

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Allow auth pages if not logged in
  if (pathname.startsWith("/auth") && !token) {
    return NextResponse.next();
  }

  // Block unauthenticated access
  if (!token && (pathname.startsWith("/user") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // If logged in but role missing → force logout
  if (token && !role) {
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    res.cookies.delete("access-token");
    res.cookies.delete("role");
    return res;
  }

  // Role-based protection
  if (pathname.startsWith("/admin") && role !== "Admin") {
    return NextResponse.redirect(new URL("/user/home", req.url));
  }

  if (pathname.startsWith("/user") && role !== "User") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // Prevent logged-in users from visiting auth pages
  if (pathname.startsWith("/auth") && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/user/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/user/:path*", "/admin/:path*"],
};
