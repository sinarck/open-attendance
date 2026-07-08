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

const postHogApiKey = process.env.POSTHOG_API_KEY;
const postHogProjectId = process.env.POSTHOG_PROJECT_ID;
const shouldUploadPostHogSourcemaps =
  process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";

let config = nextConfig;

if (postHogApiKey && postHogProjectId) {
  config = withPostHogConfig(nextConfig, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    personalApiKey: postHogApiKey,
    projectId: postHogProjectId,
    sourcemaps: {
      enabled: shouldUploadPostHogSourcemaps,
    },
  });
}

export default config;
