import { db } from "@/lib/db"
import { roles, permissions } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { RoleWithPermissions } from "./types"

export async function getAllRoles(): Promise<RoleWithPermissions[]> {
  const rows = await db
    .select({
      role: roles,
      permission: permissions,
    })
    .from(roles)
    .leftJoin(permissions, eq(permissions.roleId, roles.id))

  // Group permissions by role ID
  const roleMap = new Map<string, RoleWithPermissions>()
  for (const { role, permission } of rows) {
    if (!roleMap.has(role.id)) {
      roleMap.set(role.id, { ...role, permissions: [] })
    }
    if (permission) {
      roleMap.get(role.id)!.permissions.push(permission)
    }
  }

  return Array.from(roleMap.values())
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
