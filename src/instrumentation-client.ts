import posthog from "posthog-js";
import { posthogOptions, posthogProjectKey } from "@/config/monitoring";

posthog.init(posthogProjectKey, posthogOptions);
