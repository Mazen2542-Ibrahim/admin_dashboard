import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getIp } from "@/lib/rate-limit"
import { getCountryFromHeaders, getCountryFromCoordinates, getCountryFromIp, isCountryAllowed } from "@/lib/geo"
import { getAppSettings } from "@/modules/settings/queries"
import { logActivityFromRequest } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  const ip = getIp(request.headers)
  const rl = await rateLimit({ key: `location-check:${ip}`, limit: 10, windowMs: 60_000 })
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

  // Coordinates are required — deny if the client didn't provide them
  if (latitude == null || longitude == null) {
    return NextResponse.json({ allowed: false, reason: "location_required" })
  }

  const { allowedCountries } = settings

  // Resolve country: GPS coordinates first, fall back to server-side IP/CDN
  const [coordCountry, serverCountry] = await Promise.all([
    getCountryFromCoordinates(latitude, longitude),
    Promise.resolve(getCountryFromHeaders(request.headers)).then(
      (h) => h ?? getCountryFromIp(ip)
    ),
  ])

  // GPS-resolved country takes precedence; IP is the fallback
  const effectiveCountry = coordCountry ?? serverCountry

  // If country can't be determined at all (geocoding + IP both failed),
  // allow through — the user already proved presence by granting GPS access.
  const allowed = !effectiveCountry || isCountryAllowed(effectiveCountry, allowedCountries)

  if (!allowed) {
    await logActivityFromRequest(request.headers, {
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
