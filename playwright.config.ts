import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      process.env.E2E_DB && process.env.E2E_DB.length > 0
        ? "pnpm run dev:test:local"
        : "pnpm run dev:test",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      QR_CODE_SECRET: process.env.QR_CODE_SECRET || "testsecret",
      TURSO_DATABASE_URL:
        process.env.E2E_DB ||
        process.env.TURSO_DATABASE_URL ||
        "file:.tmp/e2e.db",
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || "local",
    },
  },
});
