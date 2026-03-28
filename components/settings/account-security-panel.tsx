"use client"

import * as React from "react"
import { updateAppSettingsAction } from "@/modules/settings/actions"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AppSettings } from "@/modules/settings/types"

const MAX_ATTEMPTS_OPTIONS = [
  { label: "3 attempts", value: "3" },
  { label: "5 attempts", value: "5" },
  { label: "10 attempts", value: "10" },
  { label: "20 attempts", value: "20" },
]

const LOCKOUT_DURATION_OPTIONS = [
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "24 hours", value: "1440" },
]

interface AccountSecurityPanelProps {
  settings: AppSettings
}

export function AccountSecurityPanel({ settings }: AccountSecurityPanelProps) {
  const [lockoutEnabled, setLockoutEnabled] = React.useState(settings.lockoutEnabled)
  const [maxFailedAttempts, setMaxFailedAttempts] = React.useState(settings.maxFailedAttempts)
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = React.useState(settings.lockoutDurationMinutes)
  const [saving, setSaving] = React.useState(false)

  async function save(patch: Partial<{ lockoutEnabled: boolean; maxFailedAttempts: number; lockoutDurationMinutes: number }>) {
    const next = {
      lockoutEnabled,
      maxFailedAttempts,
      lockoutDurationMinutes,
      ...patch,
    }

    setSaving(true)
    const result = await updateAppSettingsAction({
      emailVerificationEnabled: settings.emailVerificationEnabled,
      registrationEnabled: settings.registrationEnabled,
      emailOtpEnabled: settings.emailOtpEnabled,
      auditLogRetentionDays: settings.auditLogRetentionDays,
      ...next,
    })
    setSaving(false)

    if (result.error) {
      // revert
      setLockoutEnabled(lockoutEnabled)
      setMaxFailedAttempts(maxFailedAttempts)
      setLockoutDurationMinutes(lockoutDurationMinutes)
      toast({
        title: "Failed to save",
        description:
          result.error && "message" in result.error
            ? (result.error as { message: string }).message
            : "Could not update lockout settings.",
        variant: "destructive",
      })
    } else {
      toast({ title: "Account security settings saved" })
    }
  }

  function handleToggle(checked: boolean) {
    setLockoutEnabled(checked)
    save({ lockoutEnabled: checked })
  }

  function handleMaxAttempts(value: string) {
    const n = parseInt(value, 10)
    setMaxFailedAttempts(n)
    save({ maxFailedAttempts: n })
  }

  function handleDuration(value: string) {
    const n = parseInt(value, 10)
    setLockoutDurationMinutes(n)
    save({ lockoutDurationMinutes: n })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="lockout-toggle" className="text-sm font-medium">
            Enable Account Lockout
          </Label>
          <p className="text-sm text-muted-foreground">
            Temporarily lock accounts after too many failed login attempts.
          </p>
        </div>
        <Switch
          id="lockout-toggle"
          checked={lockoutEnabled}
          onCheckedChange={handleToggle}
          disabled={saving}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8 border-t pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
          <div className="space-y-1">
            <Label htmlFor="max-attempts-select" className="text-sm font-medium">
              Max failed attempts
            </Label>
            <p className="text-sm text-muted-foreground">
              Lock after this many consecutive failures.
            </p>
          </div>
          <Select
            value={String(maxFailedAttempts)}
            onValueChange={handleMaxAttempts}
            disabled={!lockoutEnabled || saving}
          >
            <SelectTrigger id="max-attempts-select" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAX_ATTEMPTS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between flex-1">
          <div className="space-y-1">
            <Label htmlFor="lockout-duration-select" className="text-sm font-medium">
              Lockout duration
            </Label>
            <p className="text-sm text-muted-foreground">
              How long accounts remain locked.
            </p>
          </div>
          <Select
            value={String(lockoutDurationMinutes)}
            onValueChange={handleDuration}
            disabled={!lockoutEnabled || saving}
          >
            <SelectTrigger id="lockout-duration-select" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCKOUT_DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
