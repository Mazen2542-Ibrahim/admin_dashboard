import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { verifyPassword } from "better-auth/crypto"
import { getUserByEmail, getAccountByUserId } from "@/modules/users/queries"
import { getAppSettings } from "@/modules/settings/queries"
import { sendTemplateEmailByName } from "@/modules/email-templates/service"
import { appConfig } from "@/config/app.config"
import { db } from "@/lib/db"
import { verifications } from "@/db/schema"
import { eq } from "drizzle-orm"

const betterAuthHandler = toNextJsHandler(auth)

/**
 * Enhanced POST interceptor for sign-in/email with 4 ordered checks:
 * 1. Account deactivated
 * 2. Email unverified (if setting enabled)
 * 3. OTP required (if setting enabled) — verifies password, sends OTP
 * 4. Registration disabled (for sign-up endpoint)
 */
async function POST(req: NextRequest) {
  const url = new URL(req.url)

  if (url.pathname === "/api/auth/sign-in/email") {
    let body: { email?: string; password?: string }
    try {
      body = await req.clone().json()
    } catch {
      return betterAuthHandler.POST(req)
    }

    const { email, password } = body

    if (!email) return betterAuthHandler.POST(req)

    // 1. Find user
    const user = await getUserByEmail(email)
    if (!user) return betterAuthHandler.POST(req)

    // 2. Check inactive
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Contact an administrator." },
        { status: 403 }
      )
    }

    // 3. Check email verification (if enabled)
    const settings = await getAppSettings()
    if (settings?.emailVerificationEnabled && !user.emailVerified) {
      return NextResponse.json(
        { code: "EMAIL_UNVERIFIED", error: "Please verify your email before logging in." },
        { status: 403 }
      )
    }

    // 4. Check OTP (if enabled) — verify password first, then return OTP_REQUIRED
    if (settings?.emailOtpEnabled && password) {
      const account = await getAccountByUserId(user.id)
      if (!account?.password) return betterAuthHandler.POST(req)

      const valid = await verifyPassword({ hash: account.password, password })
      if (!valid) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
      }

      // Generate 6-digit OTP, store in verifications table
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      const identifier = `otp-login-${user.id}`

      // Delete any existing OTP for this user then insert fresh
      await db.delete(verifications).where(eq(verifications.identifier, identifier))
      await db.insert(verifications).values({
        id: crypto.randomUUID(),
        identifier,
        value: otp,
        expiresAt,
      })

      await sendTemplateEmailByName("login-otp", user.email, {
        userName: user.name,
        otpCode: otp,
        appName: appConfig.name,
      })

      return NextResponse.json({ code: "OTP_REQUIRED" }, { status: 200 })
    }
  }

  // Registration guard
  if (url.pathname === "/api/auth/sign-up/email") {
    const settings = await getAppSettings()
    if (settings && !settings.registrationEnabled) {
      return NextResponse.json(
        { error: "Registration is currently disabled." },
        { status: 403 }
      )
    }
  }

  return betterAuthHandler.POST(req)
}

export { POST }
export const GET = betterAuthHandler.GET
