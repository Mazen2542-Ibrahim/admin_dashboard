import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { smtpSettings } from "@/db/schema"
import { decrypt } from "@/lib/encryption"
import { eq } from "drizzle-orm"

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Sends an email using the active SMTP configuration stored in the database.
 * Fetches settings, decrypts credentials, and delegates to nodemailer.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const [config] = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.isActive, true))
    .limit(1)

  if (!config) {
    throw new Error("No active SMTP configuration found. Configure SMTP settings first.")
  }

  const password = decrypt(config.encryptedPassword)

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: password,
    },
  })

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}
