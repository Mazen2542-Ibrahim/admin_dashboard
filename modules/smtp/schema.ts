import { z } from "zod"

export const smtpSettingsSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z
    .number()
    .int()
    .min(1, "Port must be between 1 and 65535")
    .max(65535, "Port must be between 1 and 65535"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("From email must be a valid email address"),
  secure: z.boolean().default(false),
})

export const testSmtpSchema = z.object({
  toEmail: z.string().email("Must be a valid email address"),
})

export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>
export type TestSmtpInput = z.infer<typeof testSmtpSchema>
