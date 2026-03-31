/**
 * Rate limiter with Redis (Upstash) support for production and
 * in-memory fallback for local development.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable
 * distributed rate limiting across all server instances.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// ── Redis-backed rate limiter (production) ────────────────────────────────────

function createRedisLimiter(windowMs: number, limit: number) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000} s`),
    prefix: "rl",
  })
}

// ── In-memory fallback (development) ─────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Purge expired entries to prevent unbounded memory growth
function purgeExpired() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  // Cheap O(n) cleanup — only runs in dev
  if (store.size > 500) purgeExpired()

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ── Public API ────────────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Unique key per action+identifier, e.g. `login:${ip}` */
  key: string
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

const useRedis =
  typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0

// Cache limiter instances so we don't recreate on every call
const limiterCache = new Map<string, Ratelimit>()

export async function rateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  if (!useRedis) {
    return inMemoryRateLimit(key, limit, windowMs)
  }

  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = createRedisLimiter(windowMs, limit)
    limiterCache.set(cacheKey, limiter)
  }

  const { success, remaining, reset } = await limiter.limit(key)
  return { success, remaining, resetAt: reset }
}

/** Extract the best available client IP from a Next.js / Node request headers object. */
export function getIp(headers: { get(name: string): string | null }): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  )
}
