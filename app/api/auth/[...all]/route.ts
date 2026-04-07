import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { verifyPassword } from "better-auth/crypto"
import { getUserByEmail, getAccountByUserId } from "@/modules/users/queries"
import { recordFailedLoginAttempt, clearFailedLoginAttempts } from "@/modules/users/service"
import { getAppSettings } from "@/modules/settings/queries"
import { sendTemplateEmailByName } from "@/modules/email-templates/service"
import { appConfig } from "@/config/app.config"
import { db } from "@/lib/db"
import { verifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { logActivityFromRequest } from "@/lib/activity-logger"

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

    const ip = getIp(req.headers)
    const rl = await rateLimit({ key: `sign-in:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 })
    if (!rl.success) {
      await logActivityFromRequest(req.headers, {
        action: "user.login_failed",
        resourceType: "user",
        metadata: { reason: "rate_limited", email },
      })
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    // 1. Find user + fetch settings in parallel (settings don't depend on user)
    const [user, settings] = await Promise.all([
      getUserByEmail(email),
      getAppSettings(),
    ])
    if (!user) return betterAuthHandler.POST(req)

    // 2. Check inactive
    if (!user.isActive) {
      await logActivityFromRequest(req.headers, {
        action: "user.login_failed",
        resourceType: "user",
        actorId: user.id,
        actorEmail: user.email,
        resourceId: user.id,
        metadata: { reason: "account_deactivated" },
      })
      return NextResponse.json(
        { error: "Your account has been deactivated. Contact an administrator." },
        { status: 403 }
      )
    }

    // 3. Check email verification (if enabled)
    if (settings?.emailVerificationEnabled && !user.emailVerified) {
      return NextResponse.json(
        { code: "EMAIL_NOT_VERIFIED", error: "Please verify your email before logging in." },
        { status: 403 }
      )
    }

    // 4. Check lockout
    if (settings?.lockoutEnabled && user.lockedUntil && user.lockedUntil > new Date()) {
      await logActivityFromRequest(req.headers, {
        action: "user.login_failed",
        resourceType: "user",
        actorId: user.id,
        actorEmail: user.email,
        resourceId: user.id,
        metadata: { reason: "account_locked" },
      })
      return NextResponse.json(
        { code: "ACCOUNT_LOCKED", error: "Account temporarily locked due to too many failed attempts.", unlocksAt: user.lockedUntil },
        { status: 403 }
      )
    }

    // 5. Unified password check (for lockout tracking and/or OTP)
    if ((settings?.lockoutEnabled || settings?.emailOtpEnabled) && password) {
      const account = await getAccountByUserId(user.id)
      if (!account?.password) return betterAuthHandler.POST(req)

      const valid = await verifyPassword({ hash: account.password, password })

      if (!valid) {
        if (settings.lockoutEnabled) {
          await recordFailedLoginAttempt(user.id, settings.maxFailedAttempts, settings.lockoutDurationMinutes)
        }
        await logActivityFromRequest(req.headers, {
          action: "user.login_failed",
          resourceType: "user",
          actorId: user.id,
          actorEmail: user.email,
          resourceId: user.id,
          metadata: { reason: "invalid_password" },
        })
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
      }

      // Correct password — reset counter
      if (settings.lockoutEnabled) {
        await clearFailedLoginAttempts(user.id)
      }

      if (settings.emailOtpEnabled) {
        // Generate 6-digit OTP, store in verifications table
        const otp = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
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

        // Fire-and-forget: don't block the response on SMTP delivery
        sendTemplateEmailByName("login-otp", user.email, {
          userName: user.name,
          otpCode: otp,
          appName: appConfig.name,
        }).catch((err) => console.error("[sign-in] OTP email failed:", err))

        return NextResponse.json({ code: "OTP_REQUIRED" }, { status: 200 })
      }
    }

    // All guards passed — delegate to better-auth and log success server-side
    const response = await betterAuthHandler.POST(req)
    if (response.status === 200) {
      logActivityFromRequest(req.headers, {
        action: "user.signed_in",
        resourceType: "user",
        actorId: user.id,
        actorEmail: user.email,
        resourceId: user.id,
      }).catch(() => {})
    }
    return response
  }

  // Registration guard
  if (url.pathname === "/api/auth/sign-up/email") {
    const ip = getIp(req.headers)
    const rl = await rateLimit({ key: `sign-up:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const settings = await getAppSettings()
    if (settings && !settings.registrationEnabled) {
      return NextResponse.json(
        { error: "Registration is currently disabled." },
        { status: 403 }
      )
    }
  }

  if (url.pathname === "/api/auth/forget-password") {
    const ip = getIp(req.headers)
    const rl = await rateLimit({ key: `password-reset:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }
  }

  return betterAuthHandler.POST(req)
}

export { POST }
export const GET = betterAuthHandler.GET
