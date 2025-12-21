import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("access-token")?.value;
  const { pathname } = req.nextUrl;
  console.log("🔥 MIDDLEWARE HIT:", req.nextUrl.pathname,token);

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!token) {
    if (pathname.startsWith("/user") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET!
    );

    const { payload } = await jwtVerify(token, secret);

    console.log("Decoded JWT payload:", payload);

    const isAdmin = payload.isAdmin as boolean;

    if (pathname.startsWith("/admin") && !isAdmin) {
      return NextResponse.redirect(new URL("/user/home", req.url));
    }

    if (pathname.startsWith("/user") && isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("access-token");
    return res;
  }
}

export const config = {
  matcher: ["/", "/user/:path*", "/admin/:path*"],
};
