export type AppSettings = {
  id: string
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  auditLogRetentionDays: number | null
  createdAt: Date
  updatedAt: Date
}

export type UpdateSettingsInput = {
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  auditLogRetentionDays: number | null
}
