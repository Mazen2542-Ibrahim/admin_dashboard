"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle } from "lucide-react"
import { appConfig } from "@/config/app.config"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: FormValues) {
    await requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    })
    // Always show success — don't reveal whether email exists
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            {appConfig.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">{appConfig.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, a reset link has been sent.
                  Check your inbox.
                </p>
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send reset link
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
