export type AppSettings = {
  id: string
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  auditLogRetentionDays: number | null
  lockoutEnabled: boolean
  maxFailedAttempts: number
  lockoutDurationMinutes: number
  requireLocationForAuth: boolean
  allowedCountries: string[]
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

export type UpdateLocationSettingsInput = {
  requireLocationForAuth: boolean
  allowedCountries: string[]
}
