import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["convex/tests/**/*.test.ts", "src/**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
