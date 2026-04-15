import { Navbar } from "@/components/navbar"

interface PageLayoutProps {
  children: React.ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

export function PageLayout({ children, user }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
