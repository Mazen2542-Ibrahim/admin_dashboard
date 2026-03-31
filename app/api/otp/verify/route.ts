import { db } from "@/lib/db"
import { verifications, sessions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { makeSignature } from "better-auth/crypto"
import { getUserByEmail } from "@/modules/users/queries"
import { logAudit } from "@/modules/audit-logs/service"
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

  if (!record || record.value !== otp || record.expiresAt < new Date()) {
    return Response.json({ error: "Invalid or expired OTP" }, { status: 401 })
  }

  // Delete the used OTP
  await db.delete(verifications).where(eq(verifications.identifier, identifier))

  // Create session in DB
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId: user.id,
    token,
    expiresAt,
  })

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "user.signed_in_otp",
    resourceType: "user",
    resourceId: user.id,
  })

  // better-auth reads signed cookies — value must be `token.HMAC_signature`
  const secret = process.env.BETTER_AUTH_SECRET!
  const signature = await makeSignature(token, secret)
  const signedToken = `${token}.${signature}`

  const cookieValue = `better-auth.session_token=${signedToken}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieValue,
    },
  })
}
