import { db } from "@/lib/db"
import { users, accounts, sessions } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { logAudit } from "@/modules/audit-logs/service"
import { getUserByEmail } from "./queries"
import type { CreateUserInput, UpdateUserInput } from "./types"
import { hashPassword } from "better-auth/crypto"

export async function createUser(
  input: CreateUserInput,
  actorId?: string,
  actorEmail?: string
) {
  const [existing, passwordHash] = await Promise.all([
    getUserByEmail(input.email),
    hashPassword(input.password),
  ])
  if (existing) {
    throw new Error("A user with this email already exists")
  }

  const [newUser] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      role: input.role,
      emailVerified: false,
      isActive: true,
    })
    .returning()

  // Store password in accounts table (better-auth pattern)
  await db.insert(accounts).values({
    id: crypto.randomUUID(),
    userId: newUser.id,
    accountId: input.email,
    providerId: "credential",
    password: passwordHash,
  })

  await logAudit({
    actorId,
    actorEmail,
    action: "user.created",
    resourceType: "user",
    resourceId: newUser.id,
    metadata: { email: newUser.email, role: newUser.role },
  })

  return newUser
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actorId?: string,
  actorEmail?: string
) {
  if (input.email) {
    const existing = await getUserByEmail(input.email)
    if (existing && existing.id !== id) {
      throw new Error("A user with this email already exists")
    }
  }

  const [updated] = await db
    .update(users)
    .set(input)
    .where(eq(users.id, id))
    .returning()

  if (!updated) throw new Error("User not found")

  await logAudit({
    actorId,
    actorEmail,
    action: "user.updated",
    resourceType: "user",
    resourceId: id,
    metadata: input as Record<string, unknown>,
  })

  return updated
}

/** Soft delete — sets isActive to false */
export async function deleteUser(
  id: string,
  actorId?: string,
  actorEmail?: string
) {
  const [updated] = await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, id))
    .returning()

  if (!updated) throw new Error("User not found")

  await logAudit({
    actorId,
    actorEmail,
    action: "user.deactivated",
    resourceType: "user",
    resourceId: id,
    metadata: { email: updated.email },
  })

  return updated
}

/** Hard delete — permanently removes user. Super admin only. */
export async function hardDeleteUser(
  id: string,
  actorId?: string,
  actorEmail?: string
) {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning()

  if (!deleted) throw new Error("User not found")

  await logAudit({
    actorId,
    actorEmail,
    action: "user.deleted",
    resourceType: "user",
    resourceId: id,
    metadata: { email: deleted.email },
  })

  return deleted
}

export async function updateLastLoginAt(userId: string) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId))
}

export async function deleteSessionById(sessionId: string, expectedUserId: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)
  if (!session || session.userId !== expectedUserId) throw new Error("Session not found")
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function deleteAllSessionsByUserId(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

export async function recordFailedLoginAttempt(
  userId: string,
  maxAttempts: number,
  lockoutDurationMinutes: number
): Promise<void> {
  const [updated] = await db
    .update(users)
    .set({ failedLoginAttempts: sql`${users.failedLoginAttempts} + 1` })
    .where(eq(users.id, userId))
    .returning({ failedLoginAttempts: users.failedLoginAttempts, email: users.email })

  if (!updated) return

  if (updated.failedLoginAttempts >= maxAttempts) {
    const lockedUntil = new Date(Date.now() + lockoutDurationMinutes * 60 * 1000)
    await db.update(users).set({ lockedUntil }).where(eq(users.id, userId))
    await logAudit({
      action: "user.account_locked",
      resourceType: "user",
      resourceId: userId,
      metadata: { reason: "too_many_failed_attempts", failedLoginAttempts: updated.failedLoginAttempts, lockedUntil },
    })
  }
}

export async function clearFailedLoginAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId))
}

export async function unlockUserAccount(
  userId: string,
  actorId?: string,
  actorEmail?: string
): Promise<void> {
  const [updated] = await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(users.id, userId))
    .returning({ email: users.email })

  if (!updated) throw new Error("User not found")

  await logAudit({
    actorId,
    actorEmail,
    action: "user.account_unlocked",
    resourceType: "user",
    resourceId: userId,
    metadata: { email: updated.email },
  })
}

export async function resetUserPassword(
  userId: string,
  newPassword: string,
  actorId?: string,
  actorEmail?: string
) {
  const passwordHash = await hashPassword(newPassword)

  await db
    .update(accounts)
    .set({ password: passwordHash })
    .where(eq(accounts.userId, userId))

  await logAudit({
    actorId,
    actorEmail,
    action: "user.password_reset",
    resourceType: "user",
    resourceId: userId,
  })
}
