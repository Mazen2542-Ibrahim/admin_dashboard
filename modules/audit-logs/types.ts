export interface AuditLog {
  id: string
  actorId: string | null
  actorEmail: string | null
  action: string
  resourceType: string
  resourceId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  description: string | null
  createdAt: Date
}

export interface LogAuditInput {
  actorId?: string
  actorEmail?: string
  action: string
  resourceType: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  description?: string
}

export interface AuditLogFilters {
  action?: string
  resourceType?: string
  actorId?: string
  actorEmail?: string
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}
