import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getUserById } from "@/modules/users/queries"
import { getActiveSmtpSettings } from "@/modules/smtp/queries"
import { ProfileTabs } from "./profile-form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, getInitials } from "@/lib/utils"
import { ShieldCheck, ShieldOff } from "lucide-react"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [user, smtpSettings] = await Promise.all([
    getUserById(session.user.id),
    getActiveSmtpSettings(),
  ])
  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardContent className="px-4 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10">
            {/* Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-background shadow-sm shrink-0">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback className="text-lg sm:text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(user.name ?? user.email ?? "U")}
              </AvatarFallback>
            </Avatar>

            {/* Name + email + badges */}
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

            {/* Member since — right-aligned on desktop, inline below badges on mobile */}
            <p className="text-xs text-muted-foreground sm:pb-1 shrink-0">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed settings */}
      <ProfileTabs
        name={user.name}
        email={user.email}
        role={user.role}
        isActive={user.isActive}
        emailVerified={user.emailVerified}
        createdAt={user.createdAt}
        smtpConfigured={!!smtpSettings}
      />
    </div>
  )
}
