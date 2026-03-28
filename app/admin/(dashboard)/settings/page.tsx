import { getAppSettings } from "@/modules/settings/queries"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { SettingsForm } from "@/components/settings/settings-form"
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

      {!smtpConfigured && (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800 [&>svg]:text-amber-600">
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
    </div>
  )
}
