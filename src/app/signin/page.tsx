import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageLayout } from "@/components/page-layout"
import { SignInCard } from "@/components/sign-in-card"
import { Center } from "@astryxdesign/core/Center"

export default async function SignInPage() {
  const session = await auth()

  if (session?.user) {
    redirect("/")
  }

  return (
    <PageLayout user={null}>
      <Center height="calc(100vh - 7rem)">
        <SignInCard />
      </Center>
    </PageLayout>
  )
}
