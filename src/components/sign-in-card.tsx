import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

export function SignInCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <h2 className="font-heading text-2xl font-medium leading-snug">Welcome</h2>
        <CardDescription>Sign in to access the hackday app</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/api/auth/signin" className={buttonVariants({ className: "w-full" })}>
          Sign in with Okta
        </Link>
      </CardContent>
    </Card>
  )
}
