import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
