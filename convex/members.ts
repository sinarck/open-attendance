import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { DatabaseReader, DatabaseWriter } from "./_generated/server";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { normalizeMemberIdentifier, normalizeMemberName } from "./lib/validation";
import type {
  MemberImportCode,
  MemberImportPreviewResult,
  MemberImportResult,
  MemberImportRowInput,
  MemberImportRowResult,
  MemberImportSummary,
} from "../src/types/member-import";

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

function invalidImportRow(
  row: MemberImportRowInput,
  code: Exclude<
    MemberImportCode,
    "duplicate_identifier" | "duplicate_identifier_in_archived_roster"
  >,
  message: string,
): MemberImportRowResult {
  return {
    rowNumber: row.rowNumber,
    name: row.name,
    identifier: row.identifier,
    ok: false,
    code,
    message,
  };
}

type ImportAnalysisCtx = {
  db: DatabaseReader | DatabaseWriter;
  organizationId: Id<"organizations">;
};

function buildImportSummary(rows: MemberImportRowResult[]): MemberImportSummary {
  return {
    activeConflicts: rows.filter((row) => row.code === "duplicate_identifier").length,
    archivedConflicts: rows.filter((row) => row.code === "duplicate_identifier_in_archived_roster")
      .length,
    duplicateIdentifiersInFile: rows.filter((row) => row.code === "duplicate_identifier_in_file")
      .length,
    invalidIdentifiers: rows.filter((row) => row.code === "invalid_identifier").length,
    invalidNames: rows.filter((row) => row.code === "invalid_name").length,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.ok).length,
  };
}

async function analyzeImportRows(
  ctx: ImportAnalysisCtx,
  rows: MemberImportRowInput[],
): Promise<MemberImportPreviewResult> {
  const seenIdentifiers = new Set<string>();
  const normalizedRows: Array<MemberImportRowResult> = [];
  const identifiersToCheck = new Set<string>();

  for (const row of rows) {
    let normalizedName: string;
    try {
      normalizedName = normalizeMemberName(row.name);
    } catch {
      normalizedRows.push(invalidImportRow(row, "invalid_name", "Name cannot be empty."));
      continue;
    }

    let normalizedIdentifier: string;
    try {
      normalizedIdentifier = normalizeMemberIdentifier(row.identifier);
    } catch {
      normalizedRows.push(
        invalidImportRow(row, "invalid_identifier", "Identifier cannot be empty."),
      );
      continue;
    }

    if (seenIdentifiers.has(normalizedIdentifier)) {
      normalizedRows.push({
        rowNumber: row.rowNumber,
        name: row.name,
        identifier: row.identifier,
        normalizedIdentifier,
        normalizedName,
        ok: false,
        code: "duplicate_identifier_in_file",
        message: `Identifier "${normalizedIdentifier}" appears multiple times in this file.`,
      });
      continue;
    }

    seenIdentifiers.add(normalizedIdentifier);
    identifiersToCheck.add(normalizedIdentifier);
    normalizedRows.push({
      rowNumber: row.rowNumber,
      name: row.name,
      identifier: row.identifier,
      normalizedIdentifier,
      normalizedName,
      ok: true,
    });
  }

  const existingMembers = new Map<string, { isActive: boolean }>();
  await Promise.all(
    Array.from(identifiersToCheck, async (identifier) => {
      const member = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", ctx.organizationId).eq("identifier", identifier),
        )
        .unique();

      if (member) {
        existingMembers.set(identifier, { isActive: member.isActive });
      }
    }),
  );

  const rowsWithConflicts = normalizedRows.map((row) => {
    if (!row.ok || row.normalizedIdentifier === undefined) {
      return row;
    }

    const existing = existingMembers.get(row.normalizedIdentifier);
    if (!existing) {
      return row;
    }

    if (existing.isActive) {
      return {
        ...row,
        ok: false,
        code: "duplicate_identifier",
        message: `Identifier "${row.normalizedIdentifier}" already belongs to an active member.`,
      } satisfies MemberImportRowResult;
    }

    return {
      ...row,
      ok: false,
      code: "duplicate_identifier_in_archived_roster",
      message: `Identifier "${row.normalizedIdentifier}" belongs to an archived member.`,
    } satisfies MemberImportRowResult;
  });

  return {
    rows: rowsWithConflicts,
    summary: buildImportSummary(rowsWithConflicts),
  };
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
 * Reviews a mapped import file against current roster rules before commit.
 */
export const previewImport = authedQuery({
  args: {
    rows: v.array(
      v.object({
        rowNumber: v.number(),
        name: v.string(),
        identifier: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<MemberImportPreviewResult> => {
    return analyzeImportRows(ctx, args.rows);
  },
});

/**
 * Imports valid members in one mutation and skips conflicting rows.
 */
export const importMembers = authedMutation({
  args: {
    rows: v.array(
      v.object({
        rowNumber: v.number(),
        name: v.string(),
        identifier: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<MemberImportResult> => {
    await rateLimit(ctx, {
      name: "memberImport",
      key: ctx.organizationId,
      throws: true,
    });

    const preview = await analyzeImportRows(ctx, args.rows);
    let importedCount = 0;

    for (const row of preview.rows) {
      if (!row.ok || row.normalizedIdentifier === undefined || row.normalizedName === undefined) {
        continue;
      }

      await ctx.db.insert("members", {
        organizationId: ctx.organizationId,
        name: row.normalizedName,
        identifier: row.normalizedIdentifier,
        isActive: true,
      });
      importedCount += 1;
    }

    return {
      ...preview,
      importedCount,
      skippedCount: preview.rows.length - importedCount,
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
