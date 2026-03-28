import { pgTable, uuid, boolean, timestamp } from "drizzle-orm/pg-core"

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailVerificationEnabled: boolean("email_verification_enabled").notNull().default(false),
  registrationEnabled: boolean("registration_enabled").notNull().default(true),
  emailOtpEnabled: boolean("email_otp_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
})
