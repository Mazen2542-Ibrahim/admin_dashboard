import { redirect } from "next/navigation"
import { features } from "@/config/features.config"
import { TemplateEditor } from "../template-editor"

export default function NewTemplatePage() {
  if (!features.emailTemplates) {
    redirect("/admin/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Template</h2>
        <p className="text-muted-foreground">
          Create a new reusable email template
        </p>
      </div>

      <TemplateEditor />
    </div>
  )
}
