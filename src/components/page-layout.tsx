import { AppShell } from "@astryxdesign/core/AppShell"
import { Navbar, NavbarUser } from "@/components/navbar"

interface PageLayoutProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

function toNavbarUser(user: PageLayoutProps["user"]): NavbarUser | null {
  if (!user) return null
  return {
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  }
}

const authEnabled = process.env.AUTH_ENABLED === "true"

export function PageLayout({ children, user }: PageLayoutProps) {
  return (
    <AppShell topNav={<Navbar user={toNavbarUser(user)} authEnabled={authEnabled} />} contentPadding={4}>
      {children}
    </AppShell>
  )
}
