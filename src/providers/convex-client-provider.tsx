"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth/client";
import { env } from "@/lib/env";

export const convexReactClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Connects a route subtree to Convex using the current Better Auth session.
 *
 * @remarks
 * Authenticated app routes pass `initialToken` from the server so the client
 * does not briefly mount as anonymous. Public auth routes can omit it and still
 * use authenticated Convex calls after sign-in completes.
 */
export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode;
  initialToken?: string;
}) {
  return (
    <ConvexBetterAuthProvider
      client={convexReactClient}
      authClient={authClient}
      initialToken={initialToken}
    >
      {children}
    </ConvexBetterAuthProvider>
  );
}
