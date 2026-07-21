import { signIn } from "@/lib/auth"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { Button } from "@astryxdesign/core/Button"
import { VStack } from "@astryxdesign/core/VStack"

interface SignInCardProps {
  authEnabled: boolean
}

export function SignInCard({ authEnabled }: SignInCardProps) {
  return (
    <Card width={384}>
      <VStack gap={4} align="center">
        <VStack gap={1} align="center">
          <Heading level={1} justify="center">
            Welcome
          </Heading>
          <Text color="secondary">
            {authEnabled ? "Sign in to access the app" : "DEV mode — This is NOT real security!"}
          </Text>
        </VStack>
        <form
          action={async () => {
            "use server"
            await signIn("oidc")
          }}
          className="w-full"
        >
          <Button
            type="submit"
            label={authEnabled ? "Sign in with SSO" : "Continue as Dev User"}
            width="100%"
          />
        </form>
      </VStack>
    </Card>
  )
}
