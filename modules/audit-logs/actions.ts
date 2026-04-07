"use server"

import { requirePermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getActionErrorMessage } from "@/lib/action-error"
import { auditLogFilterSchema } from "./schema"
import { getAuditLogs, getAuditLogCount } from "./queries"
import { purgeAuditLogs } from "./service"

export async function purgeAuditLogsAction() {
  try {
    const session = await requirePermission("settings:update")
    const actor = session.user as { id: string; email: string }

    const { getAppSettings } = await import("@/modules/settings/queries")
    const settings = await getAppSettings()

    if (!settings?.auditLogRetentionDays) {
      return { error: { message: "No retention period configured. Set a retention period before purging." } }
    }

    const { deletedCount, cutoffDate } = await purgeAuditLogs(
      settings.auditLogRetentionDays,
      actor.id,
      actor.email
    )

    revalidatePath("/admin/audit-logs")
    revalidatePath("/admin/settings")

    return { success: true, deletedCount, cutoffDate }
  } catch (err) {
    return { error: { message: getActionErrorMessage(err) } }
  }
}

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
    return { error: { message: getActionErrorMessage(err) } }
  }
}
