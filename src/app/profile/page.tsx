import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { HStack } from "@astryxdesign/core/HStack"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  const user = session.user

  return (
    <PageLayout user={user}>
      <VStack gap={6}>
        <VStack gap={2}>
          <Heading level={1}>Profile</Heading>
          <Text color="secondary">Welcome back, {user.name ?? user.email}</Text>
        </VStack>

        <Card>
          <VStack gap={4}>
            <Heading level={2}>Your session</Heading>
            <VStack gap={2}>
              <HStack gap={2}>
                <Text size="sm" weight="medium" color="secondary">
                  Name
                </Text>
                <Text size="sm">{user.name ?? "—"}</Text>
              </HStack>
              <HStack gap={2}>
                <Text size="sm" weight="medium" color="secondary">
                  Email
                </Text>
                <Text size="sm">{user.email ?? "—"}</Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </PageLayout>
  )
}
