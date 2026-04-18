import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"

export function SignInCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <h2 className="font-heading text-2xl font-medium leading-snug">Welcome</h2>
        <CardDescription>Sign in to access the hackathon app</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async () => {
            "use server"
            await signIn("oidc")
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with SSO
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
