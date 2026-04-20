import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete("dev-session")
  return NextResponse.redirect(new URL("/", request.url))
}
