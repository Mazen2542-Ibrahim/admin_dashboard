"use client"

import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface SmtpStatusBannerProps {
  configured: boolean
}

export function SmtpStatusBanner({ configured }: SmtpStatusBannerProps) {
  if (configured) return null

  return (
    <Alert variant="warning">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>SMTP not configured</strong> — email features (verification, OTP, password reset) won&apos;t work.{" "}
        <Link href="/admin/smtp" className="font-medium underline hover:no-underline">
          Configure SMTP
        </Link>
      </AlertDescription>
    </Alert>
  )
}
