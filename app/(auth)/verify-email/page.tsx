"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { verifyEmail, sendVerificationEmail } from "@/lib/auth-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"
import { appConfig } from "@/config/app.config"
import { Suspense } from "react"

// callbackURL sent in verification emails — better-auth redirects here after verifying
const VERIFIED_CALLBACK = "/verify-email?verified=true"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const emailParam = searchParams.get("email") ?? ""
  const isVerified = searchParams.get("verified") === "true"

  // State for the token-based verification flow
  const [tokenStatus, setTokenStatus] = React.useState<"loading" | "success" | "error">("loading")

  // State for the email-based resend flow
  const [sendStatus, setSendStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle")
  const hasSentRef = React.useRef(false)

  // When token present: call the API to verify (used if someone navigates directly with a token)
  React.useEffect(() => {
    if (!token) return
    verifyEmail({ query: { token } })
      .then((result) => setTokenStatus(result.error ? "error" : "success"))
      .catch(() => setTokenStatus("error"))
  }, [token])

  // When email param present (and no token): auto-send verification email on first mount
  React.useEffect(() => {
    if (!emailParam || token || hasSentRef.current) return
    hasSentRef.current = true
    setSendStatus("sending")
    sendVerificationEmail({
      email: emailParam,
      callbackURL: VERIFIED_CALLBACK,
    })
      .then((result) => setSendStatus(result.error ? "error" : "sent"))
      .catch(() => setSendStatus("error"))
  }, [emailParam, token])

  async function handleResend() {
    if (!emailParam) return
    setSendStatus("sending")
    const result = await sendVerificationEmail({
      email: emailParam,
      callbackURL: VERIFIED_CALLBACK,
    })
    setSendStatus(result.error ? "error" : "sent")
  }

  // Case 1: already verified via redirect from better-auth
  if (isVerified) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <p className="text-sm text-muted-foreground">
          Your email has been verified. You can now sign in.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  // Case 2: token in URL — verify server-side via API call
  if (token) {
    return (
      <div className="space-y-4 text-center">
        {tokenStatus === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your email…</p>
          </>
        )}
        {tokenStatus === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Your email has been verified. You can now sign in.
            </p>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Go to sign in
            </Link>
          </>
        )}
        {tokenStatus === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="text-sm text-destructive">
              Verification failed. The link may be expired or invalid.
            </p>
            {emailParam && (
              <Button variant="outline" size="sm" onClick={handleResend} disabled={sendStatus === "sending"}>
                {sendStatus === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send a new link
              </Button>
            )}
            <div>
              <Link href="/login" className="text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }

  // Case 3: email param — auto-sent on mount, show status + resend button
  if (emailParam) {
    return (
      <div className="space-y-4 text-center">
        {sendStatus === "sending" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sending verification email…</p>
          </>
        )}

        {(sendStatus === "sent" || sendStatus === "error") && (
          <>
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            {sendStatus === "sent" ? (
              <p className="text-sm text-muted-foreground">
                Verification email sent to <strong>{emailParam}</strong>.
                Check your inbox and click the link to verify your account.
              </p>
            ) : (
              <p className="text-sm text-destructive">
                Failed to send verification email. Please try again.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
            >
              Resend verification email
            </Button>
          </>
        )}

        <p className="text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  // Case 4: no params — generic landing
  return (
    <div className="space-y-4 text-center">
      <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Enter your email on the sign-in page to receive a verification link.
      </p>
      <Link href="/login" className="text-sm text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            A
          </div>
          <h1 className="text-2xl font-bold">{appConfig.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Complete your account setup by verifying your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <VerifyEmailContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
