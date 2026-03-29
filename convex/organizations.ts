import { ConvexError } from "convex/values";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import {
  organizationNameSchema,
  organizationSlugCandidateSchema,
  organizationSlugSchema,
  organizationTimezoneSchema,
} from "./lib/validation";

const zMutation = zCustomMutation(mutation, NoOp);
const zQuery = zCustomQuery(query, NoOp);

export async function createOrganizationForAuthUser(
  ctx: Pick<MutationCtx, "db">,
  authId: string,
  { name, slug, timezone }: { name: string; slug: string; timezone: string },
) {
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();

  if (org && org.slug !== "") {
    throw new ConvexError("Organization already exists for this account");
  }

  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing && existing.authId !== authId) {
    throw new ConvexError("Slug already taken");
  }

  if (org) {
    // Repair legacy empty-slug rows left behind by the old setup flow.
    await ctx.db.patch("organizations", org._id, {
      name,
      slug,
      timezone,
    });
    return org._id;
  }

  return ctx.db.insert("organizations", {
    authId,
    name,
    slug,
    timezone,
  });
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
export const create = zMutation({
  args: {
    name: organizationNameSchema,
    slug: organizationSlugSchema,
    timezone: organizationTimezoneSchema,
  },
  handler: async (ctx, { name, slug, timezone }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    return createOrganizationForAuthUser(ctx, user._id, {
      name,
      slug,
      timezone,
    });
  },
});

/** Real-time slug availability check for the signup and organization setup forms. */
export const isSlugAvailable = zQuery({
  args: { slug: organizationSlugCandidateSchema },
  handler: async (ctx, { slug }) => {
    if (slug.length < 2) {
      return false;
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    return existing === null;
  },
});
