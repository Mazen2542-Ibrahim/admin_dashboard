export interface SmtpSettings {
  id: string
  host: string
  port: number
  username: string
  fromName: string
  fromEmail: string
  secure: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Note: encryptedPassword is never exposed in this type
}

export interface SmtpSettingsInput {
  host: string
  port: number
  username: string
  password: string // plaintext — encrypted before storage
  fromName: string
  fromEmail: string
  secure: boolean
}

export interface TestSmtpInput {
  toEmail: string
}
