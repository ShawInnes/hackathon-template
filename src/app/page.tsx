import { auth } from "@/lib/auth"
import { PageLayout } from "@/components/page-layout"
import { Center } from "@astryxdesign/core/Center"
import { Heading } from "@astryxdesign/core/Heading"
import { Section } from "@astryxdesign/core/Section"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"

export default async function HomePage() {
  const session = await auth()
  const user = session?.user

  return (
    <PageLayout user={user ?? null}>
      <VStack gap={0}>
        <Section
          variant="transparent"
          padding={0}
          height={440}
          className="from-accent-bg via-blue-vivid to-purple-vivid bg-gradient-to-br"
        >
          <Center height="100%">
            <VStack gap={3} align="center" className="px-6">
              <Heading
                level={1}
                type="display-1"
                justify="center"
                textWrap="balance"
                color="inherit"
                className="text-on-accent"
              >
                Hackathon App
              </Heading>
              <Text
                type="large"
                color="inherit"
                justify="center"
                textWrap="balance"
                className="text-on-accent"
              >
                Built with the Hackathon Template — Next.js, OIDC SSO, and Astryx.
              </Text>
            </VStack>
          </Center>
        </Section>
      </VStack>
    </PageLayout>
  )
}
