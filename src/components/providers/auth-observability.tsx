"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import type { AppViewer } from "@/lib/app-viewer";

interface AuthObservabilityProps {
  viewer: AppViewer | null;
}

export function AuthObservability({ viewer }: AuthObservabilityProps) {
  const userId = viewer?.id ?? null;
  const email = viewer?.email ?? null;
  const name = viewer?.name ?? null;

  useEffect(() => {
    if (!userId) {
      posthog.reset();
      return;
    }

    posthog.identify(userId, {
      email,
      name,
    });
  }, [email, name, userId]);

  return null;
}
