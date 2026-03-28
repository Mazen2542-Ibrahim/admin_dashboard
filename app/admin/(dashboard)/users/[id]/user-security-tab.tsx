"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ConfirmDialog } from "@/components/modals/confirm-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react"
import {
  sendPasswordResetEmailAction,
  resetPasswordAction,
  sendVerificationEmailAdminAction,
  markEmailVerifiedAction,
  revokeAllUserSessionsAction,
} from "@/modules/users/actions"

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type NewPasswordForm = z.infer<typeof newPasswordSchema>

interface UserSecurityTabProps {
  userId: string
  userEmail: string
  emailVerified: boolean
  smtpConfigured: boolean
}

export function UserSecurityTab({
  userId,
  userEmail,
  emailVerified,
  smtpConfigured,
}: UserSecurityTabProps) {
  const [showPasswordForm, setShowPasswordForm] = React.useState(false)
  const [isSendingReset, setIsSendingReset] = React.useState(false)
  const [isSendingVerify, setIsSendingVerify] = React.useState(false)
  const [isMarkingVerified, setIsMarkingVerified] = React.useState(false)
  const [forceLogoutOpen, setForceLogoutOpen] = React.useState(false)
  const [isForceLoggingOut, setIsForceLoggingOut] = React.useState(false)

  const form = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  })

  async function handleSendReset() {
    setIsSendingReset(true)
    const result = await sendPasswordResetEmailAction(userId)
    setIsSendingReset(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to send reset email",
        variant: "destructive",
      })
    } else {
      toast({ title: "Password reset email sent" })
    }
  }

  async function handleSetPassword(values: NewPasswordForm) {
    const result = await resetPasswordAction({ userId, newPassword: values.newPassword })
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to set password",
        variant: "destructive",
      })
    } else {
      toast({ title: "Password updated" })
      form.reset()
      setShowPasswordForm(false)
    }
  }

  async function handleSendVerification() {
    setIsSendingVerify(true)
    const result = await sendVerificationEmailAdminAction(userId)
    setIsSendingVerify(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to send verification email",
        variant: "destructive",
      })
    } else {
      toast({ title: "Verification email sent" })
    }
  }

  async function handleMarkVerified() {
    setIsMarkingVerified(true)
    const result = await markEmailVerifiedAction(userId)
    setIsMarkingVerified(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to mark email as verified",
        variant: "destructive",
      })
    } else {
      toast({ title: "Email marked as verified" })
    }
  }

  async function handleForceLogout() {
    setIsForceLoggingOut(true)
    const result = await revokeAllUserSessionsAction(userId)
    setIsForceLoggingOut(false)
    setForceLogoutOpen(false)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? result.error.message
            : "Failed to revoke sessions",
        variant: "destructive",
      })
    } else {
      toast({ title: "All sessions revoked" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Password section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Password</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!smtpConfigured || isSendingReset}
            onClick={handleSendReset}
            title={!smtpConfigured ? "SMTP is not configured" : undefined}
          >
            {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordForm((v) => !v)}
          >
            {showPasswordForm ? "Cancel" : "Set New Password"}
          </Button>
        </div>
        {!smtpConfigured && (
          <p className="text-xs text-muted-foreground">
            SMTP is not configured — email actions are disabled.
          </p>
        )}

        {showPasswordForm && (
          <form onSubmit={form.handleSubmit(handleSetPassword)} className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Password
            </Button>
          </form>
        )}
      </div>

      <Separator />

      {/* Email Verification section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Email Verification</h3>
        <div className="flex items-center gap-2">
          <Badge
            variant={emailVerified ? "success" : "outline"}
            className="flex items-center gap-1"
          >
            {emailVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
            {emailVerified ? "Verified" : "Unverified"}
          </Badge>
          <span className="text-xs text-muted-foreground">{userEmail}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!smtpConfigured || emailVerified || isSendingVerify}
            onClick={handleSendVerification}
            title={!smtpConfigured ? "SMTP is not configured" : undefined}
          >
            {isSendingVerify && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Verification Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={emailVerified || isMarkingVerified}
            onClick={handleMarkVerified}
          >
            {isMarkingVerified && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark as Verified
          </Button>
        </div>
      </div>

      <Separator />

      {/* Sessions section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Sessions</h3>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => setForceLogoutOpen(true)}
        >
          Force Logout All Devices
        </Button>
      </div>

      <ConfirmDialog
        open={forceLogoutOpen}
        onOpenChange={(open) => !open && setForceLogoutOpen(false)}
        title="Force Logout All Devices"
        description="This will immediately invalidate all active sessions for this user."
        confirmLabel="Force Logout"
        onConfirm={handleForceLogout}
        isLoading={isForceLoggingOut}
      />
    </div>
  )
}
