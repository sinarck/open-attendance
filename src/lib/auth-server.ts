import "server-only";

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { env } from "@/lib/env";
import { isAuthError } from "@/lib/utils";

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
