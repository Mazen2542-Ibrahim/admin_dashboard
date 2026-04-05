"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PasswordInput } from "@/components/forms/password-input"
import { toast } from "@/components/ui/use-toast"
import { saveSmtpSettingsAction, testSmtpAction } from "@/modules/smtp/actions"
import { smtpSettingsSchema } from "@/modules/smtp/schema"
import { Loader2, Send } from "lucide-react"
import type { SmtpSettings } from "@/modules/smtp/types"
import { z } from "zod"

type SmtpFormValues = z.infer<typeof smtpSettingsSchema>

interface SmtpFormProps {
  settings: SmtpSettings | null
}

export function SmtpForm({ settings }: SmtpFormProps) {
  const [testEmail, setTestEmail] = React.useState("")
  const [isTesting, setIsTesting] = React.useState(false)

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: settings?.host ?? "",
      port: settings?.port ?? 587,
      username: settings?.username ?? "",
      password: "",
      fromName: settings?.fromName ?? "",
      fromEmail: settings?.fromEmail ?? "",
      secure: settings?.secure ?? false,
    },
  })

  async function onSubmit(values: SmtpFormValues) {
    const result = await saveSmtpSettingsAction(values)
    if ("error" in result && result.error) {
      toast({
        title: "Error",
        description:
          typeof result.error === "object" && "message" in result.error
            ? String(result.error.message)
            : "Failed to save settings",
        variant: "destructive",
      })
      return
    }
    toast({ title: "SMTP settings saved" })
  }

  async function handleTest() {
    if (!testEmail) {
      toast({ title: "Enter a test email address", variant: "destructive" })
      return
    }
    setIsTesting(true)
    const result = await testSmtpAction({ toEmail: testEmail })
    setIsTesting(false)
    if ("error" in result && result.error) {
      toast({
        title: "Test failed",
        description:
          typeof result.error === "object" && "message" in result.error
            ? String(result.error.message)
            : "SMTP test failed",
        variant: "destructive",
      })
    } else {
      toast({ title: "Test email sent!", description: `Sent to ${testEmail}` })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Configure your SMTP server. Credentials are stored encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host</Label>
                <Input
                  id="host"
                  placeholder="smtp.gmail.com"
                  {...form.register("host")}
                />
                {form.formState.errors.host && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.host.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="587"
                  {...form.register("port", { valueAsNumber: true })}
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.port.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="your@email.com"
                autoComplete="off"
                {...form.register("username")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder={settings ? "Leave blank to keep current" : "SMTP password"}
                autoComplete="new-password"
                {...form.register("password")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  placeholder="My App"
                  {...form.register("fromName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@myapp.com"
                  {...form.register("fromEmail")}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="secure"
                checked={form.watch("secure")}
                onCheckedChange={(v) => form.setValue("secure", v)}
              />
              <Label htmlFor="secure">
                Use SSL/TLS (port 465)
              </Label>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Email */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Test Connection</CardTitle>
            <CardDescription>
              Send a test email to verify your SMTP settings are working.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
