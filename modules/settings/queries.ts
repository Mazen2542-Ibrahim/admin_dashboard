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

export type BrandingSettings = {
  siteName: string | null
  siteLogoUrl: string | null
  siteFaviconUrl: string | null
}

export const getBrandingSettings = unstable_cache(
  async (): Promise<BrandingSettings> => {
    const [row] = await db
      .select({
        siteName: appSettings.siteName,
        siteLogoUrl: appSettings.siteLogoUrl,
        siteFaviconUrl: appSettings.siteFaviconUrl,
      })
      .from(appSettings)
      .limit(1)
    return row ?? { siteName: null, siteLogoUrl: null, siteFaviconUrl: null }
  },
  ["branding-settings"],
  { tags: ["branding-settings"], revalidate: 3600 }
)
