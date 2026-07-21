"use client"

import { createContext, useContext, useState } from "react"
import Link from "next/link"
import { Theme } from "@astryxdesign/core/theme"
import { LinkProvider } from "@astryxdesign/core/Link"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import "@astryxdesign/theme-neutral/theme.css"

type ThemeMode = "system" | "light" | "dark"

const ThemeModeContext = createContext<{
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
} | null>(null)

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error("useThemeMode must be used within Providers")
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system")

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
      <Theme theme={neutralTheme} mode={mode}>
        <LinkProvider component={Link}>{children}</LinkProvider>
      </Theme>
    </ThemeModeContext.Provider>
  )
}
