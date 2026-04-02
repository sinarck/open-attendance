import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod";
import { getCanonicalAppUrl, getCurrentAppUrl as getCurrentDeploymentAppUrl } from "./deployment";

/**
 * Runtime environment validation and URL normalization.
 *
 * @remarks
 * This module is intentionally strict because auth, analytics, and canonical
 * URLs all depend on exact origin shapes. Keep server-only values behind helper
 * functions so client components do not accidentally import them and pull
 * privileged env access into the browser bundle.
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

const toConvexSiteUrl = (convexUrl: string) => {
  const url = new URL(convexUrl);
  url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  return url.origin;
};

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    CONVEX_SITE_URL: origin("CONVEX_SITE_URL", true, ".convex.site").optional(),
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
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
  },
  emptyStringAsUndefined: true,
  extends: [vercel()],
});

/**
 * Returns the canonical public app origin.
 *
 * @remarks
 * Only call this from server code. Client bundles must not import helpers that
 * reach for Vercel's server-side deployment variables.
 */
export const getCanonicalUrl = () => getCanonicalAppUrl();

/**
 * Returns the public app origin that best matches the current deployment.
 *
 * @remarks
 * Preview deployments prefer the stable branch alias when Vercel provides one,
 * then fall back to the current deployment URL. Production keeps using the
 * canonical production host instead of a generated deployment URL.
 */
export const getCurrentAppUrl = () => getCurrentDeploymentAppUrl();

/**
 * Returns the Better Auth/Convex site origin used for server-side auth calls.
 *
 * @remarks
 * We prefer an explicit `CONVEX_SITE_URL`, but can derive the equivalent
 * `.convex.site` origin from the public `.convex.cloud` URL when needed.
 */
export const getConvexSiteUrl = () =>
  env.CONVEX_SITE_URL ?? toConvexSiteUrl(env.NEXT_PUBLIC_CONVEX_URL);
