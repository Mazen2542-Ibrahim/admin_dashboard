import { redirect } from "next/navigation"
import { getAllRoles } from "@/modules/roles/queries"
import { RolesList } from "./roles-list"
import { features } from "@/config/features.config"

export default async function RolesPage() {
  if (!features.roles) {
    redirect("/admin/dashboard")
  }

  const roles = await getAllRoles()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-muted-foreground">
          Manage roles and their access permissions
        </p>
      </div>

      <RolesList roles={roles} />
    </div>
  )
}
