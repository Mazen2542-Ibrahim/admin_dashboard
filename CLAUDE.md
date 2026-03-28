# CLAUDE.md — Next.js Admin Dashboard Template

> This file provides AI coding assistants (Claude, Cursor, Copilot, etc.) with full project context, conventions, and architecture decisions. Read this before making any changes.

---

## 📌 Project Overview

A **production-ready, reusable full-stack admin dashboard** built with Next.js App Router. Designed to be dropped into any project (SaaS, portfolio, internal tools) with minimal reconfiguration.

**Primary goal:** A modular admin system you can copy into any project, enable/disable modules, and rebrand in minutes.

---

## 🧱 Core Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Rendering | SSR + React Server Components; `"use client"` only where required |
| Auth | `better-auth` |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Docker) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS v3 |
| Validation | Zod |
| Password Hashing | Argon2 |

---

## 🗂️ Folder Structure

```
/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth group: login, register
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/            # Protected dashboard group
│   │   ├── layout.tsx          # Sidebar + header layout
│   │   ├── page.tsx            # Dashboard home (stats)
│   │   ├── users/
│   │   ├── roles/
│   │   ├── smtp/
│   │   ├── email-templates/
│   │   └── audit-logs/
│   ├── api/                    # API routes (minimal — prefer Server Actions)
│   │   └── auth/[...all]/      # better-auth catch-all
│   └── layout.tsx              # Root layout
│
├── components/                 # Shared, dumb UI components
│   ├── ui/                     # shadcn/ui primitives (auto-generated)
│   ├── layout/                 # Sidebar, Header, UserMenu
│   ├── data-table/             # Reusable TanStack Table wrapper
│   ├── forms/                  # Reusable form field wrappers
│   └── modals/                 # Reusable modal/dialog wrappers
│
├── modules/                    # Feature modules (business logic)
│   ├── users/
│   │   ├── actions.ts          # Server Actions
│   │   ├── queries.ts          # DB read queries
│   │   ├── service.ts          # Business logic
│   │   ├── schema.ts           # Zod schemas
│   │   └── types.ts
│   ├── roles/
│   ├── smtp/
│   ├── email-templates/
│   └── audit-logs/
│
├── lib/                        # Shared utilities & singletons
│   ├── auth.ts                 # better-auth config + instance
│   ├── auth-client.ts          # Client-side auth helpers
│   ├── db.ts                   # Drizzle client singleton
│   ├── encryption.ts           # AES-256 encrypt/decrypt for SMTP secrets
│   ├── email.ts                # Email sending abstraction (uses SMTP module)
│   ├── rate-limit.ts           # Rate limiting utility
│   └── utils.ts                # cn(), formatDate(), etc.
│
├── db/                         # Database layer
│   ├── schema/
│   │   ├── index.ts            # Re-exports all schemas
│   │   ├── users.ts
│   │   ├── sessions.ts
│   │   ├── roles.ts
│   │   ├── permissions.ts
│   │   ├── smtp-settings.ts
│   │   ├── email-templates.ts
│   │   └── audit-logs.ts
│   ├── migrations/             # Drizzle auto-generated migrations
│   └── seeds/
│       └── index.ts            # Seed: super-admin, default roles
│
├── config/                     # Config-driven branding + feature flags
│   ├── app.config.ts           # App name, logo, colors
│   └── features.config.ts      # Enable/disable modules
│
├── middleware.ts               # Route protection (Next.js middleware)
├── docker-compose.yml
├── .env.example
└── drizzle.config.ts
```

---

## 🔐 Authentication & Authorization

### better-auth Setup

Config lives in `lib/auth.ts`. The catch-all API route is at `app/api/auth/[...all]/route.ts`.

```typescript
// lib/auth.ts pattern
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // plugins as needed
})
```

### RBAC Roles

| Role | Description |
|---|---|
| `super_admin` | Full access including system config |
| `admin` | User management, content, no system config |
| `user` | Read-only or limited access |

### Middleware

`middleware.ts` at project root. Protect all `/(dashboard)` routes. Redirect unauthenticated users to `/login`. Redirect authenticated users away from `/(auth)` routes.

```typescript
// middleware.ts pattern
export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') // or match group

  if (!session && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
```

---

## 🗄️ Database Schema Conventions

- Use Drizzle ORM with PostgreSQL dialect
- Schema files live in `db/schema/`, one file per domain
- All tables use `uuid` primary keys with `defaultRandom()`
- All tables include `createdAt` and `updatedAt` timestamps
- `updatedAt` uses `.$onUpdateFn(() => new Date())`

```typescript
// db/schema/users.ts example
import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["super_admin", "admin", "user"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdateFn(() => new Date()),
})
```

---

## 📐 Module Architecture Pattern

Every feature module in `modules/` follows this structure:

```
modules/users/
├── actions.ts      # "use server" — Server Actions called by UI
├── queries.ts      # Drizzle SELECT queries (pure, no side effects)
├── service.ts      # Business logic (called by actions, not directly by UI)
├── schema.ts       # Zod input validation schemas
└── types.ts        # TypeScript types/interfaces for this module
```

**Rule:** UI components call `actions.ts`. Actions validate with Zod, call `service.ts`. Services call `queries.ts` or write to DB via Drizzle directly. Never import `db` directly in components.

### Server Action pattern

```typescript
// modules/users/actions.ts
"use server"
import { revalidatePath } from "next/cache"
import { createUserSchema } from "./schema"
import { createUser } from "./service"
import { requireRole } from "@/lib/auth"

export async function createUserAction(formData: unknown) {
  await requireRole("admin") // throws if not authorized

  const parsed = createUserSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  await createUser(parsed.data)
  revalidatePath("/users")
  return { success: true }
}
```

---

## 🔒 Security Conventions

1. **Passwords** — Always hash with Argon2 (`argon2id`). Never store plaintext.
2. **SMTP credentials** — Encrypt with AES-256-GCM via `lib/encryption.ts` before storing in DB.
3. **Zod validation** — Every Server Action validates input before touching the DB.
4. **Rate limiting** — Apply to login, register, and test-SMTP endpoints via `lib/rate-limit.ts`.
5. **CSRF** — better-auth handles this; never bypass it.
6. **Role checks** — Use `requireRole()` helper at the top of every mutation Server Action.
7. **env vars** — Never commit `.env`. Use `.env.example`. Access via typed config only.

---

## 📧 SMTP Module

The SMTP settings are stored in the `smtp_settings` table (one active row). Sensitive fields (password) are encrypted at rest.

```typescript
// Encryption pattern in lib/encryption.ts
export function encrypt(plaintext: string): string  // returns "iv:ciphertext" hex string
export function decrypt(ciphertext: string): string  // reverses above
```

The email sending abstraction in `lib/email.ts`:
1. Fetches active SMTP config from DB
2. Decrypts credentials
3. Uses `nodemailer` to send
4. Logs the attempt to `audit_logs`

> **Note:** Bun ships with a built-in `Bun.password` API for Argon2. Use it instead of the `argon2` npm package to avoid native bindings:
> ```typescript
> // Hash
> const hash = await Bun.password.hash(password, { algorithm: "argon2id" })
> // Verify
> const valid = await Bun.password.verify(password, hash)
> ```

---

## 🧩 Feature Flags (Config-Driven)

```typescript
// config/features.config.ts
export const features = {
  smtp: true,
  emailTemplates: true,
  auditLogs: true,
  roles: true,
} satisfies Record<string, boolean>
```

Check `features.smtp` before rendering SMTP nav items or exposing SMTP routes. This allows disabling entire modules without deleting code.

---

## 🎨 Branding Config

```typescript
// config/app.config.ts
export const appConfig = {
  name: "Admin Dashboard",
  logo: "/logo.svg",        // place in /public
  primaryColor: "blue",     // Tailwind color key (used in tailwind.config.ts)
  description: "Admin panel for your app",
}
```

---

## 🏃 Common Commands

```bash
# Development
bun dev

# Database
bun db:generate     # Generate migration from schema changes
bun db:migrate      # Run pending migrations
bun db:seed         # Seed super-admin + default roles
bun db:studio       # Open Drizzle Studio

# Docker
docker compose up -d  # Start PostgreSQL
docker compose down   # Stop

# Build
bun run build
bun start
```

---

## 🧪 Audit Log Convention

All write operations (create/update/delete on users, roles, SMTP, templates) should call `logAudit()` from `modules/audit-logs/service.ts`:

```typescript
await logAudit({
  actorId: session.user.id,
  action: "user.created",
  resourceType: "user",
  resourceId: newUser.id,
  metadata: { email: newUser.email },
})
```

---

## ⚠️ Key Constraints & Decisions

- **No `"use client"` in Server Components** — Keep the boundary explicit. Wrap only the minimum needed.
- **No direct DB calls in `app/` routes** — Always go through `modules/*/queries.ts`.
- **shadcn/ui components are in `components/ui/`** — Don't edit generated files; extend via composition.
- **Migrations are committed** — Never delete migration files once applied.
- **Single SMTP config** — The schema supports only one active SMTP row. Use upsert pattern.
- **Drizzle `db` client** — Import from `@/lib/db`, never instantiate directly.
- **TypeScript strict mode is ON** — No `any`, no `@ts-ignore` without comment.

---

## 📦 Adding a New Module

1. Create `modules/<name>/` with `actions.ts`, `queries.ts`, `service.ts`, `schema.ts`, `types.ts`
2. Add DB table to `db/schema/<name>.ts` and re-export from `db/schema/index.ts`
3. Run `bun db:generate` then `bun db:migrate`
4. Add page at `app/(dashboard)/<name>/page.tsx`
5. Add nav item to `components/layout/sidebar.tsx` (guard with feature flag)
6. Add feature flag to `config/features.config.ts`

---

## 🐳 Docker

`docker-compose.yml` provides:
- `postgres` — PostgreSQL 16 on port `5432`
- Volume: `postgres_data` for persistence

All connection details come from `.env`:
```
DATABASE_URL=postgresql://admin:password@localhost:5432/admin_db
```

---

*Last updated: project scaffold — update this file whenever architecture decisions change.*
