import { Navbar, NavbarUser } from "@/components/navbar"

interface PageLayoutProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

function toNavbarUser(
  user: PageLayoutProps["user"]
): NavbarUser | null {
  if (!user) return null
  return {
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  }
}

export function PageLayout({ children, user }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={toNavbarUser(user)} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
