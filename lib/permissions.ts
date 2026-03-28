import { db } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

async function getPermissionsByRoleName(roleName: string): Promise<Set<string>> {
  // super_admin has implicit full access — wildcard grants everything
  if (roleName === "super_admin") return new Set(["*"])

  const [role] = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(eq(schema.roles.name, roleName))
    .limit(1)

  if (!role) return new Set()

  const perms = await db
    .select({ resource: schema.permissions.resource, action: schema.permissions.action })
    .from(schema.permissions)
    .where(eq(schema.permissions.roleId, role.id))

  return new Set(perms.map((p) => `${p.resource}:${p.action}`))
}

/**
 * Returns all permissions for the given user as a Set of "resource:action" strings.
 * Super admins receive a wildcard set granting access to everything.
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const [dbUser] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!dbUser) return new Set()

  return getPermissionsByRoleName(dbUser.role)
}

/**
 * Returns the permissions assigned to the visitor (unauthenticated) role.
 * Used to determine what public resources an unsigned user can access.
 */
export async function getVisitorPermissions(): Promise<Set<string>> {
  return getPermissionsByRoleName("visitor")
}
