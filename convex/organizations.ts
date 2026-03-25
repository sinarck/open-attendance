import { ConvexError } from "convex/values";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { authedQuery } from "./lib/auth";
import {
  organizationNameSchema,
  organizationSlugCandidateSchema,
  organizationSlugSchema,
  organizationTimezoneSchema,
} from "../lib/validation/convex";

const zMutation = zCustomMutation(mutation, NoOp);
const zQuery = zCustomQuery(query, NoOp);

export async function upsertOnboardingOrg(
  ctx: Pick<MutationCtx, "db">,
  authId: string,
  { name, slug, timezone }: { name: string; slug: string; timezone: string },
) {
  const org = await ctx.db
    .query("organizations")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();

  if (org && org.slug !== "") {
    throw new ConvexError("Organization already onboarded");
  }

  const existing = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  if (existing && existing.authId !== authId) {
    throw new ConvexError("Slug already taken");
  }

  if (org) {
    await ctx.db.patch("organizations", org._id, {
      name,
      slug,
      timezone,
    });
    return org._id;
  }

  // Repair accounts whose placeholder org was never created by the auth trigger.
  return ctx.db.insert("organizations", {
    authId,
    name,
    slug,
    timezone,
  });
}

/** Returns the caller's org, or null before onboarding. */
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
 * Completes onboarding by setting name, slug, and timezone.
 * The org row was created by the user.onCreate trigger with placeholder values.
 */
export const completeOnboarding = zMutation({
  args: {
    name: organizationNameSchema,
    slug: organizationSlugSchema,
    timezone: organizationTimezoneSchema,
  },
  handler: async (ctx, { name, slug, timezone }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    return upsertOnboardingOrg(ctx, user._id, {
      name,
      slug,
      timezone,
    });
  },
});

/** Real-time slug availability check for the onboarding form. */
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

export const get = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db.get("organizations", ctx.organizationId);
  },
});
