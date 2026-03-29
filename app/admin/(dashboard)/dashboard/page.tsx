import { getUserCount, getActiveUserCount } from "@/modules/users/queries"
import { getTemplateCount } from "@/modules/email-templates/queries"
import { getAuditLogs, getAuditLogCount } from "@/modules/audit-logs/queries"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { SmtpStatusBanner } from "@/components/dashboard/smtp-status-banner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, FileText, ScrollText } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

export default async function DashboardPage() {
  const [totalUsers, activeUsers, templateCount, auditEventCount, recentLogs, smtpSettings] =
    await Promise.all([
      getUserCount(),
      getActiveUserCount(),
      getTemplateCount(),
      getAuditLogCount(),
      getAuditLogs({ limit: 8 }),
      getActiveSmtpSettings(),
    ])

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered accounts",
      icon: Users,
    },
    {
      title: "Active Users",
      value: activeUsers,
      description: "Currently active",
      icon: UserCheck,
    },
    {
      title: "Email Templates",
      value: templateCount,
      description: "Configured templates",
      icon: FileText,
    },
    {
      title: "Audit Events",
      value: auditEventCount,
      description: "Total recorded events",
      icon: ScrollText,
    },
  ]

  return (
    <div className="space-y-6">
      <SmtpStatusBanner configured={!!smtpSettings} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No activity yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.resourceType}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.actorEmail ?? "System"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
