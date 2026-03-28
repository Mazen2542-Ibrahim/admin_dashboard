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
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, RefreshCw } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { getUserSessionsAction, revokeUserSessionAction, revokeAllUserSessionsAction } from "@/modules/users/actions"
import type { UserSession } from "@/modules/users/types"

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown"
  if (/mobile/i.test(userAgent)) return "Mobile"
  if (/edg/i.test(userAgent)) return "Edge"
  if (/chrome/i.test(userAgent)) return "Chrome"
  if (/firefox/i.test(userAgent)) return "Firefox"
  if (/safari/i.test(userAgent)) return "Safari"
  return "Browser"
}

interface UserSessionsTabProps {
  userId: string
  currentSessionId?: string
  isSelf: boolean
}

export function UserSessionsTab({ userId, currentSessionId, isSelf }: UserSessionsTabProps) {
  const [sessions, setSessions] = React.useState<UserSession[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [revokingId, setRevokingId] = React.useState<string | null>(null)
  const [revokeAllOpen, setRevokeAllOpen] = React.useState(false)
  const [isRevokingAll, setIsRevokingAll] = React.useState(false)

  React.useEffect(() => {
    setIsLoading(true)
    getUserSessionsAction(userId).then((result) => {
      if ("data" in result && result.data) {
        setSessions(result.data as UserSession[])
      }
      setIsLoading(false)
    })
  }, [userId, refreshKey])

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId)
    const result = await revokeUserSessionAction(sessionId, userId)
    setRevokingId(null)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to revoke session",
        variant: "destructive",
      })
    } else {
      toast({ title: "Session revoked" })
      setRefreshKey((k) => k + 1)
    }
  }

  async function handleRevokeAll() {
    setIsRevokingAll(true)
    const result = await revokeAllUserSessionsAction(userId)
    setIsRevokingAll(false)
    setRevokeAllOpen(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to revoke sessions",
        variant: "destructive",
      })
    } else {
      toast({ title: "All sessions revoked" })
      setRefreshKey((k) => k + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Active Sessions</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => setRevokeAllOpen(true)}
            disabled={sessions.length === 0}
          >
            Revoke All Sessions
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No active sessions.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => {
              const isCurrent = isSelf && s.id === currentSessionId
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{parseDevice(s.userAgent)}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(s.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(s.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isCurrent || revokingId === s.id}
                      onClick={() => handleRevoke(s.id)}
                    >
                      {revokingId === s.id && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={(open) => !open && setRevokeAllOpen(false)}
        title="Revoke All Sessions"
        description="This will immediately log the user out of all devices."
        confirmLabel="Revoke All"
        onConfirm={handleRevokeAll}
        isLoading={isRevokingAll}
      />
    </div>
  )
}
