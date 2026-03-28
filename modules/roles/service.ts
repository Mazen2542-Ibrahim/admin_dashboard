import { db } from "@/lib/db"
import { roles, permissions, users } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { logAudit } from "@/modules/audit-logs/service"
import { getRoleByName } from "./queries"
import type { CreateRoleInput, UpdateRoleInput } from "./types"

export async function createRole(
  input: CreateRoleInput,
  actorId?: string,
  actorEmail?: string
) {
  const existing = await getRoleByName(input.name)
  if (existing) throw new Error("A role with this name already exists")

  const [newRole] = await db
    .insert(roles)
    .values({
      name: input.name,
      description: input.description ?? null,
      isSystem: false,
    })
    .returning()

  if (input.permissions.length > 0) {
    await db.insert(permissions).values(
      input.permissions.map((p) => ({
        roleId: newRole.id,
        resource: p.resource,
        action: p.action,
      }))
    )
  }

  await logAudit({
    actorId,
    actorEmail,
    action: "role.created",
    resourceType: "role",
    resourceId: newRole.id,
    metadata: { name: newRole.name },
  })

  return newRole
}

export async function updateRole(
  id: string,
  input: UpdateRoleInput,
  actorId?: string,
  actorEmail?: string
) {
  const [existing] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  if (!existing) throw new Error("Role not found")

  if (existing.name === "super_admin") {
    throw new Error("The super_admin role is immutable and cannot be modified")
  }

  if (existing.isSystem && input.name && input.name !== existing.name) {
    throw new Error("System role names cannot be changed")
  }

  if (input.name && input.name !== existing.name) {
    const nameConflict = await getRoleByName(input.name)
    if (nameConflict) throw new Error("A role with this name already exists")
  }

  const updateData: Partial<{ name: string; description: string | null }> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.description !== undefined) updateData.description = input.description ?? null

  if (Object.keys(updateData).length > 0) {
    await db.update(roles).set(updateData).where(eq(roles.id, id))
  }

  if (input.permissions !== undefined) {
    await db.delete(permissions).where(eq(permissions.roleId, id))
    if (input.permissions.length > 0) {
      await db.insert(permissions).values(
        input.permissions.map((p) => ({
          roleId: id,
          resource: p.resource,
          action: p.action,
        }))
      )
    }
  }

  await logAudit({
    actorId,
    actorEmail,
    action: "role.updated",
    resourceType: "role",
    resourceId: id,
    metadata: input as Record<string, unknown>,
  })
}

export async function deleteRole(
  id: string,
  actorId?: string,
  actorEmail?: string
) {
  const [existing] = await db.select().from(roles).where(eq(roles.id, id)).limit(1)
  if (!existing) throw new Error("Role not found")
  if (existing.isSystem) throw new Error("System roles cannot be deleted")

  const [{ value: userCount }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, existing.name))

  if (userCount > 0) {
    throw new Error(
      `This role is assigned to ${userCount} user${userCount === 1 ? "" : "s"} and cannot be deleted`
    )
  }

  await db.delete(roles).where(eq(roles.id, id))

  await logAudit({
    actorId,
    actorEmail,
    action: "role.deleted",
    resourceType: "role",
    resourceId: id,
    metadata: { name: existing.name },
  })
}
