import { db } from "@/lib/db"
import { smtpSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { encrypt } from "@/lib/encryption"
import { sendEmail } from "@/lib/email"
import { logActivity } from "@/lib/activity-logger"
import { getSmtpSettingsRaw } from "./queries"
import type { SmtpSettingsInput } from "./types"

export async function upsertSmtpSettings(
  input: SmtpSettingsInput,
  actorId?: string,
  actorEmail?: string
) {
  const encryptedPassword = encrypt(input.password)

  const existing = await getSmtpSettingsRaw()

  if (existing) {
    await db
      .update(smtpSettings)
      .set({
        host: input.host,
        port: input.port,
        username: input.username,
        encryptedPassword,
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        secure: input.secure,
        isActive: true,
      })
      .where(eq(smtpSettings.id, existing.id))
  } else {
    await db.insert(smtpSettings).values({
      host: input.host,
      port: input.port,
      username: input.username,
      encryptedPassword,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      secure: input.secure,
      isActive: true,
    })
  }

  await logActivity({
    actorId,
    actorEmail,
    action: "smtp.updated",
    resourceType: "smtp",
    metadata: {
      host: input.host,
      port: input.port,
      fromEmail: input.fromEmail,
    },
  })
}

export async function testSmtpConnection(
  toEmail: string,
  actorId?: string,
  actorEmail?: string
) {
  await sendEmail({
    to: toEmail,
    subject: "SMTP Test — Admin Dashboard",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>SMTP Configuration Test</h2>
        <p>This is a test email from your Admin Dashboard.</p>
        <p>If you received this, your SMTP configuration is working correctly!</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Sent from Admin Dashboard SMTP test</p>
      </div>
    `,
    text: "SMTP Configuration Test\n\nThis is a test email from your Admin Dashboard. If you received this, your SMTP configuration is working correctly!",
  })

  await logActivity({
    actorId,
    actorEmail,
    action: "smtp.test_sent",
    resourceType: "smtp",
    metadata: { toEmail },
  })
}
