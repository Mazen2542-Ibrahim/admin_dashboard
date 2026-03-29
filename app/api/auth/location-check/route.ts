import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { getCountryFromHeaders, getCountryFromCoordinates, getCountryFromIp, isCountryAllowed } from "@/lib/geo"
import { getAppSettings } from "@/modules/settings/queries"
import { logAudit } from "@/modules/audit-logs/service"

export async function POST(request: NextRequest) {
  const ip = getIp(request.headers)
  const rl = rateLimit({ key: `location-check:${ip}`, limit: 10, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let body: { latitude?: number; longitude?: number } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { latitude, longitude } = body

  const settings = await getAppSettings()
  if (!settings?.requireLocationForAuth) {
    return NextResponse.json({ allowed: true })
  }

  const { allowedCountries } = settings

  // Resolve server-side (IP/CDN) country
  const serverCountry =
    getCountryFromHeaders(request.headers) ?? (await getCountryFromIp(ip))

  // Resolve coordinate country (only if provided)
  let coordCountry: string | null = null
  if (latitude != null && longitude != null) {
    coordCountry = await getCountryFromCoordinates(latitude, longitude)
  }

  const effectiveCountry = coordCountry ?? serverCountry

  const coordAllowed = latitude != null && longitude != null
    ? isCountryAllowed(coordCountry, allowedCountries)
    : true
  const serverAllowed = !serverCountry || isCountryAllowed(serverCountry, allowedCountries)

  const allowed = coordAllowed && serverAllowed

  if (!allowed) {
    await logAudit({
      action: "auth.location_blocked",
      resourceType: "auth",
      metadata: {
        ip,
        coordCountry,
        serverCountry,
        allowedCountries,
      },
    }).catch(() => {})
  }

  return NextResponse.json({
    allowed,
    country: effectiveCountry,
    ...(allowed ? {} : { reason: "country_blocked" }),
  })
}
