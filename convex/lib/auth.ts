import { ConvexError } from "convex/values";
import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import {
  type RLSConfig,
  type Rules,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";
import type { DataModel } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";

/**
 * Convex-side auth and row-level security helpers.
 *
 * @remarks
 * This module is the real authorization boundary for tenant data. The Next
 * proxy only performs optimistic cookie checks; every authenticated Convex
 * query/mutation still resolves the Better Auth user, loads the organization,
 * and applies RLS before touching business tables.
 */
type AuthCtx = {
  organizationId: string;
};

/**
 * Row-level security rules keyed by the caller's organization.
 *
 * @remarks
 * Each tenant-owned table must be listed here. `defaultPolicy: "deny"` below
 * ensures newly added tables are not accidentally exposed until we define rules
 * for them explicitly.
 */
function rlsRules({ organizationId }: AuthCtx): Rules<AuthCtx, DataModel> {
  return {
    organizations: {
      read: async (_, doc) => doc._id === organizationId,
      modify: async (_, doc) => doc._id === organizationId,
    },
    members: {
      read: async (_, doc) => doc.organizationId === organizationId,
      modify: async (_, doc) => doc.organizationId === organizationId,
      insert: async (_, doc) => doc.organizationId === organizationId,
    },
    meetings: {
      read: async (_, doc) => doc.organizationId === organizationId,
      modify: async (_, doc) => doc.organizationId === organizationId,
      insert: async (_, doc) => doc.organizationId === organizationId,
    },
    attendanceRecords: {
      read: async (_, doc) => doc.organizationId === organizationId,
      modify: async (_, doc) => doc.organizationId === organizationId,
      insert: async (_, doc) => doc.organizationId === organizationId,
    },
    // Rate-limit bookkeeping is internal middleware state, not tenant data.
    rateLimits: {
      read: async () => true,
      modify: async () => true,
      insert: async () => true,
    },
  };
}

/** Prevents future tables from being accidentally exposed without RLS rules. */
const rlsConfig: RLSConfig = { defaultPolicy: "deny" };

/**
 * Resolves the Better Auth user and tenant organization for the current
 * Convex request.
 *
 * @throws {ConvexError}
 * Thrown when the caller is unauthenticated or when a session exists without a
 * matching organization. The latter is treated as invariant drift because
 * signup should provision the organization before the user can reach the app.
 */
async function resolveAuthCtx(ctx: QueryCtx | MutationCtx) {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) {
    throw new ConvexError("Not authenticated");
  }

  const org = await ctx.db
    .query("organizations")
    .withIndex("by_authId", (q) => q.eq("authId", user._id))
    .unique();

  if (!org) {
    throw new ConvexError(
      "Authenticated user has no organization. This invariant should be impossible.",
    );
  }

  return { organizationId: org._id, authId: user._id };
}

const authedQueryCtx = customCtx(async (ctx) => {
  const { organizationId } = await resolveAuthCtx(ctx as QueryCtx);
  const rls = rlsRules({ organizationId });
  return {
    organizationId,
    db: wrapDatabaseReader({ organizationId }, ctx.db, rls, rlsConfig),
  };
});

const authedMutationCtx = customCtx(async (ctx) => {
  const { organizationId } = await resolveAuthCtx(ctx as MutationCtx);
  const rls = rlsRules({ organizationId });
  return {
    organizationId,
    db: wrapDatabaseWriter({ organizationId }, ctx.db, rls, rlsConfig),
  };
});

/**
 * Authenticated Convex query with organization-scoped `ctx.db`.
 */
export const authedQuery = customQuery(query, authedQueryCtx);

/**
 * Authenticated Convex mutation with organization-scoped `ctx.db`.
 *
 * @remarks
 * Inserts, patches, and deletes are all checked against the same RLS rules as
 * reads, so tenant isolation stays consistent across the full mutation.
 */
export const authedMutation = customMutation(mutation, authedMutationCtx);
