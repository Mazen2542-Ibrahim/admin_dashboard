import { db } from "@/lib/db"
import { roles, permissions } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { RoleWithPermissions } from "./types"

export async function getAllRoles(): Promise<RoleWithPermissions[]> {
  const allRoles = await db.select().from(roles)
  const allPermissions = await db.select().from(permissions)

  return allRoles.map((role) => ({
    ...role,
    permissions: allPermissions.filter((p) => p.roleId === role.id),
  }))
}

export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1)

  if (!role) return null

  const rolePermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.roleId, id))

  return { ...role, permissions: rolePermissions }
}

export async function getRoleByName(name: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, name))
    .limit(1)
  return role ?? null
}
