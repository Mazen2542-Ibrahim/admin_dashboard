import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { getUserPermissions } from "@/lib/permissions"
import { canAccess } from "@/lib/utils"
import { appConfig } from "@/config/app.config"
import { sendTemplateEmailByName } from "@/modules/email-templates/service"
import { getAppSettings } from "@/modules/settings/queries"
import { logAudit } from "@/modules/audit-logs/service"

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: { user: { id: string; name: string; email: string }; url: string }) => {
      const settings = await getAppSettings()
      if (!settings?.emailVerificationEnabled) return
      await sendTemplateEmailByName("email-verification", user.email, {
        userName: user.name,
        verificationUrl: url,
        appName: appConfig.name,
      })
      await logAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "user.verification_email_sent",
        resourceType: "user",
        resourceId: user.id,
      })
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }: { user: { id: string; name: string; email: string }; url: string }) => {
      await sendTemplateEmailByName("forgot-password", user.email, {
        userName: user.name,
        resetUrl: url,
        appName: appConfig.name,
      })
      await logAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: "user.password_reset_requested",
        resourceType: "user",
        resourceId: user.id,
      })
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
    : [],
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }: { user: { id: string; name: string; email: string }; newEmail: string; url: string }) => {
        await sendTemplateEmailByName("email-verification", newEmail, {
          userName: user.name,
          verificationUrl: url,
          appName: appConfig.name,
        })
        await logAudit({
          actorId: user.id,
          actorEmail: user.email,
          action: "user.email_change_verification_sent",
          resourceType: "user",
          resourceId: user.id,
          metadata: { newEmail },
        })
      },
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
})

type Session = typeof auth.$Infer.Session

/** Get the current session from Server Components / Server Actions */
export async function getSession(): Promise<Session | null> {
  const { headers } = await import("next/headers")
  return auth.api.getSession({ headers: await headers() })
}

const roleHierarchy: Record<string, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
}

/**
 * Authorization guard for Server Actions.
 * Throws if the current user does not have the required minimum role.
 *
 * Role is read directly from the DB — better-auth's additionalFields are
 * not reliably present in the session.user shape across all call sites.
 */
export async function requireRole(
  minimumRole: "user" | "admin" | "super_admin"
): Promise<Session> {
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Unauthorized: not authenticated")
  }

  const [dbUser] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1)

  const userRole = dbUser?.role ?? "user"
  const userLevel = roleHierarchy[userRole] ?? 0
  const requiredLevel = roleHierarchy[minimumRole] ?? 0

  if (userLevel < requiredLevel) {
    throw new Error("You don't have permission to perform this action.")
  }

  return session
}

/**
 * Authorization guard for Server Actions.
 * Throws if the current user does not have the specified permission.
 * Supports the super_admin wildcard ("*").
 */
export async function requirePermission(permission: string): Promise<Session> {
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Unauthorized: not authenticated")
  }

  const perms = await getUserPermissions(session.user.id)

  if (!canAccess(Array.from(perms), permission)) {
    throw new Error("You don't have permission to perform this action.")
  }

  return session
}
