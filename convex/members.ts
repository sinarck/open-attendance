import { ConvexError, v } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { authedMutation, authedQuery, zAuthedMutation } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { memberIdentifierSchema, memberNameSchema } from "./lib/validation";

export const listRoster = authedQuery({
  args: {},
  handler: async (ctx) => {
    const [active, archived] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("isActive", true),
        )
        .collect(),
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("isActive", false),
        )
        .collect(),
    ]);

    return {
      active,
      archived,
    };
  },
});

export const create = zAuthedMutation({
  args: {
    name: memberNameSchema,
    identifier: memberIdentifierSchema,
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
      throw new ConvexError(`A member with identifier "${identifier}" already exists`);
    }

    return ctx.db.insert("members", {
      organizationId: ctx.organizationId,
      name,
      identifier,
      isActive: true,
    });
  },
});

export const update = zAuthedMutation({
  args: {
    memberId: zid("members"),
    name: memberNameSchema.optional(),
    identifier: memberIdentifierSchema.optional(),
  },
  handler: async (ctx, { memberId, name, identifier }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found");

    if (identifier !== undefined && identifier !== member.identifier) {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("identifier", identifier),
        )
        .unique();

      if (existing) {
        throw new ConvexError(`A member with identifier "${identifier}" already exists`);
      }
    }

    const memberChanges: Record<string, string> = {};
    if (name !== undefined && name !== member.name) memberChanges.name = name;
    if (identifier !== undefined && identifier !== member.identifier) {
      memberChanges.identifier = identifier;
    }

    if (Object.keys(memberChanges).length > 0) {
      await ctx.db.patch("members", memberId, memberChanges);
    }
  },
});

/** Soft delete. Historical attendance records are preserved. */
export const archive = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found");
    if (!member.isActive) {
      return memberId;
    }
    await ctx.db.patch("members", memberId, { isActive: false });
    return memberId;
  },
});

export const restore = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found");
    if (member.isActive) {
      return memberId;
    }
    await ctx.db.patch("members", memberId, { isActive: true });
    return memberId;
  },
});
