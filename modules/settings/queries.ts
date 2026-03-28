import { db } from "@/lib/db"
import { appSettings } from "@/db/schema"
import type { AppSettings } from "./types"

export async function getAppSettings(): Promise<AppSettings | null> {
  const [settings] = await db.select().from(appSettings).limit(1)
  return settings ?? null
}
