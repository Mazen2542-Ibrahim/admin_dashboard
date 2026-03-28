"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { UserModal } from "./user-modal"
import { toast } from "@/components/ui/use-toast"
import {
  deleteUserAction,
  hardDeleteUserAction,
  reactivateUserAction,
} from "@/modules/users/actions"
import { formatDate } from "@/lib/utils"
import { MoreHorizontal, Plus, UserX, UserCheck, Trash2, Pencil } from "lucide-react"
import type { User } from "@/modules/users/types"

interface UsersTableProps {
  users: User[]
  total: number
  page: number
  pageSize: number
  search?: string
  currentUserId?: string
  roles: { id: string; name: string }[]
  onPageChange: (page: number) => void
  onSearch?: (value: string) => void
}

export function UsersTable({
  users,
  total,
  page,
  pageSize,
  search,
  currentUserId,
  roles,
  onPageChange,
  onSearch,
}: UsersTableProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editUser, setEditUser] = React.useState<User | null>(null)
  const [deactivateId, setDeactivateId] = React.useState<string | null>(null)
  const [reactivateId, setReactivateId] = React.useState<string | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleDeactivate() {
    if (!deactivateId) return
    setIsLoading(true)
    const result = await deleteUserAction(deactivateId)
    setIsLoading(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to deactivate user",
        variant: "destructive",
      })
    } else {
      toast({ title: "User deactivated" })
    }
    setDeactivateId(null)
  }

  async function handleReactivate() {
    if (!reactivateId) return
    setIsLoading(true)
    const result = await reactivateUserAction(reactivateId)
    setIsLoading(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to reactivate user",
        variant: "destructive",
      })
    } else {
      toast({ title: "User reactivated" })
    }
    setReactivateId(null)
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const result = await hardDeleteUserAction(deleteId)
    setIsLoading(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to delete user",
        variant: "destructive",
      })
    } else {
      toast({ title: "User deleted" })
    }
    setDeleteId(null)
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <Badge
            variant={
              role === "super_admin"
                ? "default"
                : role === "admin"
                ? "secondary"
                : "outline"
            }
          >
            {role.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "destructive"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {user.isActive ? (
                <DropdownMenuItem
                  onClick={() => setDeactivateId(user.id)}
                  disabled={currentUserId === user.id}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setReactivateId(user.id)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(user.id)}
                disabled={currentUserId === user.id}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search users..."
        searchValue={search}
        onSearch={onSearch}
        pagination={{ page, pageSize, total, onPageChange }}
        toolbar={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New User
          </Button>
        }
      />

      <UserModal
        open={createOpen || editUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditUser(null)
          }
        }}
        user={editUser}
        roles={roles}
      />

      <ConfirmDialog
        open={deactivateId !== null}
        onOpenChange={(open) => !open && setDeactivateId(null)}
        title="Deactivate User"
        description="This will prevent the user from logging in. You can reactivate them later."
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={reactivateId !== null}
        onOpenChange={(open) => !open && setReactivateId(null)}
        title="Reactivate User"
        description="This will allow the user to log in again."
        confirmLabel="Reactivate"
        onConfirm={handleReactivate}
        isLoading={isLoading}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete User"
        description="This will permanently delete the user and all their data. This action cannot be undone."
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  )
}
