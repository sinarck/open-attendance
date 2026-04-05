import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";

/**
 * Runtime environment validation.
 *
 * @remarks
 * Keep this module focused on typed env access only.
 */
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
  server: {},
  client: {
    NEXT_PUBLIC_CONVEX_SITE_URL: origin("NEXT_PUBLIC_CONVEX_SITE_URL", true, ".convex.site"),
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
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
  },
  emptyStringAsUndefined: true,
  extends: [vercel()],
});
