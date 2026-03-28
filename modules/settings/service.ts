import { db } from "@/lib/db"
import { appSettings } from "@/db/schema"
import { logAudit } from "@/modules/audit-logs/service"
import { getAppSettings } from "./queries"
import type { UpdateSettingsInput } from "./types"

export async function upsertAppSettings(
  data: UpdateSettingsInput,
  actorId?: string,
  actorEmail?: string
): Promise<void> {
  const existing = await getAppSettings()

  if (existing) {
    await db
      .update(appSettings)
      .set({
        emailVerificationEnabled: data.emailVerificationEnabled,
        registrationEnabled: data.registrationEnabled,
        emailOtpEnabled: data.emailOtpEnabled,
        auditLogRetentionDays: data.auditLogRetentionDays,
      })
  } else {
    await db.insert(appSettings).values({
      emailVerificationEnabled: data.emailVerificationEnabled,
      registrationEnabled: data.registrationEnabled,
      emailOtpEnabled: data.emailOtpEnabled,
      auditLogRetentionDays: data.auditLogRetentionDays,
    })
  }

  await logAudit({
    actorId,
    actorEmail,
    action: "settings.updated",
    resourceType: "settings",
    metadata: data,
  })
}
