import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";
import {
  normalizeOrganizationName,
  normalizeOrganizationSlug,
  normalizeOrganizationSlugCandidate,
  normalizeOrganizationTimezone,
} from "./lib/validation";

type OrganizationErrorCode = "exists" | "slug";
type OrganizationError =
  | { ok: false; code: "exists"; message: "Organization already exists for this account" }
  | { ok: false; code: "slug"; message: "Slug already taken" };

/**
 * Result of organization provisioning for a Better Auth user.
 *
 * @remarks
 * This helper is intentionally internal-facing. Public signup goes through the
 * Better Auth hook in `convex/auth.ts`, which translates these codes back into
 * auth-friendly API errors.
 */
export type CreateOrganizationResult = { ok: true; id: Id<"organizations"> } | OrganizationError;

const AUTH_DELETE_BATCH_SIZE = 64;
type DeletedAuthOrganizationCleanupStatus = "continue" | "done";

function organizationError(code: OrganizationErrorCode): CreateOrganizationResult {
  switch (code) {
    case "exists":
      return { ok: false, code, message: "Organization already exists for this account" };
    case "slug":
      return { ok: false, code, message: "Slug already taken" };
  }
}

/**
 * Creates the single organization owned by a Better Auth user.
 *
 * @remarks
 * Organization creation is part of signup provisioning, not a separate product
 * step. If an org already exists for `authId`, this returns `"exists"` instead
 * of repairing or mutating it because "authenticated but unprovisioned" is no
 * longer a supported state.
 */
export async function createOrganizationForAuthUser(
  ctx: Pick<MutationCtx, "db">,
  authId: string,
  { name, slug, timezone }: { name: string; slug: string; timezone: string },
): Promise<CreateOrganizationResult> {
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();

  if (org) {
    return organizationError("exists");
  }

  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing && existing.authId !== authId) {
    return organizationError("slug");
  }

  return {
    ok: true,
    id: await ctx.db.insert("organizations", {
      authId,
      name,
      slug,
      timezone,
    }),
  };
}

/**
 * Returns the signed-in caller's organization.
 *
 * @remarks
 * This is the organization lookup used by App Router guards after Better Auth
 * has already confirmed the request has a session.
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;

    return ctx.db
      .query("organizations")
      .withIndex("by_authId", (q) => q.eq("authId", user._id))
      .unique();
  },
});

/**
 * Internal mutation wrapper used by the Better Auth sign-up hook.
 *
 * @remarks
 * Keep organization normalization here so the auth hook and tests share the
 * same provisioning behavior.
 */
export const createForAuthUser = internalMutation({
  args: {
    authId: v.string(),
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    return createOrganizationForAuthUser(ctx, args.authId, {
      name: normalizeOrganizationName(args.name),
      slug: normalizeOrganizationSlug(args.slug),
      timezone: normalizeOrganizationTimezone(args.timezone),
    });
  },
});

/**
 * Deletes one bounded cleanup batch for an organization owned by a deleted user.
 *
 * @remarks
 * The public auth trigger uses this inside a self-rescheduling mutation so user
 * deletion stays transaction-bounded. Tests call the same helper directly to
 * verify the exact delete order without depending on scheduler internals.
 */
export async function cleanupDeletedAuthOrganizationBatch(
  ctx: Pick<MutationCtx, "db">,
  organizationId: Id<"organizations">,
): Promise<DeletedAuthOrganizationCleanupStatus> {
  const organization = await ctx.db.get(organizationId);

  if (!organization) {
    return "done";
  }

  const records = await ctx.db
    .query("attendanceRecords")
    .withIndex("by_org_meeting", (q) => q.eq("organizationId", organizationId))
    .take(AUTH_DELETE_BATCH_SIZE);
  if (records.length > 0) {
    for (const { _id } of records) {
      await ctx.db.delete(_id);
    }
    return "continue";
  }

  const meetings = await ctx.db
    .query("meetings")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .take(AUTH_DELETE_BATCH_SIZE);
  if (meetings.length > 0) {
    for (const { _id } of meetings) {
      await ctx.db.delete(_id);
    }
    return "continue";
  }

  const members = await ctx.db
    .query("members")
    .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
    .take(AUTH_DELETE_BATCH_SIZE);
  if (members.length > 0) {
    for (const { _id } of members) {
      await ctx.db.delete(_id);
    }
    return "continue";
  }

  await ctx.db.delete(organizationId);
  return "done";
}

/**
 * Deletes tenant data for an auth user in bounded batches.
 *
 * @remarks
 * Better Auth user deletion schedules this mutation from the auth trigger so
 * cleanup scales past a single-transaction cascade. The function is idempotent:
 * reruns are safe, and missing organizations are treated as already-cleaned up.
 */
export const cleanupDeletedAuthOrganization = internalMutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const status = await cleanupDeletedAuthOrganizationBatch(ctx, organizationId);
    if (status === "continue") {
      await ctx.scheduler.runAfter(0, internal.organizations.cleanupDeletedAuthOrganization, {
        organizationId,
      });
    }
  },
});

/**
 * Real-time slug availability check for the signup form.
 *
 * @remarks
 * This is intentionally advisory UX, not the final authority. Signup still
 * re-checks the slug in the Better Auth hook to close race conditions.
 */
export const isSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const normalizedSlug = normalizeOrganizationSlugCandidate(slug);

    if (normalizedSlug.length < 2) {
      return false;
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .unique();

    return existing === null;
  },
});
