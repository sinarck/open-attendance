import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { clientEnvSchema, serverEnvSchema } from "./validation/env";

export const env = createEnv({
  server: serverEnvSchema,
  client: clientEnvSchema,
  extends: [vercel()],
  // Only client-side env vars must be destructed below
  experimental__runtimeEnv: {
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
});
