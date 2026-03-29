import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const escapeRegex = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

const trimmedString = (label: string) =>
  z.string().refine((value) => value.trim() === value, {
    message: `${label} must not include leading or trailing whitespace`,
  });

const originUrl = (
  label: string,
  options: {
    httpsOnly?: boolean;
    hostnameSuffix?: string;
  },
) =>
  z
    .url({
      protocol: options.httpsOnly ? /^https$/ : /^https?$/,
      hostname: options.hostnameSuffix
        ? new RegExp(`${escapeRegex(options.hostnameSuffix)}$`)
        : undefined,
    })
    .refine((value) => {
      const url = new URL(value);
      return url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
    }, `${label} must be an origin only, without a path, query, hash, or credentials`);

export const env = createEnv({
  server: {
    SITE_URL: originUrl("SITE_URL", {}),
    BETTER_AUTH_SECRET: trimmedString("BETTER_AUTH_SECRET").min(
      32,
      "BETTER_AUTH_SECRET must be at least 32 characters",
    ),
    CONVEX_SITE_URL: originUrl("CONVEX_SITE_URL", {
      httpsOnly: true,
      hostnameSuffix: ".convex.site",
    }),
    POSTHOG_API_KEY: trimmedString("POSTHOG_API_KEY")
      .regex(/^phx_[A-Za-z0-9]+$/, "POSTHOG_API_KEY must look like phx_...")
      .optional(),
    POSTHOG_PROJECT_ID: trimmedString("POSTHOG_PROJECT_ID")
      .regex(/^\d+$/, "POSTHOG_PROJECT_ID must be a numeric string")
      .optional(),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: originUrl("NEXT_PUBLIC_CONVEX_URL", {
      httpsOnly: true,
      hostnameSuffix: ".convex.cloud",
    }),
    NEXT_PUBLIC_POSTHOG_KEY: trimmedString("NEXT_PUBLIC_POSTHOG_KEY").regex(
      /^phc_[A-Za-z0-9]+$/,
      "NEXT_PUBLIC_POSTHOG_KEY must look like phc_...",
    ),
    NEXT_PUBLIC_POSTHOG_HOST: originUrl("NEXT_PUBLIC_POSTHOG_HOST", {
      httpsOnly: true,
    }),
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
