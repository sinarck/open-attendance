"use client";

import type { PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { AuthBoundary } from "@convex-dev/better-auth/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth/auth-client";
import { isAuthError } from "@/lib/utils";

export function ClientAuthBoundary({ children }: PropsWithChildren) {
  const router = useRouter();

  return (
    <AuthBoundary
      authClient={authClient}
      getAuthUserFn={api.auth.getAuthUser}
      isAuthError={isAuthError}
      onUnauth={() => router.replace("/sign-in")}
    >
      {children}
    </AuthBoundary>
  );
}
