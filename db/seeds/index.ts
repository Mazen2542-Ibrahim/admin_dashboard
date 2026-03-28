/**
 * Database seed script — run with: bun run db/seeds/index.ts
 * Idempotent: safe to run multiple times.
 */
import { db } from "@/lib/db"
import { users, accounts, roles, permissions, emailTemplates, appSettings } from "@/db/schema"
import { eq } from "drizzle-orm"
// Use better-auth's own hash implementation so passwords are verified correctly at login
import { hashPassword } from "better-auth/crypto"

const SUPER_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "super@admin.com"
const SUPER_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!"
const SUPER_ADMIN_NAME = "Super Admin"

// Define default roles
const DEFAULT_ROLES = [
  {
    name: "super_admin",
    description: "Full access including system configuration",
    isSystem: true,
  },
  {
    name: "admin",
    description: "User management and content, no system config",
    isSystem: true,
  },
  {
    name: "user",
    description: "Allows the user to access their profile page and edit their own information",
    isSystem: true,
  },
  {
    name: "visitor",
    description: "Unauthenticated visitors — controls public resource access",
    isSystem: true,
  },
] as const

// Define permissions per role
const RESOURCES = ["users", "roles", "smtp", "email_templates", "audit_logs"] as const
const ACTIONS = ["create", "read", "update", "delete"] as const

const ROLE_PERMISSIONS: Record<string, Array<{ resource: string; action: string }>> = {
  // super_admin has implicit full access via wildcard — no DB permissions needed
  admin: [
    { resource: "dashboard", action: "access" },
    ...["users", "email_templates", "audit_logs"].flatMap((resource) =>
      ACTIONS.map((action) => ({ resource, action }))
    ),
    { resource: "roles", action: "read" },
    { resource: "smtp", action: "read" },
    { resource: "settings", action: "read" },
    { resource: "settings", action: "update" },
  ],
  user: [],
}

const EMAIL_TEMPLATES = [
  {
    name: "welcome",
    subject: "Welcome to {{appName}}!",
    variables: ["userName", "appName", "dashboardUrl"],
    htmlBody: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Welcome to {{appName}}, {{userName}}!</h1>
  <p style="color: #555; line-height: 1.6;">
    Your account has been created successfully. You can now access your dashboard.
  </p>
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
    Go to Dashboard
  </a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    If you didn't create this account, you can safely ignore this email.
  </p>
</body>
</html>`,
  },
  {
    name: "email-verification",
    subject: "Verify your email address",
    variables: ["userName", "verificationUrl", "appName"],
    htmlBody: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Verify your email</h1>
  <p style="color: #555; line-height: 1.6;">Hi {{userName}},</p>
  <p style="color: #555; line-height: 1.6;">
    Please verify your email address by clicking the button below. This link expires in 24 hours.
  </p>
  <a href="{{verificationUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
    Verify Email Address
  </a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    If you didn't create an account with {{appName}}, you can safely ignore this email.
  </p>
</body>
</html>`,
  },
  {
    name: "forgot-password",
    subject: "Reset your password",
    variables: ["userName", "resetUrl", "appName"],
    htmlBody: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Reset your password</h1>
  <p style="color: #555; line-height: 1.6;">Hi {{userName}},</p>
  <p style="color: #555; line-height: 1.6;">
    We received a request to reset your password. Click the button below to set a new password.
    This link expires in 1 hour.
  </p>
  <a href="{{resetUrl}}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
    Reset Password
  </a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    If you didn't request a password reset, you can safely ignore this email.
    Your password will remain unchanged.
  </p>
</body>
</html>`,
  },
  {
    name: "login-otp",
    subject: "Your login code",
    variables: ["userName", "otpCode", "appName"],
    htmlBody: `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Your login code</h1>
  <p style="color: #555; line-height: 1.6;">Hi {{userName}},</p>
  <p style="color: #555; line-height: 1.6;">Use the code below to complete your sign in. This code expires in 10 minutes.</p>
  <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">
      {{otpCode}}
    </span>
  </div>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    If you didn't request this code, someone may be trying to access your {{appName}} account.
    You can safely ignore this email — your account is not at risk.
  </p>
</body>
</html>`,
  },
]

async function seed() {
  console.log("🌱 Starting database seed...")

  // 1. Create default roles
  console.log("Creating default roles...")
  for (const role of DEFAULT_ROLES) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoNothing({ target: roles.name })
  }

  // 2. Insert permissions per role
  console.log("Creating role permissions...")
  const allRoles = await db.select().from(roles)
  for (const role of allRoles) {
    const perms = ROLE_PERMISSIONS[role.name]
    if (!perms) continue
    for (const perm of perms) {
      await db
        .insert(permissions)
        .values({ roleId: role.id, resource: perm.resource, action: perm.action })
        .onConflictDoNothing()
    }
  }

  // 3. Create super-admin user (idempotent — check first)
  console.log("Creating super-admin user...")
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, SUPER_ADMIN_EMAIL))
    .limit(1)

  if (existing.length === 0) {
    const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD)

    const [newUser] = await db
      .insert(users)
      .values({
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        emailVerified: true,
        role: "super_admin",
        isActive: true,
      })
      .returning()

    // Insert the account record (better-auth email/password pattern)
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: SUPER_ADMIN_EMAIL,
      providerId: "credential",
      password: passwordHash,
    })

    console.log(`✅ Super admin created: ${SUPER_ADMIN_EMAIL}`)
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.log("   Password: Admin1234! (default — set SEED_ADMIN_PASSWORD to override)")
    }
    console.log("   ⚠️  Change this password after first login!")
  } else {
    console.log(`ℹ️  Super admin already exists: ${SUPER_ADMIN_EMAIL}`)
  }

  // 4. Seed email templates
  console.log("Seeding email templates...")
  for (const template of EMAIL_TEMPLATES) {
    await db
      .insert(emailTemplates)
      .values({
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody,
        variables: template.variables,
        isActive: true,
      })
      .onConflictDoNothing({ target: emailTemplates.name })
  }
  console.log(`✅ ${EMAIL_TEMPLATES.length} email templates seeded`)

  // 5. Seed default app settings (only if no row exists)
  console.log("Seeding app settings...")
  const existingSettings = await db.select().from(appSettings).limit(1)
  if (existingSettings.length === 0) {
    await db.insert(appSettings).values({
      emailVerificationEnabled: false,
      registrationEnabled: true,
      emailOtpEnabled: false,
    })
    console.log("✅ Default app settings created")
  } else {
    console.log("ℹ️  App settings already exist")
  }

  console.log("✅ Seed completed successfully!")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
