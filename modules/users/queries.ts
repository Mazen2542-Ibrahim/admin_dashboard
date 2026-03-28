import { db } from "@/lib/db"
import { users, accounts, sessions } from "@/db/schema"
import { eq, ilike, or, count, and, gt, desc } from "drizzle-orm"
import type { UserListFilters } from "./types"

export async function getAllUsers(filters: UserListFilters = {}) {
  const { page = 1, limit = 20, search, role, status } = filters
  const offset = (page - 1) * limit

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
    .select()
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
