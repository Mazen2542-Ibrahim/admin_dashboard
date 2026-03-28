import { db } from "@/lib/db"
import { users, accounts } from "@/db/schema"
import { eq, ilike, or, count, and } from "drizzle-orm"
import type { UserListFilters } from "./types"

export async function getAllUsers(filters: UserListFilters = {}) {
  const { page = 1, limit = 20, search } = filters
  const offset = (page - 1) * limit

  const where = search
    ? or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    : undefined

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
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

export async function getUserCount(search?: string) {
  const where = search
    ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined
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
