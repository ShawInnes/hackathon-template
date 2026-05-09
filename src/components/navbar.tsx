"use client"

import Link from "next/link"
import { signOutAction } from "@/lib/actions/sign-out"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Navbar({ user, authEnabled }: NavbarProps) {
  return (
    <nav className="bg-background border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-foreground font-semibold hover:opacity-80">
          Hackathon App
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            authEnabled ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none">
                  <Avatar size="sm">
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? "User"} />}
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/profile" />}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOutAction()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">{user.name}</span>
                <form action={signOutAction}>
                  <Button type="submit" size="sm">
                    Sign out
                  </Button>
                </form>
              </div>
            )
          ) : (
            <Link href="/signin" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
