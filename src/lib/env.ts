import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().nonempty(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().nonempty(),
  },
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(32),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().nonempty(),
  },
  extends: [vercel()],
  // Only client-side env vars must be destructed below
  experimental__runtimeEnv: {
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
});
