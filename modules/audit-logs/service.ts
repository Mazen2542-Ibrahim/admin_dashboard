import { db } from "@/lib/db"
import { auditLogs } from "@/db/schema"
import type { LogAuditInput } from "./types"

/**
 * Appends an audit log entry.
 * Never throws — audit failures must not break the primary operation.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    })
  } catch (err) {
    console.error("[audit-logs] Failed to write audit log:", err)
  }
}
