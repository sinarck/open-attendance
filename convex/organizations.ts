import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  normalizeOrganizationName,
  normalizeOrganizationSlug,
  normalizeOrganizationSlugCandidate,
  normalizeOrganizationTimezone,
} from "./lib/validation";
type OrganizationErrorCode = "auth" | "exists" | "slug";
type OrganizationError =
  | { ok: false; code: "auth"; message: "Not authenticated" }
  | { ok: false; code: "exists"; message: "Organization already exists for this account" }
  | { ok: false; code: "slug"; message: "Slug already taken" };
export type CreateOrganizationResult = { ok: true; id: Id<"organizations"> } | OrganizationError;

function organizationError(code: OrganizationErrorCode): CreateOrganizationResult {
  switch (code) {
    case "auth":
      return { ok: false, code, message: "Not authenticated" };
    case "exists":
      return { ok: false, code, message: "Organization already exists for this account" };
    case "slug":
      return { ok: false, code, message: "Slug already taken" };
  }
}

export async function createOrganizationForAuthUser(
  ctx: Pick<MutationCtx, "db">,
  authId: string,
  { name, slug, timezone }: { name: string; slug: string; timezone: string },
): Promise<CreateOrganizationResult> {
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();

  if (org && org.slug !== "") {
    return organizationError("exists");
  }

  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing && existing.authId !== authId) {
    return organizationError("slug");
  }

  if (org) {
    // Repair legacy empty-slug rows left behind by the old setup flow.
    await ctx.db.patch("organizations", org._id, {
      name,
      slug,
      timezone,
    });
    return { ok: true, id: org._id };
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

/** Returns the caller's organization, or null if setup has not been completed yet. */
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

/** Creates the caller's organization, or repairs a legacy incomplete organization row. */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return organizationError("auth");

    return createOrganizationForAuthUser(ctx, user._id, {
      name: normalizeOrganizationName(args.name),
      slug: normalizeOrganizationSlug(args.slug),
      timezone: normalizeOrganizationTimezone(args.timezone),
    });
  },
});

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

/** Real-time slug availability check for the signup and organization setup forms. */
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
