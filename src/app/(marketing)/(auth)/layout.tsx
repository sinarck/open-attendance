import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { isAuthenticated } from "@/lib/auth-server";

/**
 * Async server component that redirects authenticated users away from
 * auth pages (login/signup). Wrapped in Suspense so the auth check
 * doesn't block prerendering under cacheComponents (PPR).
 */
async function AuthGate({ children }: { children: ReactNode }) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
