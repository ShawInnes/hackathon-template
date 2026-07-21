"use client"

import { useRouter } from "next/navigation"
import { Button } from "@astryxdesign/core/Button"

export function HeroCta() {
  const router = useRouter()

  return (
    <Button label="Go to profile" variant="primary" onClick={() => router.push("/profile")} />
  )
}
