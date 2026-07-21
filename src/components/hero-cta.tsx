"use client"

import { useRouter } from "next/navigation"
import { Button } from "@astryxdesign/core/Button"

interface HeroCtaProps {
  isSignedIn: boolean
}

export function HeroCta({ isSignedIn }: HeroCtaProps) {
  const router = useRouter()

  return isSignedIn ? (
    <Button label="Go to profile" variant="primary" onClick={() => router.push("/profile")} />
  ) : (
    <Button label="Sign in" variant="primary" onClick={() => router.push("/signin")} />
  )
}
