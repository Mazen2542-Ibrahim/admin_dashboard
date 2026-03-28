import { redirect } from "next/navigation"
import Link from "next/link"
import { getAuditLogs, getAuditLogCount } from "@/modules/audit-logs/queries"
import { features } from "@/config/features.config"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime, truncate } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AuditLogsPageProps {
  searchParams: {
    page?: string
    action?: string
    resourceType?: string
  }
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  if (!features.auditLogs) {
    redirect("/admin/dashboard")
  }

  const page = parseInt(searchParams.page ?? "1", 10)
  const pageSize = 25
  const filters = {
    page,
    limit: pageSize,
    action: searchParams.action,
    resourceType: searchParams.resourceType,
  }

  const [logs, total] = await Promise.all([
    getAuditLogs(filters),
    getAuditLogCount(filters),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">
          System-wide activity log — all operations are recorded
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>{total} total events</CardDescription>
        </CardHeader>
        <CardContent>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.resourceType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.actorEmail ?? (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.resourceId ? truncate(log.resourceId, 12) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {total > pageSize && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)} ({total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                asChild
                disabled={page <= 1}
              >
                <Link href={`/admin/audit-logs?page=${page - 1}${searchParams.action ? `&action=${searchParams.action}` : ""}${searchParams.resourceType ? `&resourceType=${searchParams.resourceType}` : ""}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                disabled={page >= Math.ceil(total / pageSize)}
              >
                <Link href={`/admin/audit-logs?page=${page + 1}${searchParams.action ? `&action=${searchParams.action}` : ""}${searchParams.resourceType ? `&resourceType=${searchParams.resourceType}` : ""}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
