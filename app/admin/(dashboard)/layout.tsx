import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserPermissions } from "@/lib/permissions"
import { canAccess } from "@/lib/utils"
import { AppShell } from "@/components/layout/app-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const permissions = await getUserPermissions(session.user.id)

  if (!canAccess(Array.from(permissions), "dashboard:access")) {
    redirect("/profile")
  }

  const { id, name, email, image } = session.user as { id: string; name: string; email: string; image?: string | null }

  return (
    <AppShell permissions={Array.from(permissions)} initialUser={{ id, name, email, image }}>
      {children}
    </AppShell>
  )
}
