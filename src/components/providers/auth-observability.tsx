"use client";

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export function AuthObservability() {
  const { data: session, isPending } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!userId) {
      Sentry.setUser(null);
      posthog.reset();
      return;
    }

    Sentry.setUser({ id: userId });
    posthog.identify(userId, {
      email: session.user.email,
      name: session.user.name,
    });
  }, [isPending, session, userId]);

  return null;
}
