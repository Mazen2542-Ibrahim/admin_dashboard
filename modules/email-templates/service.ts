import { db } from "@/lib/db"
import { emailTemplates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { logActivity } from "@/lib/activity-logger"
import { getTemplateByName, getTemplateById } from "./queries"
import type { CreateEmailTemplateInput, UpdateEmailTemplateInput } from "./types"

/** Replace {{variableName}} placeholders in a string */
function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

export async function createTemplate(
  input: CreateEmailTemplateInput,
  actorId?: string,
  actorEmail?: string
) {
  const existing = await getTemplateByName(input.name)
  if (existing) throw new Error("ActionError: A template with this name already exists")

  const [template] = await db
    .insert(emailTemplates)
    .values({
      name: input.name,
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody ?? null,
      variables: input.variables ?? null,
      isActive: input.isActive ?? true,
    })
    .returning()

  await logActivity({
    actorId,
    actorEmail,
    action: "email_template.created",
    resourceType: "email_template",
    resourceId: template.id,
    metadata: { name: template.name },
  })

  return template
}

export async function updateTemplate(
  id: string,
  input: UpdateEmailTemplateInput,
  actorId?: string,
  actorEmail?: string
) {
  if (input.name) {
    const existing = await getTemplateByName(input.name)
    if (existing && existing.id !== id) {
      throw new Error("ActionError: A template with this name already exists")
    }
  }

  const updateData: Partial<typeof emailTemplates.$inferInsert> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.subject !== undefined) updateData.subject = input.subject
  if (input.htmlBody !== undefined) updateData.htmlBody = input.htmlBody
  if (input.textBody !== undefined) updateData.textBody = input.textBody ?? null
  if (input.variables !== undefined) updateData.variables = input.variables ?? null
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  const [updated] = await db
    .update(emailTemplates)
    .set(updateData)
    .where(eq(emailTemplates.id, id))
    .returning()

  if (!updated) throw new Error("ActionError: Template not found")

  await logActivity({
    actorId,
    actorEmail,
    action: "email_template.updated",
    resourceType: "email_template",
    resourceId: id,
    metadata: { updatedFields: Object.keys(input) },
  })

  return updated
}

export async function deleteTemplate(
  id: string,
  actorId?: string,
  actorEmail?: string
) {
  const [deleted] = await db
    .delete(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .returning()

  if (!deleted) throw new Error("ActionError: Template not found")

  await logActivity({
    actorId,
    actorEmail,
    action: "email_template.deleted",
    resourceType: "email_template",
    resourceId: id,
    metadata: { name: deleted.name },
  })

  return deleted
}

/**
 * Send an email using a template looked up by name.
 * Never throws — email failures must not break auth flows.
 */
export async function sendTemplateEmailByName(
  templateName: string,
  toEmail: string,
  variables: Record<string, string>
): Promise<void> {
  try {
    const template = await getTemplateByName(templateName)
    if (!template || !template.isActive) return

    const subject = interpolate(template.subject, variables)
    const html = interpolate(template.htmlBody, variables)
    const text = template.textBody ? interpolate(template.textBody, variables) : undefined

    await sendEmail({ to: toEmail, subject, html, text })
  } catch {
    // Silently swallow — email failures must never break auth flows
  }
}

export async function sendTemplateEmail(
  templateId: string,
  toEmail: string,
  variables: Record<string, string> = {},
  actorId?: string,
  actorEmail?: string
) {
  const template = await getTemplateById(templateId)
  if (!template) throw new Error("ActionError: Template not found")
  if (!template.isActive) throw new Error("ActionError: Template is not active")

  const subject = interpolate(template.subject, variables)
  const html = interpolate(template.htmlBody, variables)
  const text = template.textBody ? interpolate(template.textBody, variables) : undefined

  await sendEmail({ to: toEmail, subject, html, text })

  await logActivity({
    actorId,
    actorEmail,
    action: "email_template.sent",
    resourceType: "email_template",
    resourceId: templateId,
    metadata: { toEmail, templateName: template.name },
  })
}
