"use client"

import Link from "next/link"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app.config"
import { features } from "@/config/features.config"
import { ProfileSidebarNav } from "./profile-sidebar-nav"

interface ProfileSidebarProps {
  permissions: string[]
  onClose?: () => void
}

export function ProfileSidebar({ permissions, onClose }: ProfileSidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-4 shrink-0">
        <Link href="/profile" className="flex flex-1 items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
            A
          </div>
          <span className="text-sm truncate">{appConfig.name}</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden ml-auto p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <ProfileSidebarNav permissions={permissions} features={features} />

      <Separator />

      <div className="p-4 text-xs text-muted-foreground shrink-0">
        <p>{appConfig.name} v0.1.0</p>
      </div>
    </aside>
  )
}
