import { getAllUsers, getUserCount } from "@/modules/users/queries"
import { getRoleOptions } from "@/modules/roles/queries"
import { getSession } from "@/lib/auth"
import { UsersTableWrapper } from "./users-table-wrapper"
import type { User } from "@/modules/users/types"

interface UsersPageProps {
  searchParams: { page?: string; search?: string; role?: string; status?: string }
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const search = searchParams.search
  const role = searchParams.role
  const status = searchParams.status === "active" || searchParams.status === "inactive"
    ? searchParams.status
    : undefined
  const pageSize = 20

  const [users, total, session, allRoles] = await Promise.all([
    getAllUsers({ page, limit: pageSize, search, role, status }),
    getUserCount({ search, role, status }),
    getSession(),
    getRoleOptions(),
  ])

  const roles = allRoles.filter((r) => r.name !== "visitor")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <UsersTableWrapper
        users={users as User[]}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
        role={role}
        status={status}
        currentUserId={session?.user.id}
        roles={roles}
      />
    </div>
  )
}
