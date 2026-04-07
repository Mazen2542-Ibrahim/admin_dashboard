"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { requirePermission } from "@/lib/auth"
import { getActionErrorMessage } from "@/lib/action-error"
import { createRoleSchema, updateRoleSchema, roleIdSchema } from "./schema"
import { createRole, updateRole, deleteRole } from "./service"

export async function createRoleAction(formData: unknown) {
  try {
    const session = await requirePermission("roles:create")
    const actor = session.user as { id: string; email: string }

    const parsed = createRoleSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const role = await createRole(parsed.data, actor.id, actor.email)
    revalidatePath("/admin/roles")
    revalidateTag("user-permissions")
    return { success: true, data: { id: role.id } }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function updateRoleAction(id: string, formData: unknown) {
  try {
    const session = await requirePermission("roles:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = roleIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid role ID" } }

    const parsed = updateRoleSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await updateRole(id, parsed.data, actor.id, actor.email)
    revalidatePath("/admin/roles")
    revalidateTag("user-permissions")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function deleteRoleAction(id: string) {
  try {
    const session = await requirePermission("roles:delete")
    const actor = session.user as { id: string; email: string }

    const idParsed = roleIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid role ID" } }

    await deleteRole(id, actor.id, actor.email)
    revalidatePath("/admin/roles")
    revalidateTag("user-permissions")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}
