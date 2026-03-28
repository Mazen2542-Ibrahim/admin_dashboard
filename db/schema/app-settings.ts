import { pgTable, uuid, boolean, timestamp, integer } from "drizzle-orm/pg-core"

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailVerificationEnabled: boolean("email_verification_enabled").notNull().default(false),
  registrationEnabled: boolean("registration_enabled").notNull().default(true),
  emailOtpEnabled: boolean("email_otp_enabled").notNull().default(false),
  auditLogRetentionDays: integer("audit_log_retention_days"),
  lockoutEnabled: boolean("lockout_enabled").notNull().default(false),
  maxFailedAttempts: integer("max_failed_attempts").notNull().default(5),
  lockoutDurationMinutes: integer("lockout_duration_minutes").notNull().default(60),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
})
