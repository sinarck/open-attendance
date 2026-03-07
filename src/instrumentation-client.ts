import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { posthogOptions, posthogProjectKey } from "@/lib/monitoring/posthog";
import { createSentryConfig } from "@/lib/monitoring/sentry";

Sentry.init(createSentryConfig());

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

posthog.init(posthogProjectKey, posthogOptions);
