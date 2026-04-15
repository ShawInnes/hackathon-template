import NextAuth from "next-auth"
import Okta from "next-auth/providers/okta"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Okta({
      clientId: process.env.AUTH_OKTA_ID!,
      issuer: process.env.AUTH_OKTA_ISSUER!,
      // PKCE flow — no client secret required.
      // The Okta app must be configured as a public client with PKCE enabled.
      checks: ["pkce", "state"],
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
})
