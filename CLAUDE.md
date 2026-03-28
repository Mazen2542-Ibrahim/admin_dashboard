# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready, reusable full-stack admin dashboard built with Next.js App Router. Designed to be dropped into any project with minimal reconfiguration via feature flags and branding config.

**Stack:** Bun · Next.js 14+ App Router · TypeScript strict · better-auth v1.x · Drizzle ORM · PostgreSQL · shadcn/ui · Tailwind CSS v3 · Zod

---

## Commands

```bash
bun dev                 # Start dev server
bun run build           # Production build
bun lint                # ESLint

bun db:generate         # Generate migration after schema changes
bun db:migrate          # Apply pending migrations
bun db:seed             # Seed super-admin + default roles
bun db:studio           # Open Drizzle Studio

docker compose up -d    # Start PostgreSQL
docker compose down     # Stop PostgreSQL
```

> If `bun` is not in PATH, use `/Users/mogh/.bun/bin/bun`.

---

## Architecture

### Route Layout

```
app/
├── (auth)/              # Login, register — no shell, minimal layout
├── admin/(dashboard)/   # Protected dashboard — AppShell (sidebar + header)
│   └── layout.tsx       # Checks session + dashboard:access permission; redirects to /profile if lacking
├── profile/             # Accessible to all authenticated users — ProfileShell
│   └── layout.tsx       # Checks session only; no dashboard:access required
└── api/auth/[...all]/   # better-auth catch-all handler
```

Users without `dashboard:access` are server-redirected from `/admin/*` → `/profile`.

### Module Pattern

Every feature in `modules/` has five files with strict layering:

```
UI components → actions.ts ("use server") → service.ts → queries.ts → db
```

- **`actions.ts`** — validates with Zod, calls `requirePermission()`/`requireRole()`, delegates to service, calls `revalidatePath()`
- **`service.ts`** — business logic, writes to DB via Drizzle, calls `logAudit()`
- **`queries.ts`** — pure SELECT queries, no side effects
- **`schema.ts`** — Zod schemas for input validation
- **`types.ts`** — TypeScript interfaces

Never import `db` in `app/` routes or UI components. Never call service functions directly from UI.

### Auth & Authorization

`lib/auth.ts` holds the better-auth instance. Two guards used in Server Actions:

- `requirePermission("resource:action")` — checks the user's role permissions from the `permissions` table; `super_admin` gets wildcard `"*"`
- `requireRole("admin")` — hierarchical check (`user < admin < super_admin`)

Permission strings follow `"resource:action"` format (e.g. `"users:update"`, `"audit_logs:read"`). `super_admin` bypasses all checks via wildcard. Custom roles are stored in the `roles` + `permissions` tables.

### Password Hashing

Use `better-auth/crypto`'s `hashPassword` (not `Bun.password`) — passwords are stored in the `accounts` table, not `users`, matching better-auth's credential provider pattern.

```typescript
import { hashPassword } from "better-auth/crypto"
const hash = await hashPassword(password)
```

### Database Schema

- All tables: `uuid` PKs with `defaultRandom()`, `createdAt`/`updatedAt` timestamps, `updatedAt` uses `.$onUpdateFn(() => new Date())`
- **Exception:** `sessions.id` is `text` (not uuid) — better-auth owns this table
- `users.role` is `text`, not an enum — supports arbitrary custom role names
- Passwords live in `accounts` table (`providerId: "credential"`), not `users`

### Client-Side Session Pattern

`useSession()` from `better-auth/react` starts as `null` during SSR and initial hydration. Any component that renders user data must receive an `initialUser` prop from the server layout to avoid a blank render:

```typescript
// Server layout passes user down the tree:
const { id, name, email, image } = session.user
return <AppShell initialUser={{ id, name, email, image }}>...</AppShell>

// Client component uses initialUser as fallback:
const { data: session } = useSession()
const user = session?.user ?? initialUser
```

`AppShell` → `Header` → `UserMenu` and `ProfileShell` → `UserMenu` both follow this pattern.

### SMTP & Email

SMTP credentials are AES-256-GCM encrypted at rest via `lib/encryption.ts` (stores `"iv:ciphertext"` hex). Only one active SMTP row exists; use upsert. `lib/email.ts` fetches config, decrypts, and sends via nodemailer. All email sends are logged to `audit_logs`.

---

## better-auth v1.x Gotchas

These differ from the docs or older versions:

- **Password reset email:** `auth.api.requestPasswordReset({ body: { email, redirectTo } })` — the method is NOT `forgetPassword`
- **Verification email (admin-triggered):** `auth.api.sendVerificationEmail` enforces `session.user.email === body.email`, so it cannot be called for another user. For admin flows, generate the token manually:
  ```typescript
  import { createEmailVerificationToken } from "better-auth/api"
  const token = await createEmailVerificationToken(process.env.BETTER_AUTH_SECRET!, userEmail)
  const url = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent("/")}`
  // then send via sendTemplateEmailByName(...)
  ```
- **`inferAdditionalFields`** is TypeScript-only — no runtime effect; the session always includes `role` and `isActive` regardless
- **Session cookie cache:** better-auth may serve session from a signed cookie cache without hitting the DB; invalidation requires the cookie to expire or be cleared

---

## Key Constraints

- **No direct DB calls in `app/`** — always go through `modules/*/queries.ts`
- **Audit every mutation** — call `logAudit()` from `modules/audit-logs/service.ts` in every service function that writes data
- **Feature flags** — check `config/features.config.ts` before rendering nav items or exposing routes for optional modules
- **Migrations are committed** — never delete applied migration files from `db/migrations/`
- **Single SMTP config row** — always upsert, never insert a second row
- **shadcn/ui** — components in `components/ui/` are generated; extend via composition, don't edit directly

---

## Adding a New Module

1. Create `modules/<name>/` with all five files
2. Add `db/schema/<name>.ts` and re-export from `db/schema/index.ts`
3. Run `bun db:generate` then `bun db:migrate`
4. Add page at `app/admin/(dashboard)/<name>/page.tsx`
5. Add nav item to `components/layout/sidebar.tsx` guarded by feature flag
6. Add feature flag to `config/features.config.ts`
