import { auth } from "@/lib/auth"
import { PageLayout } from "@/components/page-layout"
import { HeroCta } from "@/components/hero-cta"
import { Center } from "@astryxdesign/core/Center"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <PageLayout user={user ?? null}>
      <Center height="calc(100vh - 7rem)">
        <VStack gap={6} align="center">
          <VStack gap={3} align="center">
            <Heading level={1} type="display-2" justify="center" textWrap="balance">
              Hackathon App
            </Heading>
            <Text type="body" color="secondary" justify="center" textWrap="balance">
              Built with the Hackathon Template — Next.js, OIDC SSO, and Astryx.
            </Text>
          </VStack>
          <HeroCta isSignedIn={Boolean(user)} />
        </VStack>
      </Center>
    </PageLayout>
  )
}
