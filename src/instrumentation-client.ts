import posthog from "posthog-js";
import { posthogOptions, posthogProjectKey } from "@/lib/monitoring/posthog";

posthog.init(posthogProjectKey, posthogOptions);
