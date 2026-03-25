import type { AuthFunctions } from "@convex-dev/better-auth";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const authFunctions: AuthFunctions = internal.auth as AuthFunctions;

export const authComponent = createClient<DataModel>(components.betterAuth as never, {
  authFunctions,
  triggers: {
    user: {
      // Create a placeholder org; the user completes onboarding separately.
      onCreate: async (ctx, authUser) => {
        await ctx.db.insert("organizations", {
          authId: authUser._id,
          name: "",
          slug: "",
          timezone: "UTC",
        });
      },
      // Cascade-delete all org data when a user is deleted.
      onDelete: async (ctx, authUser) => {
        const org = await ctx.db
          .query("organizations")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();

        if (!org) return;

        const records = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_org_meeting", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const r of records) await ctx.db.delete(r._id);

        const members = await ctx.db
          .query("members")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const m of members) await ctx.db.delete(m._id);

        const meetings = await ctx.db
          .query("meetings")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const mt of meetings) await ctx.db.delete(mt._id);

        await ctx.db.delete(org._id);
      },
    },
  },
});

export const { onCreate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    appName: "Open Attendance",
    baseURL: process.env.SITE_URL,
    // biome-ignore lint/style/noNonNullAssertion: validated by Convex at deploy time
    trustedOrigins: [process.env.SITE_URL!],
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh daily
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 min, avoids DB hit on every getSession
      },
    },
    plugins: [username(), convex({ authConfig })],
  } satisfies BetterAuthOptions);
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.safeGetAuthUser(ctx);
  },
});
