import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { normalizeMemberIdentifier, normalizeMemberName } from "./lib/validation";

const memberErrorMessages = {
  member_not_found: "Member not found",
} as const;

type MemberErrorCode = "duplicate_identifier" | keyof typeof memberErrorMessages;
type MemberMutationResult =
  | { ok: true; id: Id<"members"> }
  | { ok: false; code: MemberErrorCode; message: string };

function memberError(code: MemberErrorCode, identifier?: string) {
  if (code === "duplicate_identifier") {
    return {
      ok: false,
      code,
      message: `A member with identifier "${identifier}" already exists`,
    } as const;
  }

  return { ok: false, code, message: memberErrorMessages[code] } as const;
}

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

export const create = authedMutation({
  args: {
    name: v.string(),
    identifier: v.string(),
  },
  handler: async (ctx, args): Promise<MemberMutationResult> => {
    const name = normalizeMemberName(args.name);
    const identifier = normalizeMemberIdentifier(args.identifier);

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
      return memberError("duplicate_identifier", identifier);
    }

    return {
      ok: true,
      id: await ctx.db.insert("members", {
        organizationId: ctx.organizationId,
        name,
        identifier,
        isActive: true,
      }),
    };
  },
});

export const update = authedMutation({
  args: {
    memberId: v.id("members"),
    name: v.optional(v.string()),
    identifier: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<MemberMutationResult> => {
    const name = args.name === undefined ? undefined : normalizeMemberName(args.name);
    const identifier =
      args.identifier === undefined ? undefined : normalizeMemberIdentifier(args.identifier);

    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", args.memberId);
    if (!member) return memberError("member_not_found");

    if (identifier !== undefined && identifier !== member.identifier) {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("identifier", identifier),
        )
        .unique();

      if (existing) {
        return memberError("duplicate_identifier", identifier);
      }
    }

    const memberChanges: { name?: string; identifier?: string } = {};
    if (name !== undefined && name !== member.name) memberChanges.name = name;
    if (identifier !== undefined && identifier !== member.identifier) {
      memberChanges.identifier = identifier;
    }

    if (Object.keys(memberChanges).length > 0) {
      await ctx.db.patch("members", args.memberId, memberChanges);
    }

    return { ok: true, id: args.memberId };
  },
});

/** Soft delete. Historical attendance records are preserved. */
export const archive = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }): Promise<MemberMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", memberId);
    if (!member) return memberError("member_not_found");
    if (!member.isActive) {
      return { ok: true, id: memberId };
    }
    await ctx.db.patch("members", memberId, { isActive: false });
    return { ok: true, id: memberId };
  },
});

export const restore = authedMutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }): Promise<MemberMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const member = await ctx.db.get("members", memberId);
    if (!member) return memberError("member_not_found");
    if (member.isActive) {
      return { ok: true, id: memberId };
    }
    await ctx.db.patch("members", memberId, { isActive: true });
    return { ok: true, id: memberId };
  },
});
