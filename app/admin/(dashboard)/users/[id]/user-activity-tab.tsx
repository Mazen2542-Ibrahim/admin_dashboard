"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { formatDateTime, truncate } from "@/lib/utils"
import { getAuditLogsAction } from "@/modules/audit-logs/actions"

interface AuditLogEntry {
  id: string
  action: string
  resourceType: string | null
  resourceId: string | null
  createdAt: Date
}

interface UserActivityTabProps {
  userId: string
}

export function UserActivityTab({ userId }: UserActivityTabProps) {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const limit = 20

  React.useEffect(() => {
    setIsLoading(true)
    getAuditLogsAction({ actorId: userId, page, limit }).then((result) => {
      if ("data" in result && result.data) {
        setLogs(result.data.logs as AuditLogEntry[])
        setTotal(result.data.total)
      }
      setIsLoading(false)
    })
  }, [userId, page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Activity Log</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading activity...
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No activity found.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource Type</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.resourceType ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {log.resourceId ? truncate(log.resourceId, 12) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
