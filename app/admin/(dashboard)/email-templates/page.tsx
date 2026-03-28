import { redirect } from "next/navigation"
import { getAllTemplates } from "@/modules/email-templates/queries"
import { TemplatesList } from "./templates-list"
import { features } from "@/config/features.config"

export default async function EmailTemplatesPage() {
  if (!features.emailTemplates) {
    redirect("/admin/dashboard")
  }

  const templates = await getAllTemplates()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
        <p className="text-muted-foreground">
          Manage reusable email templates with dynamic variables
        </p>
      </div>

      <TemplatesList templates={templates} />
    </div>
  )
}
