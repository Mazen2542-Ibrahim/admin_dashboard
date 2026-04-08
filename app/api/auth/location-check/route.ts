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
  const requireLocation = settings?.requireLocationForAuth ?? false
  const allowedCountries = settings?.allowedCountries ?? []

  // Always resolve country — needed for recording even when restriction is off
  const [coordCountry, serverCountry] = await Promise.all([
    latitude != null && longitude != null
      ? getCountryFromCoordinates(latitude, longitude)
      : Promise.resolve(null),
    Promise.resolve(getCountryFromHeaders(request.headers)).then(
      (h) => h ?? getCountryFromIp(ip)
    ),
  ])

  const effectiveCountry = coordCountry ?? serverCountry

  if (!requireLocation) {
    // Restriction not enforced — always allow, but return country for recording
    return NextResponse.json({ allowed: true, country: effectiveCountry })
  }

  // Enforce country allowlist
  const allowed = !effectiveCountry || isCountryAllowed(effectiveCountry, allowedCountries)

  if (!allowed) {
    await logActivityFromRequest(request.headers, {
      action: "auth.location_blocked",
      resourceType: "auth",
      metadata: { ip, coordCountry, serverCountry, allowedCountries },
    }).catch(() => {})
  }

  return NextResponse.json({
    allowed,
    country: effectiveCountry,
    ...(allowed ? {} : { reason: "country_blocked" }),
  })
}
