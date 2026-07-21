import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card } from "@astryxdesign/core/Card"
import { Skeleton } from "@astryxdesign/core/Skeleton"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { HStack } from "@astryxdesign/core/HStack"
import { Grid } from "@astryxdesign/core/Grid"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  const user = session.user

  return (
    <PageLayout user={user}>
      <VStack gap={6}>
        <VStack gap={2}>
          <Heading level={1}>Dashboard</Heading>
          <Text color="secondary">Welcome back, {user.name ?? user.email}</Text>
        </VStack>

        <Grid columns={{ minWidth: 220, max: 4 }} gap={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <VStack gap={2}>
                <Skeleton index={i} width={96} height={16} />
                <Skeleton index={i} width={64} height={32} />
                <Skeleton index={i} width={128} height={12} />
              </VStack>
            </Card>
          ))}
        </Grid>

        <Grid columns={{ minWidth: 320, max: 2 }} gap={4}>
          <Card>
            <VStack gap={4}>
              <Skeleton width={128} height={20} />
              {Array.from({ length: 5 }).map((_, i) => (
                <HStack key={i} gap={3} align="center">
                  <Skeleton index={i} width={40} height={40} radius="rounded" />
                  <VStack gap={2} width="100%">
                    <Skeleton index={i} width="75%" height={16} />
                    <Skeleton index={i} width="50%" height={12} />
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Card>

          <Card>
            <VStack gap={4}>
              <Skeleton width={160} height={20} />
              <Skeleton height={192} />
            </VStack>
          </Card>
        </Grid>
      </VStack>
    </PageLayout>
  )
}
