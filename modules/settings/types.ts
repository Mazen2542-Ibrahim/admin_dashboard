export type AppSettings = {
  id: string
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type UpdateSettingsInput = {
  emailVerificationEnabled: boolean
  registrationEnabled: boolean
  emailOtpEnabled: boolean
}
