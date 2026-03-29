import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";
import { env } from "./src/lib/env";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: true,
  },
  typedRoutes: true,
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
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

const hasPostHogSourceMaps = Boolean(env.POSTHOG_API_KEY) && Boolean(env.POSTHOG_PROJECT_ID);

export default withPostHogConfig(nextConfig, {
  host: env.NEXT_PUBLIC_POSTHOG_HOST,
  personalApiKey: env.POSTHOG_API_KEY ?? "",
  projectId: env.POSTHOG_PROJECT_ID ?? "",
  sourcemaps: {
    enabled: process.env.NODE_ENV === "production" && hasPostHogSourceMaps, // Don't bother uploading source maps in development
  },
});
