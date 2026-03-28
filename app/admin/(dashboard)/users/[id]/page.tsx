import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserById } from "@/modules/users/queries"
import { getAllRoles } from "@/modules/roles/queries"
import { getSession } from "@/lib/auth"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { UserDetailTabs } from "./user-detail-tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDate, getInitials } from "@/lib/utils"
import { ShieldCheck, ShieldOff, ChevronLeft } from "lucide-react"

interface UserDetailPageProps {
  params: { id: string }
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  if (!uuidRegex.test(params.id)) redirect("/admin/users")

  const [user, allRoles, session, smtpSettings] = await Promise.all([
    getUserById(params.id),
    getAllRoles(),
    getSession(),
    getActiveSmtpSettings(),
  ])

  if (!user) redirect("/admin/users")

  const roles = allRoles.map((r) => ({ id: r.id, name: r.name }))
  const isSelf = session?.user.id === params.id
  const currentSessionId = (session as { session?: { id?: string } } | null)?.session?.id

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/users">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Users
          </Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium truncate">{user.name}</span>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="px-4 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-sm shrink-0">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback className="text-lg sm:text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(user.name ?? user.email ?? "U")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">{user.name}</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge variant="secondary" className="capitalize text-xs">
                  {user.role.replace(/_/g, " ")}
                </Badge>
                <Badge variant={user.isActive ? "success" : "destructive"} className="text-xs">
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={user.emailVerified ? "success" : "outline"}
                  className="flex items-center gap-1 text-xs"
                >
                  {user.emailVerified
                    ? <ShieldCheck className="h-3 w-3" />
                    : <ShieldOff className="h-3 w-3" />}
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground sm:pb-1 shrink-0">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed detail */}
      <UserDetailTabs
        user={user}
        roles={roles}
        isSelf={isSelf}
        smtpConfigured={!!smtpSettings}
        currentSessionId={currentSessionId}
      />
    </div>
  )
}
