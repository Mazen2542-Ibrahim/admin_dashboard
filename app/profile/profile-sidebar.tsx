"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app.config"
import { features } from "@/config/features.config"
import { ProfileSidebarNav } from "./profile-sidebar-nav"

interface ProfileSidebarProps {
  permissions: string[]
  siteName?: string | null
  logoUrl?: string | null
  onClose?: () => void
}

export function ProfileSidebar({ permissions, siteName, logoUrl, onClose }: ProfileSidebarProps) {
  const displayName = siteName ?? appConfig.name
  const [logoError, setLogoError] = React.useState(false)
  const showLogo = logoUrl && !logoError

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-4 shrink-0">
        <Link href="/profile" className="flex flex-1 items-center gap-2 font-semibold">
          {showLogo ? (
            <Image
              src={logoUrl}
              alt={displayName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-contain shrink-0"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm truncate">{displayName}</span>
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
        <p>{displayName} v0.1.0</p>
      </div>
    </aside>
  )
}
