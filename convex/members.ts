import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { normalizeMemberIdentifier, normalizeMemberName } from "./lib/validation";

/**
 * Member roster management for an authenticated organization.
 *
 * @remarks
 * Members are soft-archived instead of deleted so historical attendance records
 * can continue pointing at the same roster entry.
 */
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

/**
 * Returns the active and archived roster for the caller's organization.
 */
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

/**
 * Creates a new active member in the caller's organization.
 *
 * @remarks
 * Member identifiers are normalized and enforced as organization-local unique
 * keys because public self check-in resolves a member by identifier inside the
 * meeting's tenant.
 */
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

/**
 * Updates a roster entry while preserving identifier uniqueness per
 * organization.
 */
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

/**
 * Archives a member without deleting historical attendance.
 */
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

/**
 * Restores a previously archived member to the active roster.
 */
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
