import { type NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/auth"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { validateBrandingFile } from "@/lib/branding-validator"
import { saveFile, deleteFile } from "@/lib/storage"
import { getAppSettings } from "@/modules/settings/queries"
import { upsertBrandingSettings } from "@/modules/settings/service"
import { revalidateTag } from "next/cache"

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getIp(request.headers)
  const rl = await rateLimit({ key: `upload-favicon:${ip}`, limit: 10, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  // Auth
  let session: Awaited<ReturnType<typeof requirePermission>>
  try {
    session = await requirePermission("settings:update")
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const actor = session.user as { id: string; email: string }

  // Parse file
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Validate
  const validation = validateBrandingFile(buffer, "favicon")
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Clean up old file
  const settings = await getAppSettings()
  if (settings?.siteFaviconUrl) {
    await deleteFile(settings.siteFaviconUrl)
  }

  // Save new file
  const url = await saveFile(buffer, validation.ext)

  // Persist to DB
  await upsertBrandingSettings({ siteFaviconUrl: url }, actor.id, actor.email)
  revalidateTag("app-settings")
  revalidateTag("branding-settings")

  return NextResponse.json({ url })
}
