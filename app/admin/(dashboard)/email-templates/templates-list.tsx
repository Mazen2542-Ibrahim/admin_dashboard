"use client"

import * as React from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { deleteTemplateAction } from "@/modules/email-templates/actions"
import { formatDate } from "@/lib/utils"
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react"

interface Template {
  id: string
  name: string
  subject: string
  variables: string[] | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplatesListProps {
  templates: Template[]
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const result = await deleteTemplateAction(deleteId)
    setIsLoading(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to delete template",
        variant: "destructive",
      })
    } else {
      toast({ title: "Template deleted" })
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? "s" : ""}
        </p>
        <Button asChild>
          <Link href="/admin/email-templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No templates yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-sm">
                    {template.name}
                  </TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables?.map((v) => (
                        <Badge
                          key={v}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "success" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(template.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/email-templates/${template.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Template"
        description="This will permanently delete the email template. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  )
}
