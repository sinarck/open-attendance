"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth/client";
import { env } from "@/lib/env";
import { AuthObservability } from "@/providers/auth-observability";

export const convexReactClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

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
      // Seed the client with the server token so authenticated pages do not
      // briefly mount as anonymous before Convex finishes its first refresh.
      initialToken={initialToken}
    >
      <AuthObservability />
      {children}
    </ConvexBetterAuthProvider>
  );
}
