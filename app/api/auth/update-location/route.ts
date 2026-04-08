import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { country?: string | null; latitude?: number | null; longitude?: number | null } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      lastLoginCountry: body.country ?? null,
      lastLoginLatitude: body.latitude ?? null,
      lastLoginLongitude: body.longitude ?? null,
    })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true })
}
