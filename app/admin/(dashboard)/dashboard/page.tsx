import Link from "next/link"
import { getUserCount, getActiveUserCount, getNewUserCount, getLockedUserCount } from "@/modules/users/queries"
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
import { Users, UserCheck, UserPlus, LockKeyhole, ScrollText, TrendingUp, ArrowRight } from "lucide-react"
import { formatDateTime, cn } from "@/lib/utils"

// ── Action label map ──────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  "user.created": "User created",
  "user.updated": "User updated",
  "user.deleted": "User deactivated",
  "user.hard_deleted": "User deleted",
  "user.signed_in": "Signed in",
  "user.registered": "User registered",
  "user.password_changed": "Password changed",
  "user.password_reset_email_sent": "Password reset sent",
  "user.verification_email_sent_by_admin": "Verification email sent",
  "user.email_change_requested": "Email change requested",
  "user.sessions_revoked_all": "All sessions revoked",
  "user.session_revoked": "Session revoked",
  "user.account_unlocked": "Account unlocked",
  "user.email_verified_by_admin": "Email verified by admin",
  "role.created": "Role created",
  "role.updated": "Role updated",
  "role.deleted": "Role deleted",
  "smtp.updated": "SMTP updated",
  "email_template.created": "Template created",
  "email_template.updated": "Template updated",
  "email_template.deleted": "Template deleted",
  "settings.updated": "Settings updated",
  "audit_log.purged": "Audit logs purged",
}

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    newUsersToday,
    lockedUsers,
    auditEventCount,
    auditEventsToday,
    recentLogs,
    smtpSettings,
  ] = await Promise.all([
    getUserCount(),
    getActiveUserCount(),
    getNewUserCount(sevenDaysAgo),
    getNewUserCount(today),
    getLockedUserCount(),
    getAuditLogCount(),
    getAuditLogCount({ dateFrom: today }),
    getAuditLogs({ limit: 8 }),
    getActiveSmtpSettings(),
  ])

  const inactiveUsers = totalUsers - activeUsers

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      description: `${activeUsers} enabled${inactiveUsers > 0 ? ` · ${inactiveUsers} disabled` : ""}`,
      icon: Users,
      href: "/admin/users",
      trend: newUsersThisWeek > 0 ? `+${newUsersThisWeek} this week` : null,
    },
    {
      title: "Enabled Users",
      value: activeUsers,
      description: "Accounts with access",
      icon: UserCheck,
      href: "/admin/users?status=active",
      trend: null,
    },
    {
      title: "New Registrations",
      value: newUsersThisWeek,
      description: "New accounts this week",
      icon: UserPlus,
      href: "/admin/users",
      trend: newUsersToday > 0 ? `+${newUsersToday} today` : null,
    },
    {
      title: "Locked Accounts",
      value: lockedUsers,
      description: "Accounts currently locked",
      icon: LockKeyhole,
      href: "/admin/users",
      trend: null,
    },
    {
      title: "Audit Events",
      value: auditEventCount,
      description: "Total recorded events",
      icon: ScrollText,
      href: "/admin/audit-logs",
      trend: auditEventsToday > 0 ? `+${auditEventsToday} today` : null,
    },
  ]

  return (
    <div className="space-y-6">
      <SmtpStatusBanner configured={!!smtpSettings} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          System overview and recent activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <p className="text-xs text-muted-foreground truncate">{stat.description}</p>
                    {stat.trend && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </div>
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>
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
                      <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm capitalize">
                      {log.resourceType.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.actorEmail ?? <span className="italic">System</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
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
