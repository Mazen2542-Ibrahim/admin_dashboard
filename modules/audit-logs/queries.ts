import { db } from "@/lib/db"
import { auditLogs } from "@/db/schema"
import { eq, and, gte, lte, desc, count } from "drizzle-orm"
import type { AuditLogFilters } from "./types"

function buildWhereClause(filters: AuditLogFilters) {
  const conditions = []
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action))
  if (filters.resourceType) conditions.push(eq(auditLogs.resourceType, filters.resourceType))
  if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId))
  if (filters.dateFrom) conditions.push(gte(auditLogs.createdAt, filters.dateFrom))
  if (filters.dateTo) conditions.push(lte(auditLogs.createdAt, filters.dateTo))
  return conditions.length > 0 ? and(...conditions) : undefined
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const { page = 1, limit = 20 } = filters
  const offset = (Math.max(1, page) - 1) * limit
  const where = buildWhereClause(filters)

  return db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
}

export async function getAuditLogById(id: string) {
  const [log] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.id, id))
    .limit(1)
  return log ?? null
}

export async function getAuditLogCount(filters: AuditLogFilters = {}) {
  const where = buildWhereClause(filters)
  const [result] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where)
  return result?.count ?? 0
}
