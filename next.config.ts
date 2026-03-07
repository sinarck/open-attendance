import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { env } from "@/lib/env"; // Never remove (validate at build time)

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: true,
  },
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  // PostHog reverse proxy configuration
  async rewrites() {
    return [
      {
        source: `${env.NEXT_PUBLIC_POSTHOG_API_HOST}/static/:path*`,
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: `${env.NEXT_PUBLIC_POSTHOG_API_HOST}/:path*`,
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

const sentryConfig = {
  org: "spare-studio",
  project: "open-attendance",

  // Only print logs for uploading source maps in CI
  silent: !env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: env.SENTRY_TUNNEL_ROUTE,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
} as const;

export default withSentryConfig(
  nextConfig,
  sentryConfig as Parameters<typeof withSentryConfig>[1],
);
