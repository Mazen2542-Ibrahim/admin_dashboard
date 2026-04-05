import { db } from "@/lib/db"
import { auditLogs } from "@/db/schema"
import type { LogAuditInput } from "./types"
import { deleteAuditLogsOlderThan } from "./queries"

export async function purgeAuditLogs(
  retentionDays: number,
  actorId?: string,
  actorEmail?: string
): Promise<{ deletedCount: number; cutoffDate: Date }> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const deletedCount = await deleteAuditLogsOlderThan(cutoffDate)

  await logAudit({
    actorId,
    actorEmail,
    action: "audit_logs.purged",
    resourceType: "audit_logs",
    metadata: { retentionDays, cutoffDate: cutoffDate.toISOString(), deletedCount },
  })

  return { deletedCount, cutoffDate }
}

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
      description: input.description ?? null,
    })
  } catch (err) {
    console.error("[audit-logs] Failed to write audit log:", err)
  }
}
