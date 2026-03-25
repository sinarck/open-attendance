"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AuthObservability } from "@/components/providers/auth-observability";
import { ToastProvider } from "@/components/ui/toast";
import type { AppViewer } from "@/lib/app-viewer";
import { authClient } from "@/lib/auth-client";
import { env } from "@/lib/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Root providers for the entire app. Intentionally excludes Convex/auth so
 * marketing pages stay static (no WebSocket, no blocking getToken()).
 */
export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider position="bottom-right">{children}</ToastProvider>
    </ThemeProvider>
  );
}

/**
 * Auth-aware providers for the (app) route group only. Wraps children in
 * ConvexBetterAuthProvider with a pre-fetched token for instant hydration.
 */
export function AppProviders({
  children,
  initialToken,
  viewer,
}: {
  children: ReactNode;
  initialToken?: string | null;
  viewer: AppViewer | null;
}) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient} initialToken={initialToken}>
      <AuthObservability viewer={viewer} />
      {children}
    </ConvexBetterAuthProvider>
  );
}
