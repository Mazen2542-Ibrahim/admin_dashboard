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

// Cached transporter — reused across calls for 5 minutes to avoid
// re-querying the DB, re-decrypting credentials, and re-handshaking TCP.
let cached: {
  transporter: nodemailer.Transporter
  fromName: string
  fromEmail: string
  expiry: number
} | null = null

async function getTransporter() {
  if (cached && Date.now() < cached.expiry) return cached

  const [config] = await db
    .select()
    .from(smtpSettings)
    .where(eq(smtpSettings.isActive, true))
    .limit(1)

  if (!config) {
    throw new Error("No active SMTP configuration found. Configure SMTP settings first.")
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: decrypt(config.encryptedPassword),
    },
    pool: true,
  })

  cached = {
    transporter,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    expiry: Date.now() + 5 * 60 * 1000,
  }

  return cached
}

/**
 * Sends an email using the active SMTP configuration stored in the database.
 * Config and transporter are cached for 5 minutes to avoid repeated DB hits.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { transporter, fromName, fromEmail } = await getTransporter()

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}
