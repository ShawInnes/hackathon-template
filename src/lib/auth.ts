import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"

// Cache the userinfo endpoint URL from OIDC discovery to avoid fetching it on every sign-in.
let cachedUserinfoUrl: string | null = null
async function getUserinfoUrl(issuer: string): Promise<string | null> {
  if (cachedUserinfoUrl) return cachedUserinfoUrl
  try {
    const discovery = await fetch(`${issuer}/.well-known/openid-configuration`).then((r) => r.json())
    cachedUserinfoUrl = discovery.userinfo_endpoint ?? null
  } catch {
    console.error("[auth] OIDC discovery fetch failed")
  }
  return cachedUserinfoUrl
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _exports: any

if (AUTH_ENABLED) {
  _exports = NextAuth({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter: PrismaAdapter(prisma as any),
    providers: [
      {
        id: "oidc",
        name: "OIDC",
        type: "oidc",
        clientId: process.env.AUTH_OIDC_ID!,
        issuer: process.env.AUTH_OIDC_ISSUER!,
        // PKCE flow — no client secret required.
        // The OIDC app must be configured as a public client with PKCE enabled.
        checks: ["pkce", "state"],
        authorization: { params: { scope: "openid email profile" } },
      },
    ],
    session: { strategy: "database" },
    debug: process.env.NODE_ENV === "development",
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id
        return session
      },
      async signIn({ account, user }) {
        if (account?.provider === "oidc" && account.access_token) {
          try {
            const userinfoUrl = await getUserinfoUrl(process.env.AUTH_OIDC_ISSUER!)
            if (userinfoUrl) {
              const userinfo = await fetch(userinfoUrl, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              }).then((r) => r.json())

              if (process.env.NODE_ENV === "development") {
                console.log("[auth] userinfo:", JSON.stringify(userinfo, null, 2))
              }

              await prisma.user.update({
                where: { id: user.id },
                data: {
                  name: userinfo.name ?? userinfo.preferred_username ?? undefined,
                  email: userinfo.email ?? userinfo.preferred_username ?? undefined,
                  image: userinfo.picture ?? undefined,
                },
              })
            }
          } catch (e) {
            console.error("[auth] userinfo fetch/update failed:", e)
          }
        }
        return true
      },
    },
    pages: {
      signIn: "/signin",
    },
  })
} else {
  _exports = {
    handlers: {
      GET: async () => new Response(null, { status: 404 }),
      POST: async () => new Response(null, { status: 404 }),
    },
    auth: async () => {
      const cookieStore = await cookies()
      if (!cookieStore.has("dev-session")) return null
      return {
        user: { id: "dev", name: "Dev User", email: "dev@local" },
        expires: "2099-01-01T00:00:00.000Z",
      }
    },
    signIn: async () => {
      const cookieStore = await cookies()
      cookieStore.set("dev-session", "1", { httpOnly: true, path: "/" })
      redirect("/dashboard")
    },
    signOut: async () => {
      const cookieStore = await cookies()
      cookieStore.delete("dev-session")
      redirect("/")
    },
  }
}

export const { handlers, auth, signIn, signOut } = _exports
