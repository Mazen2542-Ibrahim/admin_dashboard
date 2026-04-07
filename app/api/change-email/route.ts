import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifications } from "@/db/schema"
import { eq } from "drizzle-orm"
import { updateUser, deleteAllSessionsByUserId } from "@/modules/users/service"
import { logActivityFromRequest } from "@/lib/activity-logger"
import { getUserById } from "@/modules/users/queries"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/profile?emailChangeError=invalid", req.url))
  }

  const [row] = await db.select().from(verifications).where(eq(verifications.id, token)).limit(1)

  if (!row || !row.identifier.startsWith("email-change:") || row.expiresAt < new Date()) {
    if (row) await db.delete(verifications).where(eq(verifications.id, token))
    return NextResponse.redirect(new URL("/profile?emailChangeError=expired", req.url))
  }

  const userId = row.identifier.replace("email-change:", "")
  const newEmail = row.value

  const user = await getUserById(userId)
  if (!user) {
    return NextResponse.redirect(new URL("/profile?emailChangeError=invalid", req.url))
  }

  await updateUser(userId, { email: newEmail, emailVerified: true }, userId, user.email)
  await deleteAllSessionsByUserId(userId)
  await db.delete(verifications).where(eq(verifications.id, token))
  await logActivityFromRequest(req.headers, {
    actorId: userId,
    actorEmail: user.email,
    action: "user.email_changed",
    resourceType: "user",
    resourceId: userId,
    metadata: { oldEmail: user.email, newEmail },
  })

  return NextResponse.redirect(new URL("/profile?emailChanged=1", req.url))
}
