import { redirect } from "next/navigation"
import Link from "next/link"
import { getAuditLogs, getAuditLogCount } from "@/modules/audit-logs/queries"
import { features } from "@/config/features.config"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuditLogFilters } from "./audit-log-filters"
import { AuditLogTable } from "./audit-log-table"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AuditLogsPageProps {
  searchParams: {
    page?: string
    actorEmail?: string
    resourceType?: string
    action?: string
    dateFrom?: string
    dateTo?: string
  }
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  if (!features.auditLogs) {
    redirect("/admin/dashboard")
  }

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const pageSize = 25
  const filters = {
    page,
    limit: pageSize,
    actorEmail: searchParams.actorEmail,
    resourceType: searchParams.resourceType,
    action: searchParams.action,
    dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
    dateTo:   searchParams.dateTo   ? new Date(searchParams.dateTo)   : undefined,
  }

  const [logs, total] = await Promise.all([
    getAuditLogs(filters),
    getAuditLogCount(filters),
  ])

  function buildPageUrl(targetPage: number) {
    return (
      `/admin/audit-logs?page=${targetPage}` +
      (searchParams.actorEmail   ? `&actorEmail=${encodeURIComponent(searchParams.actorEmail)}`     : "") +
      (searchParams.resourceType ? `&resourceType=${searchParams.resourceType}`                     : "") +
      (searchParams.action       ? `&action=${encodeURIComponent(searchParams.action)}`             : "") +
      (searchParams.dateFrom     ? `&dateFrom=${encodeURIComponent(searchParams.dateFrom)}`         : "") +
      (searchParams.dateTo       ? `&dateTo=${encodeURIComponent(searchParams.dateTo)}`             : "")
    )
  }

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>{total} total events</CardDescription>
            </div>
            <AuditLogFilters
              actorEmail={searchParams.actorEmail}
              resourceType={searchParams.resourceType}
              action={searchParams.action}
              dateFrom={searchParams.dateFrom}
              dateTo={searchParams.dateTo}
              page={page}
            />
          </div>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} />
        </CardContent>
        {total > pageSize && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.ceil(total / pageSize)} ({total} total)
            </p>
            <div className="flex items-center gap-2">
              {page <= 1 ? (
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" asChild>
                  <Link href={buildPageUrl(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {page >= Math.ceil(total / pageSize) ? (
                <Button variant="outline" size="icon" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" size="icon" asChild>
                  <Link href={buildPageUrl(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
