import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserPermissions } from "@/lib/permissions"
import { ProfileShell } from "./profile-shell"

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const permissions = await getUserPermissions(session.user.id)

  const { id, name, email, image } = session.user as { id: string; name: string; email: string; image?: string | null }

  return (
    <ProfileShell permissions={Array.from(permissions)} initialUser={{ id, name, email, image }}>
      {children}
    </ProfileShell>
  )
}
