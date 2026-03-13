import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { authedQuery } from "./lib/auth";

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
export const completeOnboarding = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, { name, slug, timezone }) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) throw new ConvexError("Not authenticated");

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_authId", (q) => q.eq("authId", user._id))
      .unique();

    if (!org) throw new ConvexError("Organization not found");

    if (org.slug !== "") {
      throw new ConvexError("Organization already onboarded");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) throw new ConvexError("Slug already taken");

    await ctx.db.patch(org._id, { name, slug, timezone });
    return org._id;
  },
});

/** Real-time slug availability check for the onboarding form. */
export const isSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
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
    return ctx.db.get(ctx.organizationId);
  },
});
