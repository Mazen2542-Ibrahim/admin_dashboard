import { db } from "@/lib/db"
import { verifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { makeSignature, verifyPassword } from "better-auth/crypto"
import { auth } from "@/lib/auth"
import { getUserByEmail } from "@/modules/users/queries"
import { logActivityFromRequest } from "@/lib/activity-logger"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  let body: { email?: string; otp?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { email, otp } = body
  if (!email || !otp) {
    return Response.json({ error: "Email and OTP are required" }, { status: 400 })
  }

  const ip = getIp(request.headers)
  const rl = await rateLimit({ key: `otp-verify:${ip}:${email}`, limit: 5, windowMs: 15 * 60 * 1000 })
  if (!rl.success) {
    return Response.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return Response.json({ error: "Invalid or expired OTP" }, { status: 401 })
  }

  const identifier = `otp-login-${user.id}`
  const [record] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.identifier, identifier))
    .limit(1)

  const otpValid = record && record.expiresAt >= new Date() && await verifyPassword({ hash: record.value, password: otp })
  if (!otpValid) {
    return Response.json({ error: "Invalid or expired OTP" }, { status: 401 })
  }

  // Delete the used OTP
  await db.delete(verifications).where(eq(verifications.identifier, identifier))

  // Create session through better-auth's internal adapter so the token format,
  // DB row, and cookie are all consistent with what better-auth expects.
  const authCtx = await auth.$context
  const session = await authCtx.internalAdapter.createSession(user.id)
  if (!session) {
    return Response.json({ error: "Failed to create session" }, { status: 500 })
  }

  await logActivityFromRequest(request.headers, {
    actorId: user.id,
    actorEmail: user.email,
    action: "user.signed_in_otp",
    resourceType: "user",
    resourceId: user.id,
  })

  // Compute the correct cookie name — better-auth uses the __Secure- prefix
  // whenever BETTER_AUTH_URL is HTTPS (which is always the case on Vercel).
  const betterAuthURL = process.env.BETTER_AUTH_URL ?? ""
  const isSecure = betterAuthURL
    ? betterAuthURL.startsWith("https://")
    : process.env.NODE_ENV === "production"
  const secureCookiePrefix = isSecure ? "__Secure-" : ""
  const cookieName = `${secureCookiePrefix}better-auth.session_token`

  // Sign the token and URI-encode the value, matching better-call's signCookieValue
  const signature = await makeSignature(session.token, authCtx.secret)
  const signedAndEncoded = encodeURIComponent(`${session.token}.${signature}`)

  const secureAttr = isSecure ? "; Secure" : ""
  const cookieHeader = `${cookieName}=${signedAndEncoded}; Path=/; HttpOnly; SameSite=Lax${secureAttr}; Expires=${session.expiresAt.toUTCString()}`

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieHeader,
    },
  })
}
