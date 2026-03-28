import { redirect } from "next/navigation"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { SmtpForm } from "./smtp-form"
import { features } from "@/config/features.config"

export default async function SmtpPage() {
  if (!features.smtp) {
    redirect("/admin/dashboard")
  }

  const settings = await getActiveSmtpSettings()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SMTP Settings</h2>
        <p className="text-muted-foreground">
          Configure your email server for sending notifications
        </p>
      </div>

      <SmtpForm settings={settings} />
    </div>
  )
}
