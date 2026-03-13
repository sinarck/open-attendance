import { ConvexError } from "convex/values";
import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
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

type AuthCtx = {
  organizationId: string;
};

// Every table scopes reads and writes to the caller's organizationId.
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
  };
}

// Prevents future tables from being accidentally exposed without RLS rules.
const rlsConfig: RLSConfig = { defaultPolicy: "deny" };

/** Resolves the auth user + org, wraps ctx.db with RLS. Throws if unauthenticated. */
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
    throw new ConvexError("No organization found. Complete onboarding first.");
  }

  return { organizationId: org._id, authId: user._id };
}

/** Authenticated query. ctx.db is scoped to the caller's org via RLS. */
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const { organizationId } = await resolveAuthCtx(ctx);
    const rls = rlsRules({ organizationId });
    return {
      organizationId,
      db: wrapDatabaseReader({ organizationId }, ctx.db, rls, rlsConfig),
    };
  }),
);

/** Authenticated mutation. ctx.db also gates inserts, patches, and deletes. */
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const { organizationId } = await resolveAuthCtx(ctx);
    const rls = rlsRules({ organizationId });
    return {
      organizationId,
      db: wrapDatabaseWriter({ organizationId }, ctx.db, rls, rlsConfig),
    };
  }),
);
