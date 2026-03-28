import { pgTable, uuid, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"
import { roles } from "./roles"

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    roleResourceActionIdx: uniqueIndex("permissions_role_resource_action_idx").on(
      table.roleId,
      table.resource,
      table.action
    ),
  })
)
