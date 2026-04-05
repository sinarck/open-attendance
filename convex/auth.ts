import type { AuthFunctions } from "@convex-dev/better-auth";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireRunMutationCtx } from "@convex-dev/better-auth/utils";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { internalAction, query } from "./_generated/server";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins";
import { z } from "zod";
import { api, components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";
import {
  organizationNameSchema,
  organizationSlugSchema,
  organizationTimezoneSchema,
} from "./lib/validation";
import authSchema from "./betterAuth/schema";

/**
 * Better Auth runs on Convex and is the only supported source of truth for
 * session creation, org provisioning, and user teardown.
 *
 * @remarks
 * This file is the app-specific wrapper around the local Better Auth component
 * registered in `convex/convex.config.ts`.
 *
 * The auth model in this app is intentionally opinionated:
 *
 * - Sign up creates the Better Auth user, session, and organization in one
 *   flow.
 * - `/sign-in` and `/sign-up` stay public and fast; optimistic redirects happen in
 *   Next proxy, not in request-time auth pages.
 * - Authenticated app access still requires server-side org resolution and
 *   Convex RLS. A session without an organization is treated as invariant drift,
 *   not a recoverable UX state.
 *
 * This module keeps app-specific auth behavior layered on top of the
 * Convex Better Auth component: organization provisioning, tenant cleanup,
 * and the stricter auth/session defaults required by this app.
 */
const authFunctions: AuthFunctions = internal.auth as AuthFunctions;
const allowedHosts = ["localhost:3000", "*.vercel.app"];
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const convexSiteUrl = process.env.CONVEX_SITE_URL;

if (productionHost) {
  allowedHosts.push(productionHost);
}

if (convexSiteUrl) {
  allowedHosts.push(new URL(convexSiteUrl).host);
}

type SignupOrganization = {
  name: string;
  slug: string;
  timezone: string;
};

const signupOrganizationSchema = z
  .object({
    organizationName: organizationNameSchema,
    organizationSlug: organizationSlugSchema,
    timezone: organizationTimezoneSchema,
  })
  .transform(({ organizationName, organizationSlug, timezone }) => ({
    name: organizationName,
    slug: organizationSlug,
    timezone,
  }));

/**
 * Extracts and validates the organization payload piggybacked onto
 * `POST /sign-up/email`.
 *
 * @remarks
 * Better Auth owns the primary auth fields. We attach organization fields to
 * the same request body, validate them here, then strip them back out before
 * the request reaches the built-in sign-up handler.
 */
function parseSignupOrganization(body: unknown): SignupOrganization {
  const result = signupOrganizationSchema.safeParse(body);

  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      code: "input",
      message: result.error.issues[0]?.message ?? "Invalid signup data",
    });
  }

  return result.data;
}

/**
 * Better Auth adapter client plus auth-linked data triggers.
 *
 * @remarks
 * `onCreate` is intentionally a no-op because organization provisioning happens
 * in the sign-up hook below, after we have validated the slug and normalized the
 * full organization payload. `onDelete` cascades the tenant data for the auth
 * user's organization.
 */
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
  authFunctions,
  triggers: {
    user: {
      // Organizations are provisioned during the sign-up hook below.
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
        await ctx.scheduler.runAfter(0, internal.organizations.cleanupDeletedAuthOrganization, {
          organizationId: org._id,
        });
      },
    },
  },
});

export const { onCreate, onDelete } = authComponent.triggersApi();
export const { getAuthUser } = authComponent.clientApi();

/**
 * Creates the Better Auth instance bound to the current Convex request context.
 *
 * @remarks
 * The `before` and `after` sign-up hooks are the heart of the auth flow:
 *
 * - `before` validates and normalizes the organization payload, checks slug
 *   availability, and removes app-specific fields before Better Auth handles
 *   the core sign-up request.
 * - `after` provisions the organization via an internal Convex mutation. If
 *   provisioning fails, we delete the freshly created user and clear auth
 *   cookies so the system never settles into "session exists but org missing".
 *
 * That rollback is the reason the rest of the app can treat a missing org as an
 * impossible invariant instead of a first-class onboarding state.
 */
export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "Open Attendance",
    baseURL: {
      allowedHosts,
      protocol: process.env.NODE_ENV === "development" ? "http" : "https",
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/get-session": false,
        "/sign-in/email": {
          window: 10,
          max: 3,
        },
        "/sign-up/email": {
          window: 60,
          max: 3,
        },
      },
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

        // Strip app-specific organization fields back out before handing the
        // request body to Better Auth. We stash the normalized values in hook
        // context so the after-hook can provision the org if sign-up succeeds.
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

        // Better Auth's after hook runs after sign-up has already created the
        // user and `newSession`. Roll both back if org provisioning fails so
        // the rest of the app never observes "session exists but org missing".
        const rollbackUser = async () => {
          await request.context.internalAdapter.deleteUser(session.user.id);
          request.setCookie(request.context.authCookies.sessionToken.name, "", {
            ...request.context.authCookies.sessionToken.attributes,
            maxAge: 0,
          });
          request.setCookie(request.context.authCookies.sessionData.name, "", {
            ...request.context.authCookies.sessionData.attributes,
            maxAge: 0,
          });
          request.setCookie(request.context.authCookies.dontRememberToken.name, "", {
            ...request.context.authCookies.dontRememberToken.attributes,
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
            message: "Unable to create organization",
          });
        }
      }),
    },
    plugins: [username(), convex({ authConfig, jwks: process.env.JWKS })],
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx));

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => authComponent.getAuthUser(ctx),
});

export const getLatestJwks = internalAction({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);
    return auth.api.getLatestJwks();
  },
});
