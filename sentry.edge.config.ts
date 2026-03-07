import * as Sentry from "@sentry/nextjs";
import { createSentryConfig } from "./src/lib/monitoring/sentry";

Sentry.init(createSentryConfig());
