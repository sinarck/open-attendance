import { ConvexError, v } from "convex/values";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";

export const list = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("members")
      .withIndex("by_org_active", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("isActive", true),
      )
      .collect();
  },
});

/** Includes archived members, for admin views. */
export const listAll = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("members")
      .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
      .collect();
  },
});

export const get = authedQuery({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    return ctx.db.get(memberId);
  },
});

export const create = authedMutation({
  args: {
    name: v.string(),
    identifier: v.string(),
  },
  handler: async (ctx, { name, identifier }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const existing = await ctx.db
      .query("members")
      .withIndex("by_org_identifier", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("identifier", identifier),
      )
      .unique();

    if (existing) {
      throw new ConvexError(
        `A member with identifier "${identifier}" already exists`,
      );
    }

    return ctx.db.insert("members", {
      organizationId: ctx.organizationId,
      name,
      identifier,
      isActive: true,
    });
  },
});

/** Skips duplicates by identifier and returns a created/skipped summary. */
export const importBulk = authedMutation({
  args: {
    members: v.array(v.object({ name: v.string(), identifier: v.string() })),
  },
  handler: async (ctx, { members }) => {
    await rateLimit(ctx, {
      name: "memberImport",
      key: ctx.organizationId,
      throws: true,
    });

    let created = 0;
    let skipped = 0;

    for (const { name, identifier } of members) {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q
            .eq("organizationId", ctx.organizationId)
            .eq("identifier", identifier),
        )
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("members", {
        organizationId: ctx.organizationId,
        name,
        identifier,
        isActive: true,
      });
      created++;
    }

    return { created, skipped, total: members.length };
  },
});

export const update = authedMutation({
  args: {
    memberId: v.id("members"),
    name: v.optional(v.string()),
    identifier: v.optional(v.string()),
  },
  handler: async (ctx, { memberId, name, identifier }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get(memberId);
    if (!member) throw new ConvexError("Member not found");

    if (name !== undefined && name.trim() === "") {
      throw new ConvexError("Name cannot be empty");
    }
    if (identifier !== undefined && identifier.trim() === "") {
      throw new ConvexError("Identifier cannot be empty");
    }

    if (identifier !== undefined && identifier !== member.identifier) {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q
            .eq("organizationId", ctx.organizationId)
            .eq("identifier", identifier),
        )
        .unique();

      if (existing) {
        throw new ConvexError(
          `A member with identifier "${identifier}" already exists`,
        );
      }
    }

    const patch: Record<string, string> = {};
    if (name !== undefined) patch.name = name;
    if (identifier !== undefined) patch.identifier = identifier;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(memberId, patch);
    }
  },
});

/** Soft delete. Historical attendance records are preserved. */
export const archive = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) throw new ConvexError("Member not found");
    await ctx.db.patch(memberId, { isActive: false });
  },
});

export const restore = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) throw new ConvexError("Member not found");
    await ctx.db.patch(memberId, { isActive: true });
  },
});
