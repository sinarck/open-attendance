"use client";

import { AuthBoundary } from "@convex-dev/better-auth/react";
import type { Route } from "next";
import type { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { isAuthError } from "@/lib/utils";

export function ClientAuthBoundary({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <AuthBoundary
      authClient={authClient}
      onUnauth={() => router.replace("/sign-in" as Route)}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
    >
      {children}
    </AuthBoundary>
  );
}
