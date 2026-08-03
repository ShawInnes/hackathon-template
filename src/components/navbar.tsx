"use client"

import { useRouter } from "next/navigation"
import { signOutAction } from "@/lib/actions/sign-out"
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav"
import { Avatar } from "@astryxdesign/core/Avatar"
import { Button } from "@astryxdesign/core/Button"
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { HStack } from "@astryxdesign/core/HStack"
import { ThemeToggle } from "@/components/theme-toggle"

export interface NavbarUser {
  name: string | null
  email: string | null
  image: string | null
}

interface NavbarProps {
  user: NavbarUser | null
  workerEnabled?: boolean
}

export function Navbar({ user, workerEnabled = false }: NavbarProps) {
  const router = useRouter()

  return (
    <TopNav
      heading={<TopNavHeading heading="Hackathon App" headingHref="/" />}
      endContent={
        <HStack gap={2} align="center">
          <ThemeToggle />
          {user ? (
            <DropdownMenu
              button={{
                label: user.name ?? user.email ?? "Account",
                icon: (
                  <Avatar
                    name={user.name ?? user.email ?? "?"}
                    src={user.image ?? undefined}
                    size="xsm"
                  />
                ),
                variant: "ghost",
              }}
              items={[
                { label: user.email ?? "", isDisabled: true },
                { type: "divider" },
                { label: "Profile", onClick: () => router.push("/profile") },
                ...(workerEnabled
                  ? [{ label: "Worker Status", onClick: () => router.push("/worker") }]
                  : []),
                { label: "Sign out", onClick: () => signOutAction() },
              ]}
            />
          ) : (
            <Button size="sm" label="Sign in" onClick={() => router.push("/signin")} />
          )}
        </HStack>
      }
    />
  )
}
