import { getAllUsers, getUserCount } from "@/modules/users/queries"
import { getAllRoles } from "@/modules/roles/queries"
import { getSession } from "@/lib/auth"
import { UsersTableWrapper } from "./users-table-wrapper"
import type { User } from "@/modules/users/types"

interface UsersPageProps {
  searchParams: { page?: string; search?: string }
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = parseInt(searchParams.page ?? "1", 10)
  const search = searchParams.search
  const pageSize = 20

  const [users, total, session, allRoles] = await Promise.all([
    getAllUsers({ page, limit: pageSize, search }),
    getUserCount(search),
    getSession(),
    getAllRoles(),
  ])

  const roles = allRoles.map((r) => ({ id: r.id, name: r.name }))

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
        currentUserId={session?.user.id}
        roles={roles}
      />
    </div>
  )
}
