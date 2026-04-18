import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export function Hero() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center text-center">
      <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
        Hackday App
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Build something great. Sign in to get started.
      </p>
      <div className="mt-8">
        <Link href="/signin" className={buttonVariants({ size: "lg" })}>
          Sign in with SSO
        </Link>
      </div>
    </div>
  )
}
