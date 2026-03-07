import { PostHog } from "posthog-node";
import { env } from "@/lib/env";

let posthogServer: PostHog | undefined;

export function getPostHogServer() {
  if (!posthogServer) {
    posthogServer = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      enableExceptionAutocapture: true,
      flushAt: 1,
      flushInterval: 0,
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
    });
  }

  return posthogServer;
}
