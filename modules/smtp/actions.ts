"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { smtpSettingsSchema, testSmtpSchema } from "./schema"
import { upsertSmtpSettings, testSmtpConnection } from "./service"

export async function saveSmtpSettingsAction(formData: unknown) {
  try {
    const session = await requirePermission("smtp:update")
    const actor = session.user as { id: string; email: string }

    const parsed = smtpSettingsSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await upsertSmtpSettings(parsed.data, actor.id, actor.email)
    revalidatePath("/admin/smtp")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function testSmtpAction(formData: unknown) {
  try {
    const session = await requirePermission("smtp:read")
    const actor = session.user as { id: string; email: string }

    // Rate limit: 3 test emails per minute per user
    const { success: rateLimitOk } = await rateLimit({
      key: `smtp-test:${actor.id}`,
      limit: 3,
      windowMs: 60_000,
    })

    if (!rateLimitOk) {
      return { error: { message: "Too many test emails. Please wait a minute." } }
    }

    const parsed = testSmtpSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await testSmtpConnection(parsed.data.toEmail, actor.id, actor.email)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}
