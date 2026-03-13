# AGENTS.md — Open Attendance

## Project Overview

Open-source attendance tracking system with geofencing support. Built with
**Next.js 16** (App Router), **React 19**, **TypeScript 5.9**, and **Convex**
(serverless backend). Auth via **Better Auth**. Styled with **Tailwind CSS v4**.

## Commands

| Task | Command | Notes |
|------|---------|-------|
| Dev server | `bun run dev` | Starts Next.js dev server |
| Build | `bun run build` | Production build |
| Lint | `bun run lint` | Runs `biome check` |
| Format | `bun run format` | Runs `biome format --write` |
| Type-check | `bun run type-check` | Runs `tsgo --noEmit` (native TS) |
| All tests | `bun run test` | Runs `vitest` in watch mode |
| Single test file | `bunx vitest run convex/members.test.ts` | Runs one file without watch |
| Single test by name | `bunx vitest run -t "creates a new active member"` | Match by test description |
| Coverage | `bun run coverage` | `vitest run --coverage` |

**Package manager:** Bun (both `bun.lock` and `package-lock.json` exist; use `bun`).

## Project Structure

```
convex/                  # Convex backend — serverless functions + schema
  _generated/            # Auto-generated types (never edit)
  betterAuth/            # Better Auth Convex component
  lib/                   # Backend utilities (auth helpers, rate limits)
  schema.ts              # Database schema with validators + indexes
  *.test.ts              # Backend tests (co-located with source)
  test.helpers.ts        # Shared test factories (seedOrg, seedMember, etc.)
src/
  app/                   # Next.js App Router
    (app)/               # Authenticated routes (dashboard, members, sessions, reports)
    (marketing)/         # Public routes (landing, auth pages, legal)
    api/                 # API routes (auth catch-all, health)
  components/
    ui/                  # 52+ reusable UI primitives
    attendance/          # Attendance domain components
    auth/                # Auth forms
    navigation/          # Sidebar, navbar, footer
    providers/           # Auth + observability providers
    stats/               # Stat card components
  config/                # App constants (site metadata, nav links, content)
  hooks/                 # Custom React hooks
  lib/                   # Shared utilities (auth, monitoring, validation, utils)
  types/                 # Shared TypeScript types
```

## Code Style

### Formatter & Linter

**Biome** (not ESLint/Prettier). Config in `biome.json`.
- 2-space indentation
- Recommended rules + Next.js/React domains
- Auto import organizing enabled
- Run `bun run lint` before committing; run `bun run format` to auto-fix

### Imports

- **Absolute imports** via `@/` alias (maps to `src/`): `import { Button } from "@/components/ui/button"`
- **Relative imports** only within the same module (e.g., Convex files: `import { auth } from "./lib/auth"`)
- **Type-only imports** use `import type`: `import type { NextConfig } from "next"`
- Biome auto-organizes import order — do not manually sort

### File Naming

- **kebab-case** for all files: `stat-card.tsx`, `auth-client.ts`, `use-media-query.ts`
- Hooks: `use-{name}.ts` (e.g., `use-media-query.ts`)
- Tests: `{module}.test.ts` co-located with source in `convex/`
- Barrel exports via `index.ts` for component groups

### Component Conventions

- **PascalCase** names: `StatCard`, `SessionRow`, `ErrorFallback`
- Functional components only (no classes)
- Props defined with `interface` (not `type`): `interface StatCardProps { ... }`
- Client components must start with `"use client"` directive
- **Named exports** for components and utilities
- **Default exports** only for Next.js pages/layouts (framework requirement)

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- `type` for unions/aliases: `type AttendanceStatus = "excellent" | "good" | "needs-attention"`
- `interface` for object shapes (props, params, options)
- Use `satisfies` for config objects: `} satisfies AuthConfig`
- Use `as const` for constant configs: `export const siteConfig = { ... } as const`
- Convex types auto-generated in `convex/_generated/` — use `Id<"tableName">` for IDs

### Naming Conventions

- **camelCase** for functions and variables: `getAttendanceBadge`, `handleSubmit`
- **PascalCase** for types, interfaces, and components: `AttendanceStatus`, `StatCardProps`
- **kebab-case** for files and URL slugs

### Error Handling

- **Backend (Convex):** Throw `ConvexError` with descriptive messages:
  `throw new ConvexError("Not authenticated")`
- **Client-side:** Report to PostHog via `posthog.captureException(error)`
- **Form validation:** Zod `safeParse` pattern → show errors via `toast`
- **Error boundaries:** `error.tsx` and `global-error.tsx` with `ErrorFallback` component
- **404:** Custom `not-found.tsx` page

## Testing

**Framework:** Vitest v4 with `convex-test` | **Environment:** `edge-runtime`

Tests exist only for Convex backend functions in `convex/*.test.ts`. No frontend tests.

### Patterns

```ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { seedMember, seedOrg, type T } from "./test.helpers";

describe("members:create", () => {
  it("creates a new active member with given name and identifier", async () => {
    const t = convexTest(schema);           // fresh instance per test
    const orgId = await seedOrg(t);         // use factory helpers
    const memberId = await seedMember(t, { organizationId: orgId, name: "Alice" });
    const member = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(member!.name).toBe("Alice");
  });
});
```

- Each test creates a **fresh `convexTest(schema)`** instance (no shared state)
- Use factory helpers from `convex/test.helpers.ts`: `seedOrg()`, `seedMember()`, `seedMeeting()`, `seedRecord()`
- Test both success and error paths: `await expect(...).rejects.toThrow("...")`
- Describe blocks follow `module:functionName` convention
- Test mutations via `t.mutation(api.module.fn, {...})`, direct DB via `t.run(async (ctx) => { ... })`

## Architecture Notes

### Auth & Security

- **Better Auth** with Convex adapter for email/password + social (Google, Apple)
- **Row-Level Security (RLS):** All DB access scoped to caller's `organizationId` via custom `authedQuery`/`authedMutation` with `defaultPolicy: "deny"`
- **Rate limiting:** `checkIn` (30/min), `orgWrite` (60/min), `memberImport` (10/min fixed window)
- Auth gating in `(app)/layout.tsx` server-side via `isAuthenticated()` + redirect

### Route Groups

- `(app)/` — authenticated routes; wrapped in `AppProviders` (Convex + Auth)
- `(marketing)/` — public pages; uses `RootProviders` only (ThemeProvider + Toast, no Convex)
- `(auth)/` — login/signup pages nested under marketing layout

### Key Libraries

| Library | Purpose |
|---------|---------|
| `convex` + `convex-helpers` | Backend: DB, serverless functions, RLS, rate limiting |
| `better-auth` | Authentication (email/password, OAuth) |
| `@base-ui/react` | Headless UI component primitives |
| `lucide-react` | Icons |
| `class-variance-authority` | Component variant styles |
| `clsx` + `tailwind-merge` | Class name utility (`cn()` in `src/lib/utils.ts`) |
| `date-fns` | Date formatting/manipulation |
| `zod` (v4) | Schema validation (forms, env vars) |
| `posthog-js` / `posthog-node` | Analytics + error tracking |
| `@t3-oss/env-nextjs` | Runtime environment variable validation |

### Convex Patterns

- Schema in `convex/schema.ts` with Convex validators (`v.string()`, `v.number()`, etc.)
- Custom `authedQuery`/`authedMutation` in `convex/lib/auth.ts` wrap standard functions with auth + RLS
- Auth triggers handle side effects (org creation on signup, cascade delete on user removal)
- HTTP router in `convex/http.ts` for auth endpoints
- Indexes defined on all query patterns in schema
- Soft delete for members (`isActive` boolean); hard cascade delete for meetings
