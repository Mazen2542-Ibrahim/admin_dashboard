"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, truncate } from "@/lib/utils"
import type { AuditLog } from "@/modules/audit-logs/types"

function getBadgeVariant(action: string): "destructive" | "success" | "warning" | "outline" {
  if (
    ["user.login_failed", "user.deactivated", "user.hard_deleted", "user.deleted",
      "user.account_locked", "audit_logs.purged"].includes(action)
  ) return "destructive"
  if (
    ["user.signed_in", "user.registered", "user.created",
      "user.account_unlocked", "role.created"].includes(action)
  ) return "success"
  if (
    ["user.sessions_revoked_all", "user.session_revoked",
      "user.password_reset_requested", "user.email_change_requested"].includes(action)
  ) return "warning"
  return "outline"
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "—"
  if (/Edg\//.test(ua))                             return "Edge"
  if (/OPR\/|Opera/.test(ua))                       return "Opera"
  if (/Firefox\//.test(ua))                         return "Firefox"
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua))  return "Chrome"
  if (/Safari\//.test(ua))                          return "Safari"
  return "Other"
}

interface AuditLogTableProps {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Device</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
              No audit logs found
            </TableCell>
          </TableRow>
        ) : (
          logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                onClick={() => setExpandedId(log.id === expandedId ? null : log.id)}
                className="cursor-pointer"
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(log.action)} className="font-mono text-xs">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {truncate(log.description ?? "—", 48)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {log.resourceType}
                </TableCell>
                <TableCell className="text-sm">
                  {log.actorEmail ?? <span className="text-muted-foreground">System</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.ipAddress ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {parseBrowser(log.userAgent)}
                </TableCell>
              </TableRow>
              {expandedId === log.id && (
                <TableRow key={`${log.id}-expanded`}>
                  <TableCell colSpan={7} className="bg-muted/50 px-4 py-3 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Description: </span>
                        {log.description ?? "—"}
                      </div>
                      <div>
                        <span className="font-medium">Resource ID: </span>
                        <span className="font-mono text-xs">{log.resourceId ?? "—"}</span>
                      </div>
                      {log.metadata && (
                        <div>
                          <span className="font-medium">Metadata:</span>
                          <pre className="mt-1 text-xs overflow-auto rounded bg-muted p-2">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.userAgent && (
                        <div>
                          <span className="font-medium">User Agent: </span>
                          <span className="font-mono text-xs break-all">{log.userAgent}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))
        )}
      </TableBody>
    </Table>
  )
}
