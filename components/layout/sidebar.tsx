"use client"

import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { SidebarNav } from "./sidebar-nav"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app.config"
import { features } from "@/config/features.config"

interface SidebarProps {
  permissions: string[]
  onClose?: () => void
  closeButtonRef?: React.RefObject<HTMLButtonElement>
}

export function Sidebar({ permissions, onClose, closeButtonRef }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo / App Name */}
      <div className="flex h-16 items-center gap-2 border-b px-4 shrink-0">
        <Link href="/admin/dashboard" className="flex flex-1 items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
            {appConfig.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm truncate">{appConfig.name}</span>
        </Link>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="md:hidden ml-auto p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <SidebarNav features={features} permissions={permissions} />

      <Separator />

      {/* Footer */}
      <div className="p-4 text-xs text-muted-foreground shrink-0">
        <p>{appConfig.name} v0.1.0</p>
      </div>
    </aside>
  )
}
