import "server-only";

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { env } from "@/lib/env";
import { isAuthError } from "@/lib/utils";

// Tracking: `@convex-dev/better-auth` proxies Next.js auth route requests to the
// Convex site URL by calling `fetch(new Request(...))`. On Next.js 16.2.x with
// Node 24.14.0+, invalid auth POST responses can surface as
// `TypeError: fetch failed` / `expected non-null body source` instead of the
// underlying 401. Keep this repo pinned via `.node-version` until the upstream
// proxy path or Next.js runtime bug is fixed.
// Upstream: https://github.com/vercel/next.js/issues/90826
// Upstream: https://github.com/vercel/next.js/pull/90886
const authServer = convexBetterAuthNextJs({
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  jwtCache: {
    enabled: true,
    isAuthError,
  },
});

export const handler = authServer.handler;
export const preloadAuthQuery = authServer.preloadAuthQuery;
export const isAuthenticated = authServer.isAuthenticated;
export const getToken = authServer.getToken;
export const fetchAuthQuery = authServer.fetchAuthQuery;
export const fetchAuthMutation = authServer.fetchAuthMutation;
export const fetchAuthAction = authServer.fetchAuthAction;
