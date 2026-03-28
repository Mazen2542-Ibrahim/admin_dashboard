"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { createRoleAction, updateRoleAction } from "@/modules/roles/actions"
import { createRoleSchema } from "@/modules/roles/schema"
import { Loader2 } from "lucide-react"
import type { RoleWithPermissions } from "@/modules/roles/types"
import { z } from "zod"

const RESOURCES = ["users", "roles", "smtp", "email_templates", "audit_logs", "settings"] as const
const ACTIONS = ["create", "read", "update", "delete"] as const
type Action = "access" | "create" | "read" | "update" | "delete"

type CreateFormValues = z.infer<typeof createRoleSchema>

interface RoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleWithPermissions | null
}

export function RoleModal({ open, onOpenChange, role }: RoleModalProps) {
  const isEditing = !!role
  const isSystem = role?.isSystem ?? false
  const isSuperAdmin = role?.name === "super_admin"

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissions: role?.permissions.map((p) => ({
        resource: p.resource,
        action: p.action as Action,
      })) ?? [],
    },
  })

  const permissions = form.watch("permissions")

  React.useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
        permissions: role.permissions.map((p) => ({
          resource: p.resource,
          action: p.action as Action,
        })),
      })
    } else {
      form.reset({ name: "", description: "", permissions: [] })
    }
  }, [role, form])

  function togglePermission(resource: string, action: string) {
    const current = form.getValues("permissions")
    const exists = current.some(
      (p) => p.resource === resource && p.action === action
    )
    if (exists) {
      form.setValue(
        "permissions",
        current.filter((p) => !(p.resource === resource && p.action === action))
      )
    } else {
      form.setValue("permissions", [
        ...current,
        { resource, action: action as Action },
      ])
    }
  }

  function hasPermission(resource: string, action: string) {
    return permissions.some(
      (p) => p.resource === resource && p.action === action
    )
  }

  async function onSubmit(values: CreateFormValues) {
    let result
    if (isEditing && role) {
      result = await updateRoleAction(role.id, values)
    } else {
      result = await createRoleAction(values)
    }

    if ("error" in result && result.error) {
      const msg =
        typeof result.error === "object" && "message" in result.error
          ? result.error.message
          : "An error occurred"
      toast({ title: "Error", description: String(msg), variant: "destructive" })
      return
    }

    toast({
      title: isEditing ? "Role updated" : "Role created",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            Configure role name and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name (slug)</Label>
            <Input
              id="name"
              placeholder="e.g. editor, moderator"
              disabled={isSystem}
              {...form.register("name")}
            />
            {isSystem && (
              <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>
            )}
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Role description (optional)"
              disabled={isSystem}
              {...form.register("description")}
            />
          </div>

          {/* Super admin: read-only notice */}
          {isSuperAdmin && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <p className="font-medium">Full access — all permissions</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                The super_admin role automatically has access to all current and future resources. Permissions cannot be modified.
              </p>
            </div>
          )}

          {/* Dashboard access + permissions matrix — hidden for super_admin */}
          {!isSuperAdmin && <>
          <div className="space-y-2">
            <Label>Access</Label>
            <div className="rounded-md border p-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={hasPermission("dashboard", "access")}
                  onCheckedChange={() => togglePermission("dashboard", "access")}
                />
                <div>
                  <p className="text-sm font-medium">Admin Dashboard</p>
                  <p className="text-xs text-muted-foreground">
                    Allow this role to log in and navigate the admin dashboard
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Resource</th>
                    {ACTIONS.map((action) => (
                      <th key={action} className="p-2 text-center font-medium capitalize">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((resource) => (
                    <tr key={resource} className="border-b last:border-0">
                      <td className="p-2 font-mono text-xs">{resource}</td>
                      {ACTIONS.map((action) => (
                        <td key={action} className="p-2 text-center">
                          <Checkbox
                            checked={hasPermission(resource, action)}
                            onCheckedChange={() =>
                              togglePermission(resource, action)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
