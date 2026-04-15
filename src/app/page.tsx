import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { SignInCard } from "@/components/sign-in-card"

export default async function HomePage() {
  const session = await auth()

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <PageLayout user={null}>
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <SignInCard />
      </div>
    </PageLayout>
  )
}
