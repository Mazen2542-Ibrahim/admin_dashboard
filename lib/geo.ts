/**
 * Geo utilities for location-based auth restrictions.
 * Priority for IP-based country: Vercel header → Cloudflare header → ip-api.com
 */

/** Extract country code from CDN/proxy headers (Vercel, Cloudflare). */
export function getCountryFromHeaders(
  headers: { get(name: string): string | null }
): string | null {
  const vercel = headers.get("x-vercel-ip-country")
  if (vercel && vercel.length === 2) return vercel.toUpperCase()

  const cloudflare = headers.get("cf-ipcountry")
  if (cloudflare && cloudflare.length === 2 && cloudflare !== "XX") return cloudflare.toUpperCase()

  return null
}

/** Reverse-geocode coordinates to a country code using Nominatim (OpenStreetMap). */
export async function getCountryFromCoordinates(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=3`
    const res = await fetch(url, {
      headers: { "User-Agent": "admin-dashboard/1.0" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { address?: { country_code?: string } }
    const code = data?.address?.country_code
    if (code && code.length === 2) return code.toUpperCase()
    return null
  } catch {
    return null
  }
}

/** Look up country code from IP via ip-api.com (free, no key, HTTP only). */
export async function getCountryFromIp(ip: string): Promise<string | null> {
  // Skip loopback, private, or unknown IPs
  if (
    !ip ||
    ip === "unknown" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return null
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { countryCode?: string }
    const code = data?.countryCode
    if (code && code.length === 2) return code.toUpperCase()
    return null
  } catch {
    return null
  }
}

/**
 * Returns true if the country is allowed.
 * - Empty allowedCountries → allow all.
 * - null country with non-empty list → block (unknown location).
 */
export function isCountryAllowed(
  country: string | null,
  allowedCountries: string[]
): boolean {
  if (allowedCountries.length === 0) return true
  if (!country) return false
  return allowedCountries.includes(country.toUpperCase())
}
