import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getLogger } from "@logtape/logtape"

const logger = getLogger(["app", "auth"])

const DiscoverySchema = z.object({ userinfo_endpoint: z.string().url().optional() }).passthrough()
const UserinfoSchema = z
  .object({
    name: z.string().optional(),
    preferred_username: z.string().optional(),
    email: z.string().optional(),
    picture: z.string().optional(),
  })
  .passthrough()

let cachedUserinfoUrl: string | null = null
async function getUserinfoUrl(issuer: string): Promise<string | null> {
  if (cachedUserinfoUrl) return cachedUserinfoUrl
  try {
    const raw = await fetch(`${issuer}/.well-known/openid-configuration`).then((r) => r.json())
    const discovery = DiscoverySchema.parse(raw)
    cachedUserinfoUrl = discovery.userinfo_endpoint ?? null
  } catch {
    logger.error("OIDC discovery fetch failed")
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
      // Instructs oauth4webapi to send client_id in the POST body only,
      // without any Authorization header — required for public PKCE clients.
      client: { token_endpoint_auth_method: "none" },
      authorization: { params: { scope: "openid email profile" } },
    },
  ],
  session: { strategy: "database" },
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
            const raw = await fetch(userinfoUrl, {
              headers: { Authorization: `Bearer ${account.access_token}` },
            }).then((r) => r.json())
            const userinfo = UserinfoSchema.parse(raw)

            logger.debug("userinfo received", { userinfo })

            await prisma.user.update({
              where: { id: user.id },
              data: {
                name: userinfo.name ?? userinfo.preferred_username ?? undefined,
                email: userinfo.email ?? undefined,
                image: userinfo.picture ?? undefined,
              },
            })
          }
        } catch (e) {
          logger.error("userinfo fetch/update failed: {message}", {
            message: e instanceof Error ? e.message : String(e),
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: "/signin",
  },
})
