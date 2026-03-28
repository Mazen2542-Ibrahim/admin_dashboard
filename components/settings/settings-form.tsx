"use client"

import * as React from "react"
import { updateAppSettingsAction } from "@/modules/settings/actions"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { AppSettings } from "@/modules/settings/types"

interface SettingsFormProps {
  settings: AppSettings
  smtpConfigured: boolean
}

interface ToggleRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  requiresSmtp?: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, description, checked, disabled, requiresSmtp, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium leading-none">
            {label}
          </Label>
          {requiresSmtp && (
            <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">
              Requires SMTP
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  )
}

export function SettingsForm({ settings, smtpConfigured }: SettingsFormProps) {
  const [values, setValues] = React.useState({
    emailVerificationEnabled: settings.emailVerificationEnabled,
    registrationEnabled: settings.registrationEnabled,
    emailOtpEnabled: settings.emailOtpEnabled,
    auditLogRetentionDays: settings.auditLogRetentionDays,
  })
  const [saving, setSaving] = React.useState(false)

  async function handleChange(key: keyof typeof values, newValue: boolean) {
    const updated = { ...values, [key]: newValue }
    setValues(updated)
    setSaving(true)

    const result = await updateAppSettingsAction(updated)
    setSaving(false)

    if (result.error) {
      // Revert on error
      setValues(values)
      toast({
        title: "Failed to save",
        description:
          result.error && "message" in result.error
            ? (result.error as { message: string }).message
            : "Could not update settings.",
        variant: "destructive",
      })
    } else {
      toast({ title: "Settings saved" })
    }
  }

  return (
    <div className="divide-y">
      <ToggleRow
        id="emailVerificationEnabled"
        label="Email Verification"
        description="Require users to verify their email address before they can sign in."
        checked={values.emailVerificationEnabled}
        disabled={saving || !smtpConfigured}
        requiresSmtp={!smtpConfigured}
        onChange={(v) => handleChange("emailVerificationEnabled", v)}
      />
      <ToggleRow
        id="registrationEnabled"
        label="User Registration"
        description="Allow new users to create accounts. Disable to close registration."
        checked={values.registrationEnabled}
        disabled={saving}
        onChange={(v) => handleChange("registrationEnabled", v)}
      />
      <ToggleRow
        id="emailOtpEnabled"
        label="OTP / Two-Factor Login"
        description="Send a one-time code via email as a second factor during sign in."
        checked={values.emailOtpEnabled}
        disabled={saving || !smtpConfigured}
        requiresSmtp={!smtpConfigured}
        onChange={(v) => handleChange("emailOtpEnabled", v)}
      />
    </div>
  )
}
