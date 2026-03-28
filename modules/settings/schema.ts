import { z } from "zod"

export const updateSettingsSchema = z.object({
  emailVerificationEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
  emailOtpEnabled: z.boolean(),
  auditLogRetentionDays: z.number().int().positive().nullable(),
})

export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>
