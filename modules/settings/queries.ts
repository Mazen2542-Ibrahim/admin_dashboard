import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { appSettings } from "@/db/schema"
import type { AppSettings } from "./types"

export const getAppSettings = unstable_cache(
  async (): Promise<AppSettings | null> => {
    const [settings] = await db.select().from(appSettings).limit(1)
    return settings ?? null
  },
  ["app-settings"],
  { tags: ["app-settings"], revalidate: 300 }
)
