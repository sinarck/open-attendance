import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "convex/_generated/**",
      "convex/betterAuth/_generated/**",
    ],
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    ignorePatterns: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "convex/_generated/**",
      "convex/betterAuth/_generated/**",
    ],
    options: { typeAware: true, typeCheck: true },
  },
});
