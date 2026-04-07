"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { requirePermission } from "@/lib/auth"
import { getActionErrorMessage } from "@/lib/action-error"
import { updateSettingsSchema, updateLocationSettingsSchema, updateBrandingNameSchema } from "./schema"
import { upsertAppSettings, upsertLocationSettings, upsertBrandingSettings } from "./service"
import { getAppSettings } from "./queries"
import { deleteFile } from "@/lib/storage"

export async function getAppSettingsAction() {
  try {
    await requirePermission("settings:read")
    const settings = await getAppSettings()
    return { success: true, data: settings }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function updateAppSettingsAction(formData: unknown) {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const parsed = updateSettingsSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await upsertAppSettings(parsed.data, actor.id, actor.email)
    revalidateTag("app-settings")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
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
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function updateBrandingNameAction(formData: unknown) {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const parsed = updateBrandingNameSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await upsertBrandingSettings({ siteName: parsed.data.siteName }, actor.id, actor.email)
    revalidateTag("app-settings")
    revalidateTag("branding-settings")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function deleteBrandingAssetAction(type: "logo" | "favicon") {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const settings = await getAppSettings()
    const oldUrl = type === "logo" ? settings?.siteLogoUrl : settings?.siteFaviconUrl

    if (oldUrl) {
      await deleteFile(oldUrl)
    }

    const data = type === "logo" ? { siteLogoUrl: null } : { siteFaviconUrl: null }
    await upsertBrandingSettings(data, actor.id, actor.email)

    revalidateTag("app-settings")
    revalidateTag("branding-settings")
    revalidatePath("/admin/settings")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}
