import { logAudit } from "@/modules/audit-logs/service"
import { describeAction } from "@/lib/action-descriptions"
import { getIp } from "@/lib/rate-limit"
import type { LogAuditInput } from "@/modules/audit-logs/types"

type ActivityInput = Omit<LogAuditInput, "description">

/** Server Actions: auto-reads IP + UA from next/headers */
export async function logActivity(input: ActivityInput): Promise<void> {
  let ipAddress: string | undefined
  let userAgent: string | undefined
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    ipAddress = getIp(h)
    userAgent = h.get("user-agent")?.slice(0, 500) ?? undefined
  } catch { /* outside request context — skip */ }
  await logAudit({ ...input, ipAddress, userAgent, description: describeAction(input.action, input.metadata) })
}

/** API route handlers: caller passes req.headers */
export async function logActivityFromRequest(
  reqHeaders: { get(name: string): string | null },
  input: ActivityInput
): Promise<void> {
  const ipAddress = getIp(reqHeaders)
  const userAgent = reqHeaders.get("user-agent")?.slice(0, 500) ?? undefined
  await logAudit({ ...input, ipAddress, userAgent, description: describeAction(input.action, input.metadata) })
}
