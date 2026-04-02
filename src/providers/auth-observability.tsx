"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/client";

/**
 * Keeps PostHog's browser identity aligned with Better Auth session state.
 *
 * @remarks
 * Better Auth is the only client-side source of truth for who is signed in. We
 * reset analytics identity immediately on sign-out so events cannot leak across
 * accounts in the same browser session.
 */
export function AuthObservability() {
  const { data: session } = useSession();

  useEffect(() => {
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
