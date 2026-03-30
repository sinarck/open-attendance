# AGENTS.md — Open Attendance

## Project Overview

Open-source attendance tracking system with geofencing support. Built with
**Next.js 16** (App Router), **React 19**, **TypeScript 5.9**, and **Convex**
(serverless backend). Auth via **Better Auth**. Styled with **Tailwind CSS v4**.

## Commands

| Task                | Command                                        | Notes                                    |
| ------------------- | ---------------------------------------------- | ---------------------------------------- |
| Dev server          | `vp run dev`                                   | Runs the repo's custom dev script        |
| Build               | `vp run build`                                 | Production build                         |
| Lint                | `vp lint`                                      | Runs Oxlint through Vite+                |
| Format              | `vp fmt . --write`                             | Runs Oxfmt through Vite+                 |
| Check               | `vp check`                                     | Runs format, lint, and type-aware checks |
| Type-check          | `vp run type-check`                            | Runs `tsgo --noEmit`                     |
| All tests           | `vp test`                                      | Runs Vitest through Vite+                |
| Single test file    | `vp test run convex/members.test.ts`           | Runs one file without watch              |
| Single test by name | `vp test run -t "creates a new active member"` | Match by test description                |
| Coverage            | `vp test run --coverage`                       | Runs coverage directly through Vite+     |

**Package manager and task runner:** Use `vp`. It wraps dependency management and tool execution for this repo. Do not use `bun`, `pnpm`, `npm`, or `yarn` directly.

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
    (app)/               # Authenticated routes (dashboard, members, meetings, reports)
    (marketing)/         # Public routes (landing, auth pages, legal)
    api/                 # API routes (auth catch-all)
    ui/                  # App-level font and UI wiring used by layouts
    */_components/       # Route-private component groups only when a route has multiple private components
  components/
    ui/                  # Reusable UI primitives
    auth/                # Shared auth-specific UI (non-route-private)
    navigation/          # Sidebar, navbar, footer
  config/                # App constants (site metadata, nav links, content)
  hooks/                 # Custom React hooks
  lib/                   # Shared utilities (auth, monitoring, validation, utils)
    auth/                # Better Auth + route guard server/client helpers
  providers/             # Root, Convex, and observability providers
  types/                 # Shared TypeScript types
```

## Code Style

### Formatter & Linter

**Oxlint + Oxfmt via Vite+**. Keep lint and formatter config in `vite.config.ts`.

- 2-space indentation
- Run `vp lint` for lint-only checks
- Run `vp fmt . --write` to format
- Run `vp check` for the normal combined static-check pass

### Imports

- **Absolute imports** via `@/` alias (maps to `src/`): `import { Button } from "@/components/ui/button"`
- **Relative imports** only within the same module (e.g., Convex files: `import { auth } from "./lib/auth"`)
- **Type-only imports** use `import type`: `import type { NextConfig } from "next"`
- Let the configured tooling handle import cleanup; do not churn imports by hand
- Prefer direct imports over barrels.

### File Naming

- **kebab-case** for all files: `stat-card.tsx`, `auth-client.ts`, `use-media-query.ts`
- Hooks: `use-{name}.ts` (e.g., `use-media-query.ts`)
- Tests: `{module}.test.ts` co-located with source in `convex/`
- Avoid barrel exports. Import from the concrete module path instead.
- Route-private components should live next to the route by default. Use `route/_components` only when a route subtree has multiple private components worth grouping.

### Component Conventions

- **PascalCase** names: `StatCard`, `SessionRow`, `ErrorFallback`
- Functional components only (no classes)
- Props defined with `interface` (not `type`): `interface StatCardProps { ... }`
- Client components must start with `"use client"` directive
- **Named exports** for components and utilities
- **Default exports** only for Next.js pages/layouts (framework requirement)
- Prefer one component per file outside `src/components/ui`; tiny rename-only wrappers should usually be inlined instead.
- Prefer shared primitives and composition over bespoke one-off UI. If a design-system component already exists, use it.

### TypeScript

- **Strict mode** enabled in `tsconfig.json`
- `type` for unions/aliases: `type AttendanceStatus = "excellent" | "good" | "needs-attention"`
- `interface` for object shapes (props, params, options)
- Use `satisfies` for config objects: `} satisfies AuthConfig`
- Use `as const` for constant configs: `export const siteConfig = { ... } as const`
- Convex types auto-generated in `convex/_generated/` — use `Id<"tableName">` for IDs
- Shared app/domain types belong in `src/types`; keep local component prop types in the file that owns them
- Assume declared types are correct. Do not add defensive fallbacks like `?? ""`, `?? null`, or optional chaining against values that the type system already guarantees.
- Prefer direct destructuring and direct property access over alias variables when they do not improve readability.

### Simplicity & Abstractions

- Bias toward the fewest lines of code that keep the intent obvious.
- Prefer inlining single-use logic over creating a helper, hook, or utility file.
- Be especially cautious when adding files to `src/lib`. Code in `lib` should contain genuinely shared behavior, not rename-only wrappers or single-call-site indirection.
- Add a new abstraction only when it clearly reduces duplication across multiple consumers or isolates non-trivial behavior.
- Avoid “defensive programming” against your own schemas and validated inputs. If a value has already been validated, use it directly.
- Avoid vague architectural buckets such as `features/` unless there is a real module boundary.

### Naming Conventions

- **camelCase** for functions and variables: `getAttendanceBadge`, `handleSubmit`
- **PascalCase** for types, interfaces, and components: `AttendanceStatus`, `StatCardProps`
- **kebab-case** for files and URL slugs
- Long-lived constant/default-data objects belong in `src/config` with explicit names.

### Error Handling

- **Backend (Convex):** Throw `ConvexError` with descriptive messages:
  `throw new ConvexError("Not authenticated")`
- **Client-side:** Report to PostHog via `posthog.captureException(error)`
- **Form validation:** Zod `safeParse` pattern → show errors via `toast`
- **Error boundaries:** `error.tsx` and `global-error.tsx` with `ErrorFallback` component
- **404:** Custom `not-found.tsx` page

## Testing

**Framework:** Vitest v4 via Vite+ with `convex-test` | **Environment:** `edge-runtime`

Tests exist only for Convex backend functions in `convex/*.test.ts`. No frontend tests.

### Patterns

```ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vite-plus/test";
import schema from "./schema";
import { seedMember, seedOrg, type T } from "./test.helpers";

describe("members:create", () => {
  it("creates a new active member with given name and identifier", async () => {
    const t = convexTest(schema); // fresh instance per test
    const orgId = await seedOrg(t); // use factory helpers
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

- **Better Auth** with Convex adapter for email/password auth
- **Row-Level Security (RLS):** All DB access scoped to caller's `organizationId` via custom `authedQuery`/`authedMutation` with `defaultPolicy: "deny"`
- **Rate limiting:** `checkIn` (30/min), `orgWrite` (60/min), `memberImport` (10/min fixed window)
- Auth gating lives in server-side route guards under `src/lib/auth/guards.ts`
- `src/proxy.ts` is only an optimistic cookie gate; real authorization lives in server guards and Convex RLS
- Use Better Auth directly for session state (`useSession`, server helpers). Do not add hand-rolled viewer/session layers.
- Do not ship auth UI for unsupported flows. If social auth is not implemented, it should not appear in the product.

### Route Groups

- `(app)/` — authenticated routes; wrapped in `ConvexClientProvider`
- `(marketing)/` — public pages; uses `RootProviders` only
- `(auth)/` — login/signup pages nested under marketing layout
- Keep providers scoped to the smallest subtree that actually needs them.
- Do not put Suspense boundaries above auth redirects. Auth pages should render or redirect cleanly without flashing loading shells.

### Key Libraries

| Library                       | Purpose                                               |
| ----------------------------- | ----------------------------------------------------- |
| `convex` + `convex-helpers`   | Backend: DB, serverless functions, RLS, rate limiting |
| `better-auth`                 | Authentication (email/password)                       |
| `@base-ui/react`              | Headless UI component primitives                      |
| `lucide-react`                | Icons                                                 |
| `class-variance-authority`    | Component variant styles                              |
| `clsx` + `tailwind-merge`     | Class name utility (`cn()` in `src/lib/utils.ts`)     |
| `date-fns`                    | Date formatting/manipulation                          |
| `zod` (v4)                    | Schema validation (forms, env vars)                   |
| `posthog-js` / `posthog-node` | Analytics + error tracking                            |
| `@t3-oss/env-nextjs`          | Runtime environment variable validation               |
| `nuqs`                        | Search param parsing/serialization                    |
| `@uidotdev/usehooks`          | Small client hooks such as debouncing                 |

### Convex Patterns

- Schema in `convex/schema.ts` with Convex validators (`v.string()`, `v.number()`, etc.)
- Custom `authedQuery`/`authedMutation` in `convex/lib/auth.ts` wrap standard functions with auth + RLS
- Auth triggers handle side effects (org creation on signup, cascade delete on user removal)
- HTTP router in `convex/http.ts` for auth endpoints
- Indexes defined on all query patterns in schema
- Soft delete for members (`isActive` boolean); hard cascade delete for meetings
- Public routes may use Convex client hooks when necessary, but keep that surface minimal and client-only.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

When validating Convex changes in this repo, prefer `vp exec convex ...` over calling `npx convex` directly.

<!-- convex-ai-end -->
