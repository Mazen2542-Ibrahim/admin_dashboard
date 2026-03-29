"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Shield,
  Mail,
  FileText,
  ScrollText,
  Settings,
} from "lucide-react"
import type { Features } from "@/config/features.config"
import { canAccess } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: keyof Features
  permission?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:access" },
      { href: "/admin/users", label: "Users", icon: Users, permission: "users:read" },
      { href: "/admin/roles", label: "Roles & Permissions", icon: Shield, featureKey: "roles", permission: "roles:read" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/smtp", label: "SMTP Settings", icon: Mail, featureKey: "smtp", permission: "smtp:read" },
      { href: "/admin/email-templates", label: "Email Templates", icon: FileText, featureKey: "emailTemplates", permission: "email_templates:read" },
      { href: "/admin/settings", label: "Settings", icon: Settings, featureKey: "settings", permission: "settings:read" },
    ],
  },
  {
    label: "Logs",
    items: [
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, featureKey: "auditLogs", permission: "audit_logs:read" },
    ],
  },
]

interface SidebarNavProps {
  features: Features
  permissions: string[]
}

export function SidebarNav({ features, permissions }: SidebarNavProps) {
  const pathname = usePathname()

  function isVisible(item: NavItem) {
    if (item.featureKey && !features[item.featureKey]) return false
    if (item.permission && !canAccess(permissions, item.permission)) return false
    return true
  }

  return (
    <nav className="flex-1 px-3 py-2 space-y-4">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(isVisible)
        if (visibleItems.length === 0) return null

        return (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive =
                  item.href === "/admin/dashboard"
                    ? pathname === "/admin/dashboard"
                    : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
