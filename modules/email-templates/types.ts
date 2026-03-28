export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody: string | null
  variables: string[] | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateEmailTemplateInput = {
  name: string
  subject: string
  htmlBody: string
  textBody?: string
  variables?: string[]
  isActive?: boolean
}

export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>

export interface SendTemplateEmailInput {
  templateId: string
  toEmail: string
  variables?: Record<string, string>
}
