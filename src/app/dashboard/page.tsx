import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const user = session.user as { name?: string | null; email?: string | null; image?: string | null }

  return (
    <PageLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name ?? user.email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your session</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-muted-foreground w-16">Name</dt>
                <dd>{user.name ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-muted-foreground w-16">Email</dt>
                <dd>{user.email ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Start building your app here */}
      </div>
    </PageLayout>
  )
}
