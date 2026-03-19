import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { ConvexError } from "convex/values";
import { env } from "@/lib/env";

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
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  jwtCache: {
    enabled: true,
    isAuthError(error: unknown) {
      const message =
        (error instanceof ConvexError && error.data) ||
        (error instanceof Error && error.message) ||
        "";
      return /auth/i.test(String(message));
    },
  },
});
