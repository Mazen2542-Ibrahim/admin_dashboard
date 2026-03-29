"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth"
import { updateSettingsSchema, updateLocationSettingsSchema } from "./schema"
import { upsertAppSettings, upsertLocationSettings } from "./service"
import { getAppSettings } from "./queries"

export async function getAppSettingsAction() {
  try {
    await requirePermission("settings:read")
    const settings = await getAppSettings()
    return { success: true, data: settings }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function updateAppSettingsAction(formData: unknown) {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const parsed = updateSettingsSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await upsertAppSettings(parsed.data, actor.id, actor.email)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function updateLocationSettingsAction(formData: unknown) {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const parsed = updateLocationSettingsSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await upsertLocationSettings(parsed.data, actor.id, actor.email)
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}
