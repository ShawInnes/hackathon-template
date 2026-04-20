"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface NavbarUser {
  name: string | null
  email: string | null
  image: string | null
}

interface NavbarProps {
  user: NavbarUser | null
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

const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true"

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-foreground hover:opacity-80">
          Hackathon App
        </Link>

        {user ? (
          authEnabled ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted outline-none">
                <Avatar size="sm">
                  {user.image && <AvatarImage src={user.image} alt={user.name ?? "User"} />}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <span>{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Link href="/api/auth/dev-signout" className={buttonVariants({ size: "sm" })}>
                Sign out
              </Link>
            </div>
          )
        ) : (
          <Link href="/signin" className={buttonVariants({ size: "sm" })}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
