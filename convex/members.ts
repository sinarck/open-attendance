import { ConvexError, v } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { authedMutation, authedQuery, zAuthedMutation } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { z } from "zod";
import { memberIdentifierSchema, memberNameSchema } from "../lib/validation/convex";

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
    return ctx.db.get("members", memberId);
  },
});

export const listRoster = authedQuery({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
      .collect();

    return {
      active: members.filter((member) => member.isActive),
      archived: members.filter((member) => !member.isActive),
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

/** Skips duplicates by identifier and returns a created/skipped summary. */
export const importBulk = zAuthedMutation({
  args: {
    members: z.array(
      z.object({
        name: memberNameSchema,
        identifier: memberIdentifierSchema,
      }),
    ),
  },
  handler: async (ctx, { members }) => {
    await rateLimit(ctx, {
      name: "memberImport",
      key: ctx.organizationId,
      throws: true,
    });

    let created = 0;
    let skipped = 0;

    for (const member of members) {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("identifier", member.identifier),
        )
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("members", {
        organizationId: ctx.organizationId,
        name: member.name,
        identifier: member.identifier,
        isActive: true,
      });
      created++;
    }

    return { created, skipped, total: members.length };
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

    const patch: Record<string, string> = {};
    if (name !== undefined && name !== member.name) patch.name = name;
    if (identifier !== undefined && identifier !== member.identifier) patch.identifier = identifier;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("members", memberId, patch);
    }
  },
});

/** Soft delete. Historical attendance records are preserved. */
export const archive = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
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
    const member = await ctx.db.get("members", memberId);
    if (!member) throw new ConvexError("Member not found");
    if (member.isActive) {
      return memberId;
    }
    await ctx.db.patch("members", memberId, { isActive: true });
    return memberId;
  },
});
