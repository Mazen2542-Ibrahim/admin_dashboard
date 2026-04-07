"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth"
import { getActionErrorMessage } from "@/lib/action-error"
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdSchema,
  sendTemplateSchema,
} from "./schema"
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplateEmail,
} from "./service"

export async function createTemplateAction(formData: unknown) {
  try {
    const session = await requirePermission("email_templates:create")
    const actor = session.user as { id: string; email: string }

    const parsed = createTemplateSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const template = await createTemplate(parsed.data, actor.id, actor.email)
    revalidatePath("/admin/email-templates")
    return { success: true, data: { id: template.id } }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function updateTemplateAction(id: string, formData: unknown) {
  try {
    const session = await requirePermission("email_templates:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = templateIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid template ID" } }

    const parsed = updateTemplateSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await updateTemplate(id, parsed.data, actor.id, actor.email)
    revalidatePath("/admin/email-templates")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    const session = await requirePermission("email_templates:delete")
    const actor = session.user as { id: string; email: string }

    const idParsed = templateIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid template ID" } }

    await deleteTemplate(id, actor.id, actor.email)
    revalidatePath("/admin/email-templates")
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

export async function sendTemplateEmailAction(formData: unknown) {
  try {
    const session = await requirePermission("email_templates:read")
    const actor = session.user as { id: string; email: string }

    const parsed = sendTemplateSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await sendTemplateEmail(
      parsed.data.templateId,
      parsed.data.toEmail,
      parsed.data.variables ?? {},
      actor.id,
      actor.email
    )
    return { success: true }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}
