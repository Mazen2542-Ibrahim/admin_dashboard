"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { signUp, signOut } from "@/lib/auth-client"
import { sendWelcomeEmailAction } from "@/modules/users/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/forms/password-input"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface LocationConfig {
  requireLocationForAuth: boolean
  allowedCountries: string[]
}

interface RegisterFormProps {
  locationConfig: LocationConfig
  emailVerificationEnabled: boolean
}

type GeoState = "idle" | "requesting" | "approved" | "blocked" | "denied"

export function RegisterForm({ locationConfig, emailVerificationEnabled }: RegisterFormProps) {
  const router = useRouter()
  const [geoState, setGeoState] = React.useState<GeoState>("idle")

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })

  async function checkLocation(): Promise<boolean> {
    if (!locationConfig.requireLocationForAuth) return true
    if (geoState === "approved") return true

    setGeoState("requesting")

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("denied")
      return false
    }

    let coords: { latitude: number; longitude: number }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 300000,
          enableHighAccuracy: false,
        })
      })
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    } catch {
      setGeoState("denied")
      return false
    }

    try {
      const res = await fetch("/api/auth/location-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coords),
      })
      const data = (await res.json()) as { allowed: boolean }
      if (data.allowed) {
        setGeoState("approved")
        return true
      }
      setGeoState("blocked")
      return false
    } catch {
      // Network error — don't block the user
      setGeoState("approved")
      return true
    }
  }

  async function onSubmit(values: RegisterFormValues) {
    const locationOk = await checkLocation()
    if (!locationOk) return

    const result = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: "/verify-email?verified=true",
    })

    if (result.error) {
      toast({
        title: "Registration failed",
        description: result.error.message ?? "Could not create account",
        variant: "destructive",
      })
      return
    }

    // Fire-and-forget welcome email — must not block redirect
    sendWelcomeEmailAction(values.email, values.name).catch(() => {})

    if (emailVerificationEnabled) {
      // Sign out the auto-created session so the user can't bypass email verification
      await signOut()
      toast({ title: "Account created!", description: "Check your email for a verification link." })
    } else {
      toast({ title: "Account created!", description: "You can now sign in." })
    }
    router.push("/login")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {geoState === "denied" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Location access required</p>
          <p className="mt-1">Please enable location services in your browser and try again.</p>
        </div>
      )}

      {geoState === "blocked" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Access restricted</p>
          <p className="mt-1">Access from your country is not allowed.</p>
        </div>
      )}

      {geoState === "requesting" && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <p className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying your location…
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Your Name"
          autoComplete="name"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting || geoState === "requesting" || geoState === "denied"}
      >
        {(form.formState.isSubmitting || geoState === "requesting") && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Create Account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
