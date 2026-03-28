"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import {
  updateUserAction,
  deleteUserAction,
  reactivateUserAction,
  hardDeleteUserAction,
} from "@/modules/users/actions"
import type { User } from "@/modules/users/types"
import { UserSecurityTab } from "./user-security-tab"
import { UserSessionsTab } from "./user-sessions-tab"
import { UserActivityTab } from "./user-activity-tab"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1),
})
type ProfileForm = z.infer<typeof profileSchema>

interface UserDetailTabsProps {
  user: User
  roles: { id: string; name: string }[]
  isSelf: boolean
  smtpConfigured: boolean
  currentSessionId?: string
}

export function UserDetailTabs({
  user,
  roles,
  isSelf,
  smtpConfigured,
  currentSessionId,
}: UserDetailTabsProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [deactivateOpen, setDeactivateOpen] = React.useState(false)
  const [reactivateOpen, setReactivateOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })

  async function onSave(values: ProfileForm) {
    setIsSaving(true)
    const result = await updateUserAction(user.id, values)
    setIsSaving(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to save changes",
        variant: "destructive",
      })
    } else {
      toast({ title: "Changes saved" })
    }
  }

  async function handleDeactivate() {
    setIsActionLoading(true)
    const result = await deleteUserAction(user.id)
    setIsActionLoading(false)
    setDeactivateOpen(false)
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
      router.refresh()
    }
  }

  async function handleReactivate() {
    setIsActionLoading(true)
    const result = await reactivateUserAction(user.id)
    setIsActionLoading(false)
    setReactivateOpen(false)
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
      router.refresh()
    }
  }

  async function handleHardDelete() {
    setIsActionLoading(true)
    const result = await hardDeleteUserAction(user.id)
    setIsActionLoading(false)
    setDeleteOpen(false)
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
      router.push("/admin/users")
    }
  }

  return (
    <Card>
      <Tabs defaultValue="profile">
        <div className="border-b px-4 sm:px-6 pt-1 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 gap-0 min-w-max">
            {(["profile", "security", "sessions", "activity"] as const).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 pb-3 pt-2 text-sm font-medium capitalize"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Profile tab */}
        <TabsContent value="profile" className="p-4 sm:p-6 space-y-6">
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(v) => form.setValue("role", v)}
                  disabled={isSelf}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.name}>
                        {r.name.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Danger Zone</h3>
            <div className="flex flex-wrap gap-3">
              {user.isActive ? (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  disabled={isSelf}
                  onClick={() => setDeactivateOpen(true)}
                >
                  Deactivate User
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={isSelf}
                  onClick={() => setReactivateOpen(true)}
                >
                  Reactivate User
                </Button>
              )}
              <Button
                variant="destructive"
                disabled={isSelf}
                onClick={() => setDeleteOpen(true)}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security" className="p-4 sm:p-6">
          <UserSecurityTab
            userId={user.id}
            userEmail={user.email}
            emailVerified={user.emailVerified}
            smtpConfigured={smtpConfigured}
          />
        </TabsContent>

        {/* Sessions tab */}
        <TabsContent value="sessions" className="p-4 sm:p-6">
          <UserSessionsTab
            userId={user.id}
            currentSessionId={currentSessionId}
            isSelf={isSelf}
          />
        </TabsContent>

        {/* Activity tab */}
        <TabsContent value="activity" className="p-4 sm:p-6">
          <UserActivityTab userId={user.id} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={(open) => !open && setDeactivateOpen(false)}
        title="Deactivate User"
        description="This will prevent the user from logging in. You can reactivate them later."
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        isLoading={isActionLoading}
      />

      <ConfirmDialog
        open={reactivateOpen}
        onOpenChange={(open) => !open && setReactivateOpen(false)}
        title="Reactivate User"
        description="This will allow the user to log in again."
        confirmLabel="Reactivate"
        onConfirm={handleReactivate}
        isLoading={isActionLoading}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => !open && setDeleteOpen(false)}
        title="Delete User Permanently"
        description="This will permanently delete the user and all their data. This action cannot be undone."
        confirmLabel="Delete Permanently"
        onConfirm={handleHardDelete}
        isLoading={isActionLoading}
      />
    </Card>
  )
}
