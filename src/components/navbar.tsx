"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOutAction } from "@/lib/actions/sign-out"
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav"
import { Avatar } from "@astryxdesign/core/Avatar"
import { Button } from "@astryxdesign/core/Button"
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { HStack } from "@astryxdesign/core/HStack"
import { Text } from "@astryxdesign/core/Text"
import { ThemeToggle } from "@/components/theme-toggle"

export interface NavbarUser {
  name: string | null
  email: string | null
  image: string | null
}

interface NavbarProps {
  user: NavbarUser | null
  authEnabled: boolean
}

export function Navbar({ user, authEnabled }: NavbarProps) {
  const router = useRouter()

  return (
    <TopNav
      heading={<TopNavHeading heading="Hackathon App" headingHref="/" as={Link} />}
      endContent={
        <HStack gap={2} align="center">
          <ThemeToggle />
          {user ? (
            authEnabled ? (
              <DropdownMenu
                button={{
                  label: user.name ?? user.email ?? "Account",
                  icon: (
                    <Avatar
                      name={user.name ?? user.email ?? "?"}
                      src={user.image ?? undefined}
                      size="tiny"
                    />
                  ),
                  variant: "ghost",
                }}
                items={[
                  { label: user.email ?? "", isDisabled: true },
                  { type: "divider" },
                  { label: "Profile", onClick: () => router.push("/profile") },
                  { label: "Sign out", onClick: () => signOutAction() },
                ]}
              />
            ) : (
              <HStack gap={3} align="center">
                <Text size="sm" color="secondary">
                  {user.name}
                </Text>
                <form action={signOutAction}>
                  <Button type="submit" size="sm" label="Sign out" />
                </form>
              </HStack>
            )
          ) : (
            <Button size="sm" label="Sign in" onClick={() => router.push("/signin")} />
          )}
        </HStack>
      }
    />
  )
}
