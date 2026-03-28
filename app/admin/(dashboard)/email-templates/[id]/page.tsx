import { notFound, redirect } from "next/navigation"
import { getTemplateById } from "@/modules/email-templates/queries"
import { features } from "@/config/features.config"
import { TemplateEditor } from "../template-editor"
import type { EmailTemplate } from "@/modules/email-templates/types"

interface EditTemplatePageProps {
  params: { id: string }
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  if (!features.emailTemplates) {
    redirect("/admin/dashboard")
  }

  const template = await getTemplateById(params.id)
  if (!template) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Edit Template: {template.name}
        </h2>
        <p className="text-muted-foreground">
          Modify the template content and settings
        </p>
      </div>

      <TemplateEditor template={template as EmailTemplate} />
    </div>
  )
}
