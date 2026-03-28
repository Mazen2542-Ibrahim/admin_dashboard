export type AppSettings = {
  id: string
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  auditLogRetentionDays: number | null
  lockoutEnabled: boolean
  maxFailedAttempts: number
  lockoutDurationMinutes: number
  createdAt: Date
  updatedAt: Date
}

export type UpdateSettingsInput = {
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  auditLogRetentionDays: number | null
  lockoutEnabled: boolean
  maxFailedAttempts: number
  lockoutDurationMinutes: number
}
