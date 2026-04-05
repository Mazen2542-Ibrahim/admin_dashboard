import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core"

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
  description: text("description"),
  // append-only — no updatedAt
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  createdAtIdx:    index("audit_logs_created_at_idx").on(t.createdAt),
  actorIdIdx:      index("audit_logs_actor_id_idx").on(t.actorId),
  actionIdx:       index("audit_logs_action_idx").on(t.action),
  resourceTypeIdx: index("audit_logs_resource_type_idx").on(t.resourceType),
}))
