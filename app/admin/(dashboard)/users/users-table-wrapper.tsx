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
  currentUserId?: string
  roles: { id: string; name: string }[]
}

export function UsersTableWrapper({
  users,
  total,
  page,
  pageSize,
  search,
  currentUserId,
  roles,
}: UsersTableWrapperProps) {
  const router = useRouter()

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    params.set("page", String(newPage))
    if (search) params.set("search", search)
    router.push(`/admin/users?${params}`)
  }

  function handleSearch(value: string) {
    const params = new URLSearchParams()
    params.set("page", "1")
    if (value) params.set("search", value)
    router.push(`/admin/users?${params}`)
  }

  return (
    <UsersTable
      users={users}
      total={total}
      page={page}
      pageSize={pageSize}
      search={search}
      currentUserId={currentUserId}
      roles={roles}
      onPageChange={handlePageChange}
      onSearch={handleSearch}
    />
  )
}
