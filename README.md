# Admin Dashboard

A production-ready, reusable full-stack admin dashboard template built with Next.js App Router. Drop it into any project (SaaS, portfolio, internal tools) and rebrand in minutes.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Auth | better-auth |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Docker) |
| UI | shadcn/ui + Tailwind CSS v3 |
| Validation | Zod |
| Password | Bun.password (Argon2id) |

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Set up environment variables
cp .env.example .env
# Edit .env — generate secrets with:
#   BETTER_AUTH_SECRET: openssl rand -base64 32
#   ENCRYPTION_KEY:     openssl rand -hex 32

# 3. Start PostgreSQL
docker compose up -d

# 4. Run migrations
bun db:generate
bun db:migrate

# 5. Seed the database (creates super-admin)
bun db:seed

# 6. Start development server
bun dev
```

Visit `http://localhost:3000` — you'll be redirected to login.

Default credentials (change after first login!):
- Email: `super@admin.com`
- Password: `Admin1234!`

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:password@localhost:5432/admin_db` |
| `BETTER_AUTH_SECRET` | JWT signing secret (32+ chars) | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | `http://localhost:3000` |
| `ENCRYPTION_KEY` | AES-256 key for SMTP passwords (64 hex chars) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

## Architecture

See `CLAUDE.md` for full architecture documentation.

```
app/          — Routes, layouts, pages (Next.js App Router)
components/   — Shared UI components (shadcn/ui, layout, data-table)
modules/      — Business logic by domain (users, roles, smtp, email-templates, audit-logs)
lib/          — Shared utilities (db, auth, encryption, email, rate-limit)
db/           — Drizzle schema, migrations, seeds
config/       — App branding and feature flags
```

## Feature Modules

Enable or disable modules in `config/features.config.ts`:

```typescript
export const features = {
  smtp: true,          // SMTP settings + test connection
  emailTemplates: true, // Email template editor
  auditLogs: true,     // Activity audit trail
  roles: true,         // Role & permission management
  registration: true,  // Public /register page
}
```

Setting a feature to `false` hides its nav item and redirects its routes.

## Adding a New Module

1. Create `modules/<name>/` with `actions.ts`, `queries.ts`, `service.ts`, `schema.ts`, `types.ts`
2. Add DB table to `db/schema/<name>.ts` and re-export from `db/schema/index.ts`
3. Run `bun db:generate` then `bun db:migrate`
4. Add page at `app/(dashboard)/<name>/page.tsx`
5. Add nav item to `components/layout/sidebar-nav.tsx` (guard with feature flag)
6. Add feature flag to `config/features.config.ts`

## Branding

Edit `config/app.config.ts` to change the app name, logo, and description:

```typescript
export const appConfig = {
  name: "My App Admin",
  description: "Admin panel for My App",
  logo: "/logo.svg",         // put your logo in /public
  primaryColor: "blue",      // Tailwind color key
  supportEmail: "support@myapp.com",
}
```

For colors, update the CSS variables in `app/globals.css`.

## Database Commands

```bash
bun db:generate   # Generate migration from schema changes
bun db:migrate    # Run pending migrations
bun db:seed       # Seed super-admin + default roles
bun db:studio     # Open Drizzle Studio (visual DB browser)
```

## Docker

```bash
docker compose up -d   # Start PostgreSQL on port 5432
docker compose down    # Stop
docker compose down -v # Stop and remove data
```

## Security Notes

- Passwords hashed with Argon2id via `Bun.password`
- SMTP credentials encrypted with AES-256-GCM before DB storage
- Rate limiting on SMTP test endpoint (3/minute)
- Role-based access: `user < admin < super_admin`
- All mutations require `requireRole()` check in Server Actions

## Production Deployment

1. Set all environment variables in your hosting platform
2. Rotate `ENCRYPTION_KEY` requires re-encrypting stored SMTP passwords
3. Set `BETTER_AUTH_URL` to your production domain
4. `NEXT_PUBLIC_APP_URL` must match your deployment URL
5. The in-memory rate limiter in `lib/rate-limit.ts` should be replaced with Redis/Upstash for multi-instance deployments

## License

MIT
