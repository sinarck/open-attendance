"use client";

import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";

/**
 * Auth-aware CTA island for the public marketing navbar.
 *
 * @remarks
 * Keep the surrounding navbar static and server-rendered. Only this small
 * client component reacts to Better Auth session state so marketing pages stay
 * fast while authenticated visitors can still be nudged toward the app.
 */
export function NavbarActions() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div aria-hidden className="flex h-8 min-w-[12rem] justify-end" />;
  }

  if (!session) {
    return (
      <div className="flex h-8 min-w-[12rem] justify-end">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" render={<Link href={"/sign-in" as Route} prefetch />}>
            Log in
          </Button>
          <Button size="sm" render={<Link href={"/sign-up" as Route} prefetch />}>
            Sign up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-8 min-w-[12rem] justify-end">
      <div className="flex items-center">
        <Button size="sm" render={<Link href={"/dashboard" as Route} prefetch />}>
          Open app
        </Button>
      </div>
    </div>
  );
}
