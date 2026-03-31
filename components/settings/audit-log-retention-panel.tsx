"use client"

import * as React from "react"
import { updateAppSettingsAction } from "@/modules/settings/actions"
import { purgeAuditLogsAction } from "@/modules/audit-logs/actions"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { AppSettings } from "@/modules/settings/types"

const RETENTION_OPTIONS = [
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
  { label: "180 days", value: "180" },
  { label: "365 days", value: "365" },
  { label: "Never", value: "never" },
]

interface AuditLogRetentionPanelProps {
  settings: AppSettings
}

export function AuditLogRetentionPanel({ settings }: AuditLogRetentionPanelProps) {
  const [retentionDays, setRetentionDays] = React.useState<number | null>(
    settings.auditLogRetentionDays
  )
  const [saving, setSaving] = React.useState(false)
  const [purging, setPurging] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  async function handleRetentionChange(value: string) {
    const days = value === "never" ? null : parseInt(value, 10)
    const previous = retentionDays
    setRetentionDays(days)
    setSaving(true)

    const result = await updateAppSettingsAction({
      emailVerificationEnabled: settings.emailVerificationEnabled,
      registrationEnabled: settings.registrationEnabled,
      emailOtpEnabled: settings.emailOtpEnabled,
      auditLogRetentionDays: days,
      lockoutEnabled: settings.lockoutEnabled,
      maxFailedAttempts: settings.maxFailedAttempts,
      lockoutDurationMinutes: settings.lockoutDurationMinutes,
    })

    setSaving(false)

    if (result.error) {
      setRetentionDays(previous)
      toast({
        title: "Failed to save",
        description:
          result.error && "message" in result.error
            ? (result.error as { message: string }).message
            : "Could not update retention setting.",
        variant: "destructive",
      })
    } else {
      toast({ title: "Retention period saved" })
    }
  }

  async function handlePurge() {
    setConfirmOpen(false)
    setPurging(true)

    const result = await purgeAuditLogsAction()
    setPurging(false)

    if (result.error) {
      toast({
        title: "Purge failed",
        description: result.error.message,
        variant: "destructive",
      })
    } else if (result.success) {
      const count = result.deletedCount ?? 0
      toast({
        title: "Purge complete",
        description:
          count === 1
            ? "1 log entry deleted."
            : `${count} log entries deleted.`,
      })
    }
  }

  const selectValue = retentionDays === null ? "never" : String(retentionDays)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor="retention-select" className="text-sm font-medium">
            Retention period
          </Label>
          <p className="text-sm text-muted-foreground">
            Audit log entries older than this will be eligible for purging.
          </p>
        </div>
        <Select
          value={selectValue}
          onValueChange={handleRetentionChange}
          disabled={saving}
        >
          <SelectTrigger id="retention-select" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RETENTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Purge expired entries</p>
          <p className="text-sm text-muted-foreground">
            Permanently delete all audit log entries older than the retention period.
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={retentionDays === null || purging}
          onClick={() => setConfirmOpen(true)}
        >
          {purging ? "Purging…" : "Purge Now"}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purge audit logs?</DialogTitle>
            <DialogDescription>
              This will permanently delete all audit log entries older than{" "}
              <strong>{retentionDays} days</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handlePurge}>
              Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
