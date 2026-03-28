import { z } from "zod"

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with hyphens (slug format)"),
  subject: z.string().min(1, "Subject is required"),
  htmlBody: z.string().min(10, "HTML body must be at least 10 characters"),
  textBody: z.string().optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
})

export const updateTemplateSchema = createTemplateSchema.partial()

export const templateIdSchema = z.string().uuid("Invalid template ID")

export const sendTemplateSchema = z.object({
  templateId: z.string().uuid(),
  toEmail: z.string().email("Must be a valid email address"),
  variables: z.record(z.string(), z.string()).optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type SendTemplateInput = z.infer<typeof sendTemplateSchema>
