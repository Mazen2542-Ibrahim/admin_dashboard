import { z } from "zod"

export const updateSettingsSchema = z.object({
  emailVerificationEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
  emailOtpEnabled: z.boolean(),
  auditLogRetentionDays: z.number().int().positive().nullable(),
  lockoutEnabled: z.boolean(),
  maxFailedAttempts: z.number().int().min(1).max(100),
  lockoutDurationMinutes: z.number().int().min(1),
})

export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>

export const updateLocationSettingsSchema = z.object({
  requireLocationForAuth: z.boolean(),
  allowedCountries: z.array(z.string().length(2)).default([]),
})

export type UpdateLocationSettingsSchema = z.infer<typeof updateLocationSettingsSchema>

export const updateBrandingNameSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
})

export type UpdateBrandingNameSchema = z.infer<typeof updateBrandingNameSchema>
