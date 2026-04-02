import type { ReactNode } from "react";

/**
 * Shared shell for the public auth pages.
 *
 * @remarks
 * This layout stays synchronous on purpose. Login and signup are public routes,
 * so they should not pull request-time auth state into the route shell and risk
 * `blocking-route` regressions with Cache Components enabled.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      {children}
    </main>
  );
}
