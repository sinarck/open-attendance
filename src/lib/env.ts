import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url().nonempty(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().nonempty(),
  },
  client: {},
  extends: [vercel()],
  experimental__runtimeEnv: process.env,
});
