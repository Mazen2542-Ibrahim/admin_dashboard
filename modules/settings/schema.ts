import { z } from "zod"

export const updateSettingsSchema = z.object({
  emailVerificationEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
  emailOtpEnabled: z.boolean(),
})

export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>
