"use client"

import { useRouter } from "next/navigation"
import { UsersTable } from "./users-table"
import type { User } from "@/modules/users/types"

interface UsersTableWrapperProps {
  users: User[]
  total: number
  page: number
  pageSize: number
  search?: string
  role?: string
  status?: string
  currentUserId?: string
  roles: { id: string; name: string }[]
}

export function UsersTableWrapper({
  users,
  total,
  page,
  pageSize,
  search,
  role,
  status,
  currentUserId,
  roles,
}: UsersTableWrapperProps) {
  const router = useRouter()

  function buildParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { search, role, status, ...overrides }
    if (merged.search) params.set("search", merged.search)
    if (merged.role) params.set("role", merged.role)
    if (merged.status) params.set("status", merged.status)
    params.set("page", overrides.page ?? "1")
    return params.toString()
  }

  function handlePageChange(newPage: number) {
    router.push(`/admin/users?${buildParams({ page: String(newPage) })}`)
  }

  function handleSearch(value: string) {
    router.push(`/admin/users?${buildParams({ search: value || undefined, page: "1" })}`)
  }

  function handleRoleChange(value: string) {
    router.push(`/admin/users?${buildParams({ role: value || undefined, page: "1" })}`)
  }

  function handleStatusChange(value: string) {
    router.push(`/admin/users?${buildParams({ status: value || undefined, page: "1" })}`)
  }

  return (
    <UsersTable
      users={users}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
      role={role}
      status={status}
      currentUserId={currentUserId}
      roles={roles}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
      onRoleChange={handleRoleChange}
      onStatusChange={handleStatusChange}
    />
  )
}
