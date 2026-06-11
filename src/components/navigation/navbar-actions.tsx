"use client";

import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

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
  const showAnonymousActions = !isPending && !session;
  const showAuthenticatedAction = !isPending && !!session;

  return (
    <div className="relative flex h-8 min-w-[12rem] justify-end">
      <div
        aria-hidden={!showAnonymousActions}
        className={cn(
          "absolute inset-y-0 right-0 flex items-center gap-1 transition-[opacity,transform,filter] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none",
          showAnonymousActions
            ? "translate-y-0 opacity-100 blur-0"
            : "pointer-events-none translate-y-1.5 opacity-0 blur-[2px]",
        )}
      >
        <Button
          size="sm"
          variant="ghost"
          tabIndex={showAnonymousActions ? undefined : -1}
          render={<Link href={"/sign-in" as Route} prefetch />}
        >
          Log in
        </Button>
        <Button
          size="sm"
          tabIndex={showAnonymousActions ? undefined : -1}
          render={<Link href={"/sign-up" as Route} prefetch />}
        >
          Sign up
        </Button>
      </div>

      <div
        aria-hidden={!showAuthenticatedAction}
        className={cn(
          "absolute inset-y-0 right-0 flex items-center transition-[opacity,transform,filter] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[opacity,transform,filter] motion-reduce:transition-none",
          showAuthenticatedAction
            ? "translate-y-0 opacity-100 blur-0"
            : "pointer-events-none translate-y-1.5 opacity-0 blur-[2px]",
        )}
      >
        <Button size="sm" render={<Link href={"/dashboard" as Route} prefetch />}>
          Open app
        </Button>
      </div>
    </div>
  );
}
