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
  const rows = await db
    .select({ role: roles, permission: permissions })
    .from(roles)
    .leftJoin(permissions, eq(permissions.roleId, roles.id))
    .where(eq(roles.id, id))

  if (rows.length === 0) return null

  const { role } = rows[0]
  const rolePermissions = rows.flatMap(({ permission }) => (permission ? [permission] : []))
  return { ...role, permissions: rolePermissions }
}

export async function getRoleOptions() {
  return db.select({ id: roles.id, name: roles.name }).from(roles).orderBy(roles.name)
}

export async function getRoleByName(name: string) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, name))
    .limit(1)
  return role ?? null
}
