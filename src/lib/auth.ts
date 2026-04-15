import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    },
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
})
