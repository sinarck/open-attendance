import type { AuthFunctions } from "@convex-dev/better-auth";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins";
import { api, components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import {
  normalizeOrganizationName,
  normalizeOrganizationSlug,
  normalizeOrganizationTimezone,
} from "./lib/validation";

const authFunctions: AuthFunctions = internal.auth as AuthFunctions;
type SignupOrganization = {
  name: string;
  slug: string;
  timezone: string;
};

function parseSignupOrganization(body: Record<string, unknown>): SignupOrganization {
  const { organizationName, organizationSlug, timezone } = body;

  if (
    typeof organizationName !== "string" ||
    typeof organizationSlug !== "string" ||
    typeof timezone !== "string"
  ) {
    throw new APIError("BAD_REQUEST", {
      code: "input",
      message: "Invalid signup data",
    });
  }

  try {
    return {
      name: normalizeOrganizationName(organizationName),
      slug: normalizeOrganizationSlug(organizationSlug),
      timezone: normalizeOrganizationTimezone(timezone),
    };
  } catch (error) {
    throw new APIError("BAD_REQUEST", {
      code: "input",
      message: error instanceof Error ? error.message : "Invalid signup data",
    });
  }
}

export const authComponent = createClient<DataModel>(components.betterAuth as never, {
  authFunctions,
  triggers: {
    user: {
      // Organizations are created explicitly during the organization setup flow.
      onCreate: async () => {
        return;
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
        for (const record of records) {
          await ctx.db.delete("attendanceRecords", record._id);
        }

        const members = await ctx.db
          .query("members")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const member of members) {
          await ctx.db.delete("members", member._id);
        }

        const meetings = await ctx.db
          .query("meetings")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect();
        for (const meeting of meetings) {
          await ctx.db.delete("meetings", meeting._id);
        }

        await ctx.db.delete("organizations", org._id);
      },
    },
  },
});

export const { onCreate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    appName: "Open Attendance",
    baseURL: process.env.SITE_URL,
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
    hooks: {
      before: createAuthMiddleware(async (request) => {
        if (request.path !== "/sign-up/email") {
          return;
        }

        const organization = parseSignupOrganization(request.body);

        const isSlugAvailable: boolean = await ctx.runQuery(api.organizations.isSlugAvailable, {
          slug: organization.slug,
        });

        if (!isSlugAvailable) {
          throw new APIError("UNPROCESSABLE_ENTITY", {
            code: "slug",
            message: "Slug already taken",
          });
        }

        const {
          organizationName: _organizationName,
          organizationSlug: _organizationSlug,
          timezone: _timezone,
          ...body
        } = request.body;

        return {
          context: {
            body,
            context: {
              ...request.context,
              signupOrganization: {
                name: organization.name,
                slug: organization.slug,
                timezone: organization.timezone,
              },
            },
          },
        };
      }),
      after: createAuthMiddleware(async (request) => {
        if (request.path !== "/sign-up/email") {
          return;
        }

        if (request.context.returned instanceof APIError) {
          return;
        }

        const context = request.context as typeof request.context & {
          signupOrganization?: SignupOrganization;
        };
        const session = context.newSession;
        const organization = context.signupOrganization;

        if (!session || !organization) {
          return;
        }

        const rollbackUser = async () => {
          await request.context.internalAdapter.deleteUser(session.user.id);
          request.setCookie(request.context.authCookies.sessionToken.name, "", {
            ...request.context.authCookies.sessionToken.options,
            maxAge: 0,
          });
          request.setCookie(request.context.authCookies.sessionData.name, "", {
            ...request.context.authCookies.sessionData.options,
            maxAge: 0,
          });
          request.setCookie(request.context.authCookies.dontRememberToken.name, "", {
            ...request.context.authCookies.dontRememberToken.options,
            maxAge: 0,
          });
        };

        try {
          const result = await requireRunMutationCtx(ctx).runMutation(
            internal.organizations.createForAuthUser,
            {
              authId: session.user.id,
              name: organization.name,
              slug: organization.slug,
              timezone: organization.timezone,
            },
          );

          if (result.ok) {
            return;
          }

          await rollbackUser();
          throw new APIError("UNPROCESSABLE_ENTITY", {
            code: result.code,
            message: result.message,
          });
        } catch (error) {
          if (error instanceof APIError) {
            throw error;
          }

          await rollbackUser();
          throw new APIError("INTERNAL_SERVER_ERROR", {
            code: "unexpected",
            message: "Unable to finish workspace setup",
          });
        }
      }),
    },
    plugins: [username(), convex({ authConfig })],
  } satisfies BetterAuthOptions);
};
