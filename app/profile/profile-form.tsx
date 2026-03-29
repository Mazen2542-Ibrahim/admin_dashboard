"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  updateProfileAction,
  requestEmailChangeAction,
  logPasswordChangedAction,
  updateThemeAction,
} from "@/modules/users/actions"
import { changePassword } from "@/lib/auth-client"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, ShieldCheck, ShieldOff, Mail, Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"

interface ProfileTabsProps {
  name: string
  email: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  smtpConfigured: boolean
  themePreference: string
}

export function ProfileTabs({
  name,
  email,
  role,
  isActive,
  emailVerified,
  createdAt,
  smtpConfigured,
  themePreference,
}: ProfileTabsProps) {
  return (
    <Card>
      <Tabs defaultValue="general">
        {/* Tab bar — scrollable on very small screens */}
        <div className="border-b px-4 sm:px-6 pt-1 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 gap-0 min-w-max">
            {(["general", "security", "email"] as const).map((tab) => (
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

        {/* ── General ────────────────────────────────────────────────────── */}
        <TabsContent value="general" className="p-4 sm:p-6 space-y-6 mt-0">
          <ProfileNameSection name={name} />
          <Separator />
          <AccountInfoSection
            email={email}
            role={role}
            isActive={isActive}
            emailVerified={emailVerified}
            createdAt={createdAt}
          />
          <Separator />
          <AppearanceSection themePreference={themePreference} />
        </TabsContent>

        {/* ── Security ───────────────────────────────────────────────────── */}
        <TabsContent value="security" className="p-4 sm:p-6 mt-0">
          <ChangePasswordSection />
        </TabsContent>

        {/* ── Email ──────────────────────────────────────────────────────── */}
        <TabsContent value="email" className="p-4 sm:p-6 space-y-6 mt-0">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Current Email</p>
              <p className="text-sm text-muted-foreground mt-0.5 break-all">{email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={emailVerified ? "success" : "outline"}
                className="flex items-center gap-1"
              >
                {emailVerified
                  ? <ShieldCheck className="h-3 w-3" />
                  : <ShieldOff className="h-3 w-3" />}
                {emailVerified ? "Verified" : "Unverified"}
              </Badge>
              {!emailVerified && (
                <p className="text-xs text-muted-foreground">
                  Your email address has not been verified.
                </p>
              )}
            </div>
          </div>
          <Separator />
          <ChangeEmailSection smtpConfigured={smtpConfigured} currentEmail={email} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}

// ─── General: Name ────────────────────────────────────────────────────────────

const nameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})
type NameValues = z.infer<typeof nameSchema>

function ProfileNameSection({ name }: { name: string }) {
  const form = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name },
  })

  async function onSubmit(values: NameValues) {
    const result = await updateProfileAction(values)
    if ("error" in result && result.error) {
      const msg =
        typeof result.error === "object" && "message" in result.error
          ? result.error.message
          : "Failed to update profile"
      toast({ title: "Error", description: String(msg), variant: "destructive" })
      return
    }
    toast({ title: "Profile updated", description: "Your name has been saved." })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Display Name</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Change how your name appears across the system.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-0 sm:flex sm:gap-3 sm:items-start w-full sm:max-w-sm">
        <div className="flex-1 space-y-1">
          <Input
            id="name"
            placeholder="Your full name"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto shrink-0">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </form>
    </div>
  )
}

// ─── General: Account Info ────────────────────────────────────────────────────

function AccountInfoSection({
  email,
  role,
  isActive,
  emailVerified,
  createdAt,
}: {
  email: string
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
}) {
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Email",
      value: <span className="font-medium text-right break-all">{email}</span>,
    },
    {
      label: "Role",
      value: (
        <Badge variant="secondary" className="capitalize">
          {role.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      label: "Status",
      value: (
        <Badge variant={isActive ? "success" : "destructive"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      label: "Email Verified",
      value: (
        <Badge variant={emailVerified ? "success" : "outline"} className="flex items-center gap-1 w-fit">
          {emailVerified ? <ShieldCheck className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
          {emailVerified ? "Verified" : "Unverified"}
        </Badge>
      ),
    },
    {
      label: "Member since",
      value: <span className="font-medium text-right">{formatDate(createdAt)}</span>,
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Account Information</p>
      <div className="divide-y rounded-md border text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <div className="min-w-0">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Security: Change Password ────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type PasswordValues = z.infer<typeof passwordSchema>

function ChangePasswordSection() {
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onSubmit(values: PasswordValues) {
    const result = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: false,
    })
    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message ?? "Failed to change password",
        variant: "destructive",
      })
      return
    }
    logPasswordChangedAction().catch(() => {})
    toast({ title: "Password changed", description: "Your password has been updated." })
    form.reset()
  }

  return (
    <div className="space-y-4 w-full sm:max-w-sm">
      <div>
        <p className="text-sm font-medium">Change Password</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          You will need your current password to confirm.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
          />
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change Password
        </Button>
      </form>
    </div>
  )
}

// ─── Email: Change Email ──────────────────────────────────────────────────────

const emailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Password is required"),
})
type EmailValues = z.infer<typeof emailSchema>

function ChangeEmailSection({
  smtpConfigured,
  currentEmail,
}: {
  smtpConfigured: boolean
  currentEmail: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    const changed = searchParams.get("emailChanged")
    const error = searchParams.get("emailChangeError")
    if (changed === "1") {
      toast({ title: "Email updated", description: "Your email address has been updated." })
      router.replace("/profile")
    } else if (error === "expired") {
      toast({
        title: "Link expired",
        description: "This verification link has expired. Please request a new one.",
        variant: "destructive",
      })
      router.replace("/profile")
    } else if (error === "invalid") {
      toast({
        title: "Invalid link",
        description: "Invalid verification link.",
        variant: "destructive",
      })
      router.replace("/profile")
    }
  }, [searchParams, router])

  const form = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: "", currentPassword: "" },
  })

  if (!smtpConfigured) {
    return (
      <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        Email changes require SMTP to be configured. Contact your administrator.
      </div>
    )
  }

  if (pendingEmail) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-md border bg-muted/50 px-4 py-3 text-sm">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p>
            Verification link sent to <span className="font-medium">{pendingEmail}</span>. Click it
            to confirm your new address. The link expires in 24 hours.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setPendingEmail(null); form.reset() }}>
          Change a different address
        </Button>
      </div>
    )
  }

  async function onSubmit(values: EmailValues) {
    const result = await requestEmailChangeAction(values.newEmail, values.currentPassword)
    if ("error" in result && result.error) {
      const msg =
        typeof result.error === "object" && "message" in result.error
          ? result.error.message
          : "Failed to request email change"
      toast({ title: "Error", description: String(msg), variant: "destructive" })
      return
    }
    if (result.success && result.pendingEmail) {
      setPendingEmail(result.pendingEmail)
    }
  }

  return (
    <div className="space-y-4 w-full sm:max-w-sm">
      <div>
        <p className="text-sm font-medium">Change Email Address</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          A verification link will be sent to your new address before the change is applied.
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="newEmail">New Email Address</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...form.register("newEmail")}
          />
          {form.formState.errors.newEmail && (
            <p className="text-sm text-destructive">{form.formState.errors.newEmail.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="emailCurrentPassword">Current Password</Label>
          <Input
            id="emailCurrentPassword"
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
          />
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Verification
        </Button>
      </form>
    </div>
  )
}

// ─── General: Appearance ──────────────────────────────────────────────────────

const THEME_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device setting",
    icon: Monitor,
  },
] as const

function AppearanceSection({ themePreference }: { themePreference: string }) {
  const { theme, setTheme } = useTheme()
  const current = (theme ?? themePreference) as "light" | "dark" | "system"

  const active = THEME_OPTIONS.find((o) => o.value === current) ?? THEME_OPTIONS[2]
  const ActiveIcon = active.icon

  function handleThemeChange(value: string) {
    const safe = value as "light" | "dark" | "system"
    setTheme(safe)
    updateThemeAction(safe).catch(() => {})
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Appearance</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose how the interface looks on this device.
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex w-full sm:w-64 items-center justify-between gap-3 rounded-md border px-3 py-2.5",
              "text-sm bg-background hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted">
                <ActiveIcon className="h-3.5 w-3.5 text-foreground" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="font-medium">{active.label}</span>
                <span className="text-xs text-muted-foreground">{active.description}</span>
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuRadioGroup value={current} onValueChange={handleThemeChange}>
            {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="flex items-center gap-3 px-3 py-2.5 [&>span:first-child]:hidden cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-col leading-tight flex-1">
                  <span className="font-medium text-sm">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </span>
                {current === value && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Keep old named export so any other imports don't break
export { ProfileNameSection as ProfileForm }
