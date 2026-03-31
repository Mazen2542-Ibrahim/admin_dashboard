import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core"
import { users } from "./users"

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
}, (t) => ({
  userIdIdx:    index("sessions_user_id_idx").on(t.userId),
  expiresAtIdx: index("sessions_expires_at_idx").on(t.expiresAt),
}))
