import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageLayout } from "@/components/page-layout"
import { Button, buttonVariants } from "@/components/ui/button"

const AUTH_ENABLED = process.env.AUTH_ENABLED === "true"

export default async function HomePage() {
  const session = await auth()

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <PageLayout user={null}>
      <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center text-center gap-6 -mt-24">
        <h1 className="text-5xl font-bold tracking-tight">Hackathon App</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Your blank canvas. <br />
          Build something great.
        </p>
        {AUTH_ENABLED ? (
          <Link href="/signin" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
        ) : (
          <form
            action={async () => {
              "use server"
              await signIn()
            }}
          >
            <Button type="submit" size="lg">
              Sign in
            </Button>
          </form>
        )}
      </div>
    </PageLayout>
  )
}
