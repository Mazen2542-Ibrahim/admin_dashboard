import { db } from "@/lib/db"
import { users, accounts, sessions } from "@/db/schema"
import { eq, ilike, or, count, and, gt, gte, desc, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import type { UserListFilters } from "./types"

export async function getAllUsers(filters: UserListFilters = {}) {
  const { page = 1, limit = 20, search, role, status } = filters
  const offset = (Math.max(1, page) - 1) * limit

  const conditions = []
  if (search) {
    conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)))
  }
  if (role) conditions.push(eq(users.role, role))
  if (status === "active") conditions.push(eq(users.isActive, true))
  if (status === "inactive") conditions.push(eq(users.isActive, false))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(where)
    .limit(limit)
    .offset(offset)
}

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      lastLoginCountry: users.lastLoginCountry,
      lastLoginLatitude: users.lastLoginLatitude,
      lastLoginLongitude: users.lastLoginLongitude,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      themePreference: users.themePreference,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return user ?? null
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  return user ?? null
}

export async function getUserCount(filters: Pick<UserListFilters, "search" | "role" | "status"> = {}) {
  const { search, role, status } = filters
  const conditions = []
  if (search) {
    conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)))
  }
  if (role) conditions.push(eq(users.role, role))
  if (status === "active") conditions.push(eq(users.isActive, true))
  if (status === "inactive") conditions.push(eq(users.isActive, false))

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [result] = await db.select({ count: count() }).from(users).where(where)
  return result?.count ?? 0
}

export async function getAccountByUserId(userId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1)
  return account ?? null
}

export async function getNewUserCount(since: Date) {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, since))
  return result?.count ?? 0
}

export async function getActiveUserCount() {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.isActive, true)))
  return result?.count ?? 0
}

export async function getActiveSessionsByUserId(userId: string) {
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt))
}

export async function getLockedUserCount() {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(gt(users.lockedUntil, new Date()))
  return result?.count ?? 0
}

export const getUserStats = unstable_cache(
  async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekParam = sql.param(sevenDaysAgo.toISOString())
    const todayParam = sql.param(today.toISOString())
    const [result] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${users.isActive} = true)::int`,
        locked: sql<number>`count(*) filter (where ${users.lockedUntil} > now())::int`,
        newThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekParam}::timestamptz)::int`,
        newToday: sql<number>`count(*) filter (where ${users.createdAt} >= ${todayParam}::timestamptz)::int`,
      })
      .from(users)
    return result ?? { total: 0, active: 0, locked: 0, newThisWeek: 0, newToday: 0 }
  },
  ["user-stats"],
  { revalidate: 60, tags: ["user-stats"] }
)

export async function getCredentialAccount(userId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")))
    .limit(1)
  return account ?? null
}
