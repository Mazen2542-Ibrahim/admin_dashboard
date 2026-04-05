import { pgTable, uuid, boolean, timestamp, integer, text } from "drizzle-orm/pg-core"

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailVerificationEnabled: boolean("email_verification_enabled").notNull().default(false),
  registrationEnabled: boolean("registration_enabled").notNull().default(true),
  emailOtpEnabled: boolean("email_otp_enabled").notNull().default(false),
  auditLogRetentionDays: integer("audit_log_retention_days"),
  lockoutEnabled: boolean("lockout_enabled").notNull().default(false),
  maxFailedAttempts: integer("max_failed_attempts").notNull().default(5),
  lockoutDurationMinutes: integer("lockout_duration_minutes").notNull().default(60),
  requireLocationForAuth: boolean("require_location_for_auth").notNull().default(false),
  allowedCountries: text("allowed_countries").array().notNull().default([]),
  siteLogoUrl: text("site_logo_url"),
  siteFaviconUrl: text("site_favicon_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
})
