"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { IconButton } from "@astryxdesign/core/IconButton"
import { useThemeMode } from "@/components/providers"

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode()
  const isDark = mode === "dark"

  return (
    <IconButton
      variant="ghost"
      label="Toggle theme"
      tooltip="Toggle theme"
      icon={isDark ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
      onClick={() => setMode(isDark ? "light" : "dark")}
    />
  )
}
