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

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-foreground hover:opacity-80">
          Hackday App
        </Link>

        {user ? (
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
          <Link href="/api/auth/signin" className={buttonVariants({ size: "sm" })}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
