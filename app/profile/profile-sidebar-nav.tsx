"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, LayoutDashboard, Users, FileText, ScrollText, Shield, Settings } from "lucide-react"
import type { Features } from "@/config/features.config"
import { canAccess } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  featureKey?: keyof Features
}

interface NavSection {
  title: string
  items: NavItem[]
}

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/profile", label: "My Profile", icon: User },
]

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:access" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "users:read" },
  { href: "/admin/email-templates", label: "Email Templates", icon: FileText, permission: "email_templates:read", featureKey: "emailTemplates" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, permission: "audit_logs:read", featureKey: "auditLogs" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: Shield, permission: "roles:read", featureKey: "roles" },
  { href: "/admin/smtp", label: "SMTP Settings", icon: Settings, permission: "smtp:read", featureKey: "smtp" },
]

interface ProfileSidebarNavProps {
  permissions: string[]
  features: Features
}

export function ProfileSidebarNav({ permissions, features }: ProfileSidebarNavProps) {
  const pathname = usePathname()

  const visibleAdminItems = ADMIN_ITEMS.filter((item) => {
    if (item.featureKey && !features[item.featureKey]) return false
    if (item.permission && !canAccess(permissions, item.permission)) return false
    return true
  })

  const sections: NavSection[] = [
    { title: "Account", items: ACCOUNT_ITEMS },
    ...(visibleAdminItems.length > 0
      ? [{ title: "Admin", items: visibleAdminItems }]
      : []),
  ]

  return (
    <nav className="flex-1 px-3 py-2 space-y-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive =
                item.href === "/profile"
                  ? pathname === "/profile"
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
      ))}
    </nav>
  )
}
