"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/modules/email-templates/actions"
import { createTemplateSchema } from "@/modules/email-templates/schema"
import { Loader2, X, Plus } from "lucide-react"
import type { EmailTemplate } from "@/modules/email-templates/types"
import { z } from "zod"

type FormValues = z.infer<typeof createTemplateSchema>

interface TemplateEditorProps {
  template?: EmailTemplate | null
}

export function TemplateEditor({ template }: TemplateEditorProps) {
  const router = useRouter()
  const isEditing = !!template
  const [newVariable, setNewVariable] = React.useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      htmlBody: template?.htmlBody ?? "<p>Hello {{name}},</p>\n<p></p>",
      textBody: template?.textBody ?? "",
      variables: template?.variables ?? [],
      isActive: template?.isActive ?? true,
    },
  })

  const variables = form.watch("variables") ?? []
  const htmlBody = form.watch("htmlBody")

  function addVariable() {
    const v = newVariable.trim().replace(/\s+/g, "_")
    if (!v || variables.includes(v)) return
    form.setValue("variables", [...variables, v])
    setNewVariable("")
  }

  function removeVariable(v: string) {
    form.setValue("variables", variables.filter((x) => x !== v))
  }

  async function onSubmit(values: FormValues) {
    let result
    if (isEditing && template) {
      result = await updateTemplateAction(template.id, values)
    } else {
      result = await createTemplateAction(values)
    }

    if ("error" in result && result.error) {
      const msg =
        typeof result.error === "object" && "message" in result.error
          ? result.error.message
          : "An error occurred"
      toast({ title: "Error", description: String(msg), variant: "destructive" })
      return
    }

    toast({ title: isEditing ? "Template updated" : "Template created" })
    router.push("/admin/email-templates")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name (slug)</Label>
              <Input
                id="name"
                placeholder="e.g. welcome-email"
                {...form.register("name")}
                disabled={isEditing}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Welcome to {{appName}}!"
                {...form.register("subject")}
              />
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <Label>Variables</Label>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <Badge key={v} variant="secondary" className="gap-1">
                  <span className="font-mono">{`{{${v}}}`}</span>
                  <button
                    type="button"
                    onClick={() => removeVariable(v)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="variable_name"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="icon" onClick={addVariable}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs defaultValue="html">
        <TabsList>
          <TabsTrigger value="html">HTML Body</TabsTrigger>
          <TabsTrigger value="text">Text Body</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <Card>
            <CardContent className="pt-4">
              <Textarea
                className="min-h-[300px] font-mono text-xs"
                placeholder="<p>Hello {{name}},</p>"
                {...form.register("htmlBody")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card>
            <CardDescription className="px-6 pt-4 text-sm">
              Plain text fallback for email clients that don&apos;t render HTML.
            </CardDescription>
            <CardContent className="pt-2">
              <Textarea
                className="min-h-[200px] font-mono text-xs"
                placeholder="Hello {{name}}, ..."
                {...form.register("textBody")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardDescription>
                Preview with placeholder values for variables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none rounded-md border p-4"
                dangerouslySetInnerHTML={{
                  __html: htmlBody?.replace(
                    /\{\{(\w+)\}\}/g,
                    (_, key) => `<mark class="bg-yellow-100">${key}</mark>`
                  ) ?? "",
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? "Update Template" : "Create Template"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/email-templates")}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
