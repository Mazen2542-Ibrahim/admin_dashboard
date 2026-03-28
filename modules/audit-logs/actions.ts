"use server"

import { requirePermission } from "@/lib/auth"
import { auditLogFilterSchema } from "./schema"
import { getAuditLogs, getAuditLogCount } from "./queries"

export async function getAuditLogsAction(filters: unknown) {
  try {
    await requirePermission("audit_logs:read")

    const parsed = auditLogFilterSchema.safeParse(filters)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const [logs, total] = await Promise.all([
      getAuditLogs(parsed.data),
      getAuditLogCount(parsed.data),
    ])

    return { success: true, data: { logs, total } }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}
