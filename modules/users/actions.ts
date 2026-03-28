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
} from "./schema"
import {
  createUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
  resetUserPassword,
} from "./service"
import { getUserByEmail } from "./queries"
import { logAudit } from "@/modules/audit-logs/service"

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
