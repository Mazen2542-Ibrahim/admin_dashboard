import { db } from "@/lib/db"
import { appSettings } from "@/db/schema"
import { logActivity } from "@/lib/activity-logger"
import { getAppSettings } from "./queries"
import type { UpdateSettingsInput, UpdateLocationSettingsInput, UpdateBrandingInput } from "./types"

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
        lockoutEnabled: data.lockoutEnabled,
        maxFailedAttempts: data.maxFailedAttempts,
        lockoutDurationMinutes: data.lockoutDurationMinutes,
      })
  } else {
    await db.insert(appSettings).values({
      emailVerificationEnabled: data.emailVerificationEnabled,
      registrationEnabled: data.registrationEnabled,
      emailOtpEnabled: data.emailOtpEnabled,
      auditLogRetentionDays: data.auditLogRetentionDays,
      lockoutEnabled: data.lockoutEnabled,
      maxFailedAttempts: data.maxFailedAttempts,
      lockoutDurationMinutes: data.lockoutDurationMinutes,
    })
  }

  await logActivity({
    actorId,
    actorEmail,
    action: "settings.updated",
    resourceType: "settings",
    metadata: data,
  })
}

export async function upsertLocationSettings(
  data: UpdateLocationSettingsInput,
  actorId?: string,
  actorEmail?: string
): Promise<void> {
  const existing = await getAppSettings()

  if (existing) {
    await db
      .update(appSettings)
      .set({
        requireLocationForAuth: data.requireLocationForAuth,
        allowedCountries: data.allowedCountries,
      })
  } else {
    await db.insert(appSettings).values({
      requireLocationForAuth: data.requireLocationForAuth,
      allowedCountries: data.allowedCountries,
    })
  }

  await logActivity({
    actorId,
    actorEmail,
    action: "settings.location_updated",
    resourceType: "settings",
    metadata: data as unknown as Record<string, unknown>,
  })
}

export async function upsertBrandingSettings(
  data: UpdateBrandingInput,
  actorId?: string,
  actorEmail?: string
): Promise<void> {
  const existing = await getAppSettings()

  if (existing) {
    await db.update(appSettings).set(data)
  } else {
    await db.insert(appSettings).values(data)
  }

  await logActivity({
    actorId,
    actorEmail,
    action: "settings.branding_updated",
    resourceType: "settings",
    metadata: data as unknown as Record<string, unknown>,
  })
}
