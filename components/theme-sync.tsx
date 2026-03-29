"use client"
import { useEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    // Only sync from DB once per browser session.
    // After the first sync, next-themes localStorage is the source of truth.
    // This prevents a stale DB read from overriding a theme the user just changed.
    if (!sessionStorage.getItem("theme-synced")) {
      sessionStorage.setItem("theme-synced", "1")
      setTheme(theme)
    }
  }, [theme, setTheme])
  return null
}
