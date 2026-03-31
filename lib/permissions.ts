import { db } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Returns all permissions for the given user as a Set of "resource:action" strings.
 * Super admins receive a wildcard set granting access to everything.
 *
 * Fetches user role + permissions in a single LEFT JOIN query.
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      role: schema.users.role,
      resource: schema.permissions.resource,
      action: schema.permissions.action,
    })
    .from(schema.users)
    .leftJoin(schema.roles, eq(schema.roles.name, schema.users.role))
    .leftJoin(schema.permissions, eq(schema.permissions.roleId, schema.roles.id))
    .where(eq(schema.users.id, userId))

  if (rows.length === 0) return new Set() // User not found

  if (rows[0].role === "super_admin") return new Set(["*"])

  return new Set(
    rows
      .filter((r) => r.resource !== null && r.action !== null)
      .map((r) => `${r.resource}:${r.action}`)
  )
}

/**
 * Returns the permissions assigned to the visitor (unauthenticated) role.
 * Used to determine what public resources an unsigned user can access.
 */
export async function getVisitorPermissions(): Promise<Set<string>> {
  const rows = await db
    .select({ resource: schema.permissions.resource, action: schema.permissions.action })
    .from(schema.roles)
    .innerJoin(schema.permissions, eq(schema.permissions.roleId, schema.roles.id))
    .where(eq(schema.roles.name, "visitor"))

  return new Set(rows.map((r) => `${r.resource}:${r.action}`))
}
