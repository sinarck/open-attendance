import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const escapeRegex = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
const origin = (label: string, httpsOnly = false, hostnameSuffix?: string) =>
  z
    .url({
      protocol: httpsOnly ? /^https$/ : /^https?$/,
      hostname: hostnameSuffix ? new RegExp(`${escapeRegex(hostnameSuffix)}$`) : undefined,
    })
    .refine((value) => {
      const url = new URL(value);
      return url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
    }, `${label} must be an origin only, without a path, query, hash, or credentials`);

export const env = createEnv({
  server: {
    SITE_URL: origin("SITE_URL"),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    CONVEX_SITE_URL: origin("CONVEX_SITE_URL", true, ".convex.site"),
    POSTHOG_API_KEY: z
      .string()
      .regex(/^phx_[A-Za-z0-9]+$/, "POSTHOG_API_KEY must look like phx_...")
      .optional(),
    POSTHOG_PROJECT_ID: z
      .string()
      .regex(/^\d+$/, "POSTHOG_PROJECT_ID must be a numeric string")
      .optional(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: origin("NEXT_PUBLIC_CONVEX_URL", true, ".convex.cloud"),
    NEXT_PUBLIC_POSTHOG_KEY: z
      .string()
      .regex(/^phc_[A-Za-z0-9]+$/, "NEXT_PUBLIC_POSTHOG_KEY must look like phc_..."),
    NEXT_PUBLIC_POSTHOG_HOST: origin("NEXT_PUBLIC_POSTHOG_HOST", true),
    NEXT_PUBLIC_POSTHOG_API_HOST: z
      .string()
      .regex(
        /^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@/-]*[A-Za-z0-9._~!$&'()*+,;=:@-])?$/,
        "NEXT_PUBLIC_POSTHOG_API_HOST must be a root-relative path without a trailing slash, query, or hash",
      ),
  },
  runtimeEnv: {
    SITE_URL: process.env.SITE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
  },
  emptyStringAsUndefined: true,
});
