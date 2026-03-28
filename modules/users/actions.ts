"use server"

import { revalidatePath } from "next/cache"
import { requireRole, requirePermission, getSession } from "@/lib/auth"
import { z } from "zod"
import { sendTemplateEmailByName } from "@/modules/email-templates/service"
import { appConfig } from "@/config/app.config"
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  resetPasswordSchema,
  sessionIdSchema,
} from "./schema"
import {
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  resetUserPassword,
  updateLastLoginAt,
  deleteSessionById,
  deleteAllSessionsByUserId,
} from "./service"
import { getUserByEmail, getUserById, getActiveSessionsByUserId } from "./queries"
import { logAudit } from "@/modules/audit-logs/service"
import { auth } from "@/lib/auth"

export async function createUserAction(formData: unknown) {
  try {
    const session = await requirePermission("users:create")
    const actor = session.user as { id: string; email: string }

    const parsed = createUserSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const user = await createUser(parsed.data, actor.id, actor.email)
    revalidatePath("/admin/users")
    return { success: true, data: { id: user.id } }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function updateUserAction(id: string, formData: unknown) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    const parsed = updateUserSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    if (actor.id === id) {
      if (parsed.data.role !== undefined) {
        return { error: { message: "You cannot change your own role" } }
      }
      if (parsed.data.isActive === false) {
        return { error: { message: "You cannot deactivate your own account" } }
      }
    }

    await updateUser(id, parsed.data, actor.id, actor.email)
    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${id}`)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function deleteUserAction(id: string) {
  try {
    const session = await requirePermission("users:delete")
    const actor = session.user as { id: string; email: string }

    if (actor.id === id) {
      return { error: { message: "You cannot deactivate your own account" } }
    }

    const idParsed = userIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await deleteUser(id, actor.id, actor.email)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function hardDeleteUserAction(id: string) {
  try {
    // Hard delete is always restricted to super_admin regardless of custom permissions
    const session = await requireRole("super_admin")
    const actor = session.user as { id: string; email: string }

    if (actor.id === id) {
      return { error: { message: "You cannot delete your own account" } }
    }

    const idParsed = userIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await hardDeleteUser(id, actor.id, actor.email)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function reactivateUserAction(id: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(id)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await updateUser(id, { isActive: true }, actor.id, actor.email)
    revalidatePath("/admin/users")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

/** Update the currently signed-in user's own name. Role/email/status are not changeable here. */
export async function updateProfileAction(formData: unknown) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return { error: { message: "You must be signed in" } }
    }

    const parsed = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
    }).safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    const actor = session.user as { id: string; email: string }
    await updateUser(actor.id, { name: parsed.data.name }, actor.id, actor.email)
    revalidatePath("/profile")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

/** Called client-side after a successful sign-in to write an audit entry */
export async function logSignInAction(): Promise<void> {
  try {
    const session = await getSession()
    if (!session?.user) return
    const user = session.user as { id: string; email: string }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "user.signed_in",
      resourceType: "user",
      resourceId: user.id,
    })
    await updateLastLoginAt(user.id).catch(() => {})
  } catch {
    // Never throw — sign-in must not fail because of audit logging
  }
}

/** Send welcome email and log registration after a new user signs up. No permission check — called after signup. */
export async function sendWelcomeEmailAction(email: string, name: string): Promise<void> {
  await sendTemplateEmailByName("welcome", email, {
    userName: name,
    appName: appConfig.name,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/dashboard`,
  })

  const user = await getUserByEmail(email)
  await logAudit({
    actorId: user?.id,
    actorEmail: email,
    action: "user.registered",
    resourceType: "user",
    resourceId: user?.id,
    metadata: { name },
  })
}

export async function changeEmailDirectAction(newEmail: string) {
  try {
    const session = await getSession()
    if (!session?.user) return { error: { message: "You must be signed in" } }

    const parsed = z.string().email("Invalid email address").safeParse(newEmail)
    if (!parsed.success) return { error: { message: "Invalid email address" } }

    const actor = session.user as { id: string; email: string }
    if (parsed.data === actor.email) {
      return { error: { message: "New email must be different from your current email" } }
    }

    await updateUser(actor.id, { email: parsed.data, emailVerified: false }, actor.id, actor.email)
    await logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.email_changed",
      resourceType: "user",
      resourceId: actor.id,
      metadata: { oldEmail: actor.email, newEmail: parsed.data },
    })
    revalidatePath("/profile")
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

/** Called client-side after a successful password change via better-auth */
export async function logPasswordChangedAction(): Promise<void> {
  try {
    const session = await getSession()
    if (!session?.user) return
    const user = session.user as { id: string; email: string }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "user.password_changed",
      resourceType: "user",
      resourceId: user.id,
    })
  } catch {
    // Never throw — must not break the UI flow
  }
}

/** Called client-side after better-auth initiates an email-change verification */
export async function logEmailChangeRequestedAction(newEmail: string): Promise<void> {
  try {
    const session = await getSession()
    if (!session?.user) return
    const user = session.user as { id: string; email: string }
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "user.email_change_requested",
      resourceType: "user",
      resourceId: user.id,
      metadata: { newEmail },
    })
  } catch {
    // Never throw — must not break the UI flow
  }
}

export async function resetPasswordAction(formData: unknown) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const parsed = resetPasswordSchema.safeParse(formData)
    if (!parsed.success) return { error: parsed.error.flatten() }

    await resetUserPassword(
      parsed.data.userId,
      parsed.data.newPassword,
      actor.id,
      actor.email
    )
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function getUserSessionsAction(userId: string) {
  try {
    await requirePermission("users:read")
    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }
    const data = await getActiveSessionsByUserId(userId)
    return { success: true, data }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function revokeUserSessionAction(sessionId: string, userId: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const sessionIdParsed = sessionIdSchema.safeParse(sessionId)
    if (!sessionIdParsed.success) return { error: { message: "Invalid session ID" } }

    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await deleteSessionById(sessionId, userId)
    await logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.session_revoked",
      resourceType: "user",
      resourceId: userId,
      metadata: { sessionId },
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function revokeAllUserSessionsAction(userId: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await deleteAllSessionsByUserId(userId)
    await logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.sessions_revoked_all",
      resourceType: "user",
      resourceId: userId,
    })
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function sendPasswordResetEmailAction(userId: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    const user = await getUserById(userId)
    if (!user) return { error: { message: "User not found" } }

    const { headers } = await import("next/headers")
    await auth.api.requestPasswordReset({
      body: {
        email: user.email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password`,
      },
      headers: await headers(),
    })
    await logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.password_reset_email_sent",
      resourceType: "user",
      resourceId: userId,
      metadata: { email: user.email },
    })
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function sendVerificationEmailAdminAction(userId: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    const user = await getUserById(userId)
    if (!user) return { error: { message: "User not found" } }

    // auth.api.sendVerificationEmail checks session.email === body.email,
    // which always fails for admin-triggered flows. Create the token directly instead.
    const { createEmailVerificationToken } = await import("better-auth/api")
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error("BETTER_AUTH_SECRET is not set")

    const token = await createEmailVerificationToken(secret, user.email)
    const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ""
    const callbackURL = encodeURIComponent("/")
    const url = `${baseURL}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`

    await sendTemplateEmailByName("email-verification", user.email, {
      userName: user.name,
      verificationUrl: url,
      appName: appConfig.name,
    })
    await logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user.verification_email_sent_by_admin",
      resourceType: "user",
      resourceId: userId,
      metadata: { email: user.email },
    })
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}

export async function markEmailVerifiedAction(userId: string) {
  try {
    const session = await requirePermission("users:update")
    const actor = session.user as { id: string; email: string }

    const idParsed = userIdSchema.safeParse(userId)
    if (!idParsed.success) return { error: { message: "Invalid user ID" } }

    await updateUser(userId, { emailVerified: true }, actor.id, actor.email)
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
  } catch (err) {
    return { error: { message: (err as Error).message } }
  }
}
