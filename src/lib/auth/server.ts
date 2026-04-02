import "server-only";

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { ConvexError } from "convex/values";
import { env, getConvexSiteUrl } from "@/lib/env";

const authServer = convexBetterAuthNextJs({
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  convexSiteUrl: getConvexSiteUrl(),
  jwtCache: {
    enabled: true,
    // Better Auth reuses Convex JWTs between requests. Treat auth-shaped
    // failures as cache misses so stale tokens do not poison later fetches.
    isAuthError(error: unknown) {
      const message =
        (error instanceof ConvexError && error.data) ||
        (error instanceof Error && error.message) ||
        "";
      return /auth/i.test(String(message));
    },
  },
});

/**
 * Better Auth route handlers for the Next API catch-all route.
 *
 * @remarks
 * Keep the API route as a thin export of this handler. The interesting auth
 * behavior lives in the Better Auth hooks configured in `convex/auth.ts`.
 */
export const handler = authServer.handler;

/**
 * Preloads an authenticated Convex query during server rendering.
 *
 * @remarks
 * Use this when a server-rendered subtree needs Convex data before the client
 * hydrates. The helper keeps the Better Auth session and Convex token flow in
 * sync so the client provider can continue from the same identity.
 */
export const preloadAuthQuery = authServer.preloadAuthQuery;

/**
 * Returns whether the current request has a valid Better Auth session.
 *
 * @remarks
 * This is the cheapest server-side auth probe we use in App Router guards. Ask
 * for organization state only after this returns true so anonymous requests do
 * not pay for an extra Convex query.
 */
export const isAuthenticated = authServer.isAuthenticated;

/**
 * Returns the Convex access token derived from the current Better Auth session.
 *
 * @remarks
 * Authenticated app layouts seed this token into the client Convex provider to
 * avoid a brief anonymous mount before the first token refresh completes.
 */
export const getToken = authServer.getToken;

/**
 * Executes a Convex query in the context of the current Better Auth session.
 *
 * @remarks
 * Prefer this over hand-rolled token plumbing in App Router server code. It is
 * the bridge between Next request auth state and Convex's authenticated query
 * surface.
 */
export const fetchAuthQuery = authServer.fetchAuthQuery;
