import { db } from "@/lib/db"
import { smtpSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { SmtpSettings } from "./types"

/** Returns active SMTP settings without the encrypted password */
export async function getActiveSmtpSettings(): Promise<SmtpSettings | null> {
  const [config] = await db
    .select({
      id: smtpSettings.id,
      host: smtpSettings.host,
      port: smtpSettings.port,
      username: smtpSettings.username,
      fromName: smtpSettings.fromName,
      fromEmail: smtpSettings.fromEmail,
      secure: smtpSettings.secure,
      isActive: smtpSettings.isActive,
      createdAt: smtpSettings.createdAt,
      updatedAt: smtpSettings.updatedAt,
    })
    .from(smtpSettings)
    .where(eq(smtpSettings.isActive, true))
    .limit(1)

  return config ?? null
}

/** Returns the full row including encryptedPassword — for service layer only */
export async function getSmtpSettingsRaw() {
  const [config] = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.isActive, true))
    .limit(1)

  return config ?? null
}
