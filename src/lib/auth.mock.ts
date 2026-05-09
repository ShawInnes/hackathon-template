import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

const DEV_USER_ID = "dev"
const DEV_USER_NAME = "Dev User"
const DEV_USER_EMAIL = "dev@local"

export const handlers = {
  GET: async () => new Response(null, { status: 404 }),
  POST: async () => new Response(null, { status: 404 }),
}

export async function auth() {
  const cookieStore = await cookies()
  if (!cookieStore.has("dev-session")) return null
  return {
    user: { id: DEV_USER_ID, name: DEV_USER_NAME, email: DEV_USER_EMAIL },
    expires: "2099-01-01T00:00:00.000Z",
  }
}

export async function signIn() {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    create: { id: DEV_USER_ID, name: DEV_USER_NAME, email: DEV_USER_EMAIL },
    update: {},
  })
  const cookieStore = await cookies()
  cookieStore.set("dev-session", "1", { httpOnly: true, path: "/" })
  redirect("/dashboard")
}

export async function signOut(options?: { redirectTo?: string }) {
  const cookieStore = await cookies()
  cookieStore.delete("dev-session")
  redirect(options?.redirectTo ?? "/")
}
