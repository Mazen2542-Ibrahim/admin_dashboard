import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core"

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // actorId has no FK — logs persist even after user deletion
  actorId: uuid("actor_id"),
  // denormalized for log retention after user deletion
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  // append-only — no updatedAt
  createdAt: timestamp("created_at").notNull().defaultNow(),
})
