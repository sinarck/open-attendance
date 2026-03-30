"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/client";

export function NavbarActions() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div aria-hidden className="ui-cta-slot h-8" />;
  }

  if (session) {
    return (
      <div className="nav-cta-enter ui-cta-slot flex justify-end">
        <span className="nav-cta-item">
          <Button size="sm" render={<Link href="/dashboard" />}>
            Open App
          </Button>
        </span>
      </div>
    );
  }

  return (
    <div className="nav-cta-enter ui-cta-slot flex justify-end gap-1">
      <span className="nav-cta-item">
        <Button size="sm" variant="ghost" render={<Link href="/login" />}>
          Log in
        </Button>
      </span>
      <span className="nav-cta-item">
        <Button size="sm" render={<Link href="/signup" />}>
          Sign up
        </Button>
      </span>
    </div>
  );
}
