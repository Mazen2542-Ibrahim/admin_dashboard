"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { logSignInAction } from "@/modules/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/forms/password-input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { features } from "@/config/features.config"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
})

type LoginFormValues = z.infer<typeof loginSchema>
type OtpFormValues = z.infer<typeof otpSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard"

  const [step, setStep] = React.useState<"credentials" | "otp">("credentials")
  const [emailForOtp, setEmailForOtp] = React.useState("")
  const [unverifiedEmail, setUnverifiedEmail] = React.useState("")

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })

  async function onLoginSubmit(values: LoginFormValues) {
    setUnverifiedEmail("")

    const res = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password }),
      credentials: "include",
    })

    let data: { code?: string; error?: string; message?: string } = {}
    try {
      data = await res.json()
    } catch {
      // ignore parse errors
    }

    if (res.status === 200 && data.code === "OTP_REQUIRED") {
      setEmailForOtp(values.email)
      setStep("otp")
      return
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After")
      const seconds = retryAfter ? parseInt(retryAfter, 10) : null
      const timeStr = seconds && seconds > 60
        ? `Try again in ${Math.ceil(seconds / 60)} minutes.`
        : seconds
        ? `Try again in ${seconds} seconds.`
        : "Try again later."
      toast({ title: "Too many attempts", description: timeStr, variant: "destructive" })
      return
    }

    if (res.status === 403 && data.code === "ACCOUNT_LOCKED") {
      const unlocksAt = (data as { unlocksAt?: string }).unlocksAt ? new Date((data as { unlocksAt?: string }).unlocksAt!) : null
      const timeStr = unlocksAt
        ? `Try again after ${unlocksAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`
        : "Try again later."
      toast({ title: "Account locked", description: `Too many failed attempts. ${timeStr}`, variant: "destructive" })
      return
    }

    if (res.status === 403 && data.code === "EMAIL_UNVERIFIED") {
      setUnverifiedEmail(values.email)
      return
    }

    if (!res.ok) {
      const description =
        res.status === 403
          ? (data.error ?? "Your account has been deactivated. Contact an administrator.")
          : (data.error ?? data.message ?? "Invalid email or password")
      toast({ title: "Sign in failed", description, variant: "destructive" })
      return
    }

    // Successful sign-in
    logSignInAction().catch(() => {})
    router.push(callbackUrl)
    router.refresh()
  }

  async function onOtpSubmit(values: OtpFormValues) {
    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailForOtp, otp: values.otp }),
      credentials: "include",
    })

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After")
      const seconds = retryAfter ? parseInt(retryAfter, 10) : null
      const timeStr = seconds && seconds > 60
        ? `Try again in ${Math.ceil(seconds / 60)} minutes.`
        : seconds ? `Try again in ${seconds} seconds.` : "Try again later."
      otpForm.setError("otp", { message: `Too many attempts. ${timeStr}` })
      return
    }

    if (!res.ok) {
      let data: { error?: string } = {}
      try {
        data = await res.json()
      } catch {
        // ignore
      }
      otpForm.setError("otp", {
        message: data.error ?? "Invalid or expired code. Please try again.",
      })
      return
    }

    logSignInAction().catch(() => {})
    router.push(callbackUrl)
    router.refresh()
  }

  if (step === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{emailForOtp}</strong>. Enter it below.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            placeholder="123456"
            autoComplete="one-time-code"
            maxLength={6}
            className="text-center text-lg tracking-widest"
            {...otpForm.register("otp")}
          />
          {otpForm.formState.errors.otp && (
            <p className="text-sm text-destructive">
              {otpForm.formState.errors.otp.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={otpForm.formState.isSubmitting}
        >
          {otpForm.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Verify Code
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setStep("credentials")
              otpForm.reset()
            }}
          >
            Back to sign in
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
      {unverifiedEmail && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Email not verified</p>
          <p className="mt-1">
            Please verify your email before signing in.{" "}
            <Link
              href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
              className="font-medium underline"
            >
              Resend verification email
            </Link>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          autoComplete="email"
          {...loginForm.register("email")}
        />
        {loginForm.formState.errors.email && (
          <p className="text-sm text-destructive">
            {loginForm.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...loginForm.register("password")}
        />
        {loginForm.formState.errors.password && (
          <p className="text-sm text-destructive">
            {loginForm.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loginForm.formState.isSubmitting}
      >
        {loginForm.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Sign In
      </Button>

      {features.registration && (
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      )}
    </form>
  )
}
