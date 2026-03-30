import "server-only";

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { ConvexError } from "convex/values";
import { env, getConvexSiteUrl } from "@/lib/env";

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthNextJs({
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
