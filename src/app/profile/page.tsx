import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  const user = session.user

  return (
    <PageLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
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
                <dt className="text-muted-foreground w-16 font-medium">Name</dt>
                <dd>{user.name ?? "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-16 font-medium">Email</dt>
                <dd>{user.email ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
