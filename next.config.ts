import type { NextConfig } from "next";

// biome-ignore lint/correctness/noUnusedImports: need to validate environment variables at build time
import { env } from "@/lib/env";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
