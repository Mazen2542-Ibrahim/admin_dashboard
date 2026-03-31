import { pgTable, uuid, text, boolean, timestamp, integer, real, index } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginCountry: text("last_login_country"),
  lastLoginLatitude: real("last_login_latitude"),
  lastLoginLongitude: real("last_login_longitude"),
  themePreference: text("theme_preference").notNull().default("system"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
}, (t) => ({
  roleIdx:        index("users_role_idx").on(t.role),
  isActiveIdx:    index("users_is_active_idx").on(t.isActive),
  lockedUntilIdx: index("users_locked_until_idx").on(t.lockedUntil),
  createdAtIdx:   index("users_created_at_idx").on(t.createdAt),
}))
