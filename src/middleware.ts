import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/login",
  "/api/auth/login",
  "/api/generate-qr",
  "/api/convert-pdf",
  "/api/generate-ticket",
  "/ticket",
];

export function middleware(request: NextRequest) {
  // Temporarily disabled authentication - allow all routes
  return NextResponse.next();

  /*
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get("session");

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session
  try {
    const decoded = JSON.parse(
      Buffer.from(session.value, "base64").toString()
    );

    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - decoded.timestamp > maxAge) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|templates/).*)",
  ],
};
