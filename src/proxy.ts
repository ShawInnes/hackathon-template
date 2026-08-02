import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getLogger } from "@logtape/logtape"

// Add paths that require authentication here.
// Cookie presence check below is optimistic — no signature verification.
// Every protected page MUST also call auth() server-side.
// Note: "/" is a public landing page — do not add it here.
const PROTECTED_PATHS = ["/profile", "/worker"]

const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

export function proxy(request: NextRequest) {
  getLogger(["app", "request"]).info("{method} {path}", {
    method: request.method,
    path: request.nextUrl.pathname,
  })

  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!isProtected) return

  if (!AUTH_ENABLED) {
    // Dev mode: check for dev-session cookie set by mock signIn.
    if (!request.cookies.get("dev-session")) {
      return NextResponse.redirect(new URL("/signin", request.url))
    }
    return
  }

  // Optimistic check: look for Auth.js session cookie.
  // Full session validation happens inside each protected page via auth().
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token")

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
