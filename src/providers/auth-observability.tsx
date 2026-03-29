"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";

export function AuthObservability() {
  const { data: session } = useSession();

  useEffect(() => {
    // Better Auth's session store is the single client-side source of truth for
    // identity. Reset when signed out so events cannot leak across accounts.
    if (!session) {
      posthog.reset();
      return;
    }

    const { user } = session;

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    });
  }, [session]);

  return null;
}
