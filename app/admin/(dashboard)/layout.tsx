import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserPermissions } from "@/lib/permissions"
import { getUserById } from "@/modules/users/queries"
import { canAccess } from "@/lib/utils"
import { AppShell } from "@/components/layout/app-shell"
import { ThemeSync } from "@/components/theme-sync"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const [permissions, user] = await Promise.all([
    getUserPermissions(session.user.id),
    getUserById(session.user.id),
  ])

  if (!canAccess(Array.from(permissions), "dashboard:access")) {
    redirect("/profile")
  }

  const { id, name, email, image } = session.user as { id: string; name: string; email: string; image?: string | null }

  return (
    <AppShell permissions={Array.from(permissions)} initialUser={{ id, name, email, image }}>
      <ThemeSync theme={user?.themePreference ?? "system"} />
      {children}
    </AppShell>
  )
}
