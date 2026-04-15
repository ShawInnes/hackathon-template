import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add paths that require authentication here.
// Pages also call auth() directly — this is an optimistic UX redirect only.
const PROTECTED_PATHS = ["/dashboard"]

export function proxy(request: NextRequest) {
  const isProtected = PROTECTED_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected) {
    // Optimistic check: look for Auth.js session cookie.
    // Full session validation happens inside each protected page via auth().
    const sessionCookie =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token")

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
