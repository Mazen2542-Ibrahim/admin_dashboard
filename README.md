# Admin Dashboard

A production-ready, reusable full-stack admin dashboard built with Next.js App Router. Drop it into any project — SaaS, internal tools, portfolio — and rebrand in minutes via a single config file and feature flags.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Auth | better-auth v1.x |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| UI | shadcn/ui + Tailwind CSS v3 |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Email | Nodemailer |

---

## Features

- **Authentication** — Email/password login, email verification, password reset, OTP two-factor login
- **User Management** — Create, edit, deactivate, and hard-delete users; admin-triggered password reset and verification emails
- **Role & Permission System** — Hierarchical roles (`user < admin < super_admin`), granular per-resource permissions stored in the database, custom roles
- **Account Security** — Per-account lockout after configurable failed login attempts, manual unlock by admins
- **Audit Logs** — Immutable activity trail for every mutation, with configurable retention and manual purge
- **Email Templates** — In-app HTML editor for transactional emails (welcome, verification, password reset, OTP)
- **SMTP Configuration** — Live SMTP setup with encrypted credential storage and test-send
- **Rate Limiting** — IP-level throttling on sign-in (10/15 min), sign-up (5/hr), password reset (5/15 min), and OTP verify (5/15 min)
- **Feature Flags** — Any module can be disabled with a single boolean; its nav item and routes disappear automatically
- **Branding Config** — App name, logo, colors, and support email in one file

---

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) (for PostgreSQL)

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy and fill in environment variables
cp .env.example .env
# See the Environment Variables section below

# 3. Start PostgreSQL
docker compose up -d

# 4. Run migrations
bun db:migrate

# 5. Seed the database (creates super-admin + default roles)
bun db:seed

# 6. Start the dev server
bun dev
```

Open `http://localhost:3000` — you'll be redirected to the login page.

**Default credentials** (change immediately after first login):
- Email: `super@admin.com`
- Password: `Admin1234!`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in every value before running.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — e.g. `postgresql://admin:password@localhost:5432/admin_db` |
| `BETTER_AUTH_SECRET` | Secret used to sign sessions — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Full base URL of the app — e.g. `http://localhost:3000` (no trailing slash) |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM SMTP encryption — generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL used in client-side code |
| `SEED_ADMIN_EMAIL` | *(optional)* Override the default super-admin email during seeding |
| `SEED_ADMIN_PASSWORD` | *(optional)* Override the default super-admin password during seeding |

---

## Commands

```bash
bun dev             # Start dev server (http://localhost:3000)
bun run build       # Production build
bun lint            # ESLint

bun db:generate     # Generate a new migration from schema changes
bun db:migrate      # Apply pending migrations
bun db:seed         # Seed super-admin + default roles + email templates
bun db:studio       # Open Drizzle Studio (visual DB browser)

docker compose up -d    # Start PostgreSQL on port 5432
docker compose down     # Stop PostgreSQL
docker compose down -v  # Stop and wipe all data
```

---

## Project Structure

```
app/
├── (auth)/                   # Login, register, forgot/reset password, verify email
├── admin/(dashboard)/        # Protected dashboard (requires session + dashboard:access)
│   ├── dashboard/
│   ├── users/                # User list + individual user detail/edit
│   ├── roles/                # Role & permission management
│   ├── audit-logs/           # Activity trail
│   ├── smtp/                 # SMTP settings
│   ├── email-templates/      # Template editor
│   └── settings/             # App-wide settings
├── profile/                  # Available to all authenticated users
└── api/
    ├── auth/[...all]/        # better-auth catch-all handler (enhanced with custom guards)
    ├── otp/verify/           # OTP verification endpoint
    └── change-email/         # Email change confirmation endpoint

modules/                      # Business logic, one directory per domain
├── audit-logs/
├── email-templates/
├── roles/
├── settings/
├── smtp/
└── users/

db/
├── schema/                   # Drizzle table definitions
├── migrations/               # Committed migration files (never delete)
└── seeds/                    # Seed script

lib/                          # Shared utilities
├── auth.ts                   # better-auth instance
├── auth-client.ts            # Client-side auth hooks
├── db.ts                     # Drizzle connection
├── email.ts                  # Nodemailer send helper
├── encryption.ts             # AES-256-GCM for SMTP credentials
├── permissions.ts            # requirePermission / requireRole guards
└── rate-limit.ts             # In-memory rate limiter

config/
├── app.config.ts             # Branding (name, logo, colors)
└── features.config.ts        # Feature flags
```

Every module follows a strict five-layer pattern:

```
UI → actions.ts (Server Actions) → service.ts → queries.ts → db
```

Server Actions validate with Zod, check permissions, call the service, and revalidate the path. Services write to the DB via Drizzle and call `logAudit()`. Queries are pure SELECTs. The `db` object is never imported outside `modules/`.

---

## Feature Flags

Enable or disable modules in `config/features.config.ts`:

```typescript
export const features = {
  smtp: true,
  emailTemplates: true,
  auditLogs: true,
  roles: true,
  registration: true,
  settings: true,
}
```

Setting a flag to `false` removes the nav item and makes the route unreachable without any other changes.

---

## Branding

Edit `config/app.config.ts`:

```typescript
export const appConfig = {
  name: "My App",
  description: "Admin panel for My App",
  logo: "/logo.svg",           // place your logo in /public
  primaryColor: "blue",
  supportEmail: "support@myapp.com",
}
```

For custom colors, update the CSS variables in `app/globals.css`.

---

## Roles & Permissions

Three built-in roles ship with the seed:

| Role | Access |
|---|---|
| `user` | Profile page only |
| `admin` | Full dashboard access except system config |
| `super_admin` | Unrestricted — wildcard `"*"` permission bypass |

Custom roles can be created from the Roles page. Permissions follow the `"resource:action"` format (e.g. `"users:update"`, `"audit_logs:read"`).

Two guards are used in Server Actions:

```typescript
await requirePermission("users:update")  // Checks permissions table; super_admin bypasses
await requireRole("admin")               // Hierarchical check
```

---

## Adding a New Module

1. Create `modules/<name>/` with `actions.ts`, `service.ts`, `queries.ts`, `schema.ts`, `types.ts`
2. Add a table to `db/schema/<name>.ts` and re-export it from `db/schema/index.ts`
3. Run `bun db:generate` then `bun db:migrate`
4. Add a page at `app/admin/(dashboard)/<name>/page.tsx`
5. Add a nav item to `components/layout/sidebar.tsx` guarded by a feature flag
6. Add the feature flag to `config/features.config.ts`

---

## Security

- **Passwords** — hashed with Argon2id via `better-auth/crypto`
- **SMTP credentials** — encrypted at rest with AES-256-GCM (`lib/encryption.ts`)
- **OTP generation** — uses `crypto.getRandomValues()` (CSPRNG), not `Math.random()`
- **Rate limiting** — IP-level throttling on all auth endpoints with `Retry-After` headers
- **Account lockout** — configurable failed-attempt threshold with timed unlock
- **Session security** — better-auth signed cookie cache; invalidation requires cookie expiry or clearance

---

## Production Deployment

1. Set all environment variables in your hosting platform
2. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain (HTTPS)
3. Rotating `ENCRYPTION_KEY` requires re-encrypting any stored SMTP passwords
4. **Replace the in-memory rate limiter** in `lib/rate-limit.ts` with Redis/Upstash for multi-instance deployments — the current store is per-process

---

## License

MIT
