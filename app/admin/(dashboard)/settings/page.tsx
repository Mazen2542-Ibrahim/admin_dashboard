import { getAppSettings } from "@/modules/settings/queries"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { SettingsForm } from "@/components/settings/settings-form"
import { AuditLogRetentionPanel } from "@/components/settings/audit-log-retention-panel"
import { AccountSecurityPanel } from "@/components/settings/account-security-panel"
import { LocationRestrictionsPanel } from "@/components/settings/location-restrictions-panel"
import { BrandingPanel } from "./_components/branding-panel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  const [settings, smtpSettings] = await Promise.all([
    getAppSettings(),
    getActiveSmtpSettings(),
  ])

  const smtpConfigured = !!smtpSettings

  const defaultSettings = settings ?? {
    id: "",
    emailVerificationEnabled: false,
    registrationEnabled: true,
    emailOtpEnabled: false,
    auditLogRetentionDays: null,
    lockoutEnabled: false,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 60,
    requireLocationForAuth: false,
    allowedCountries: [] as string[],
    siteLogoUrl: null,
    siteFaviconUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage authentication and registration options.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Upload a logo and favicon to customise your site&apos;s appearance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingPanel
            siteLogoUrl={defaultSettings.siteLogoUrl}
            siteFaviconUrl={defaultSettings.siteFaviconUrl}
          />
        </CardContent>
      </Card>

      {!smtpConfigured && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>SMTP not configured.</strong> Email-dependent features (verification and OTP) are disabled.{" "}
            <Link href="/admin/smtp" className="font-medium underline hover:no-underline">
              Configure SMTP
            </Link>{" "}
            to enable them.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Control how users sign in and register. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={defaultSettings} smtpConfigured={smtpConfigured} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Retention</CardTitle>
          <CardDescription>
            Configure how long audit logs are kept and manually purge expired entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogRetentionPanel settings={defaultSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Protect accounts against brute-force login attempts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSecurityPanel settings={defaultSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location Restrictions</CardTitle>
          <CardDescription>
            Restrict authentication to users in specific geographic locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationRestrictionsPanel settings={defaultSettings} />
        </CardContent>
      </Card>
    </div>
  )
}
