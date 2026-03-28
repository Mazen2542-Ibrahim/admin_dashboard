"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserModal } from "./user-modal"
import { formatDate } from "@/lib/utils"
import { Plus, Eye } from "lucide-react"
import type { User } from "@/modules/users/types"

interface UsersTableProps {
  users: User[]
  total: number
  page: number
  pageSize: number
  search?: string
  role?: string
  status?: string
  currentUserId?: string
  roles: { id: string; name: string }[]
  onPageChange: (page: number) => void
  onSearch?: (value: string) => void
  onRoleChange?: (value: string) => void
  onStatusChange?: (value: string) => void
}

export function UsersTable({
  users,
  total,
  page,
  pageSize,
  search,
  role,
  status,
  roles,
  onPageChange,
  onSearch,
  onRoleChange,
  onStatusChange,
}: UsersTableProps) {
  const [createOpen, setCreateOpen] = React.useState(false)

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
        const r = row.original.role
        return (
          <Badge
            variant={
              r === "super_admin" ? "default" : r === "admin" ? "secondary" : "outline"
            }
          >
            {r.replace(/_/g, " ")}
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
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.lastLoginAt) ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/users/${row.original.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
      ),
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
          <div className="flex items-center gap-2">
            <Select value={role ?? ""} onValueChange={(v) => onRoleChange?.(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status ?? ""} onValueChange={(v) => onStatusChange?.(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          </div>
        }
      />

      <UserModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        user={null}
        roles={roles}
      />
    </>
  )
}
