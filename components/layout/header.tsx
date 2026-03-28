"use client"

import { Menu } from "lucide-react"
import { UserMenu } from "./user-menu"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center border-b bg-card px-4 sm:px-6 shrink-0">
      <div className="flex flex-1 items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {title && (
          <h1 className="text-lg font-semibold">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  )
}
