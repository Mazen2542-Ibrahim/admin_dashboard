"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { deleteRoleAction } from "@/modules/roles/actions"
import { Pencil, Trash2, Lock, Plus } from "lucide-react"
import type { RoleWithPermissions } from "@/modules/roles/types"
import { RoleModal } from "./role-modal"

interface RolesListProps {
  roles: RoleWithPermissions[]
}

export function RolesList({ roles }: RolesListProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editRole, setEditRole] = React.useState<RoleWithPermissions | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const result = await deleteRoleAction(deleteId)
    setIsLoading(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to delete role",
        variant: "destructive",
      })
    } else {
      toast({ title: "Role deleted" })
    }
    setDeleteId(null)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {roles.length} role{roles.length !== 1 ? "s" : ""} configured
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  {role.isSystem && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-1">
                  {role.name !== "super_admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditRole(role)}
                      title={role.isSystem ? "Edit permissions" : "Edit role"}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(role.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {role.description && (
                <CardDescription>{role.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No permissions
                  </span>
                ) : (
                  role.permissions.slice(0, 6).map((perm) => (
                    <Badge
                      key={perm.id}
                      variant="secondary"
                      className="text-xs font-mono"
                    >
                      {perm.resource}.{perm.action}
                    </Badge>
                  ))
                )}
                {role.permissions.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 6} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoleModal
        open={createOpen || editRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditRole(null)
          }
        }}
        role={editRole}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Role"
        description="This will permanently delete the role and its permissions. System roles cannot be deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  )
}
