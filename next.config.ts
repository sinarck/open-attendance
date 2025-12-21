import type { NextConfig } from "next";

// biome-ignore lint/correctness/noUnusedImports: need to validate environment variables at build time
import { env } from "@/lib/env";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: true,
  },
  typedRoutes: true,
  reactCompiler: true,
};

export default nextConfig;
