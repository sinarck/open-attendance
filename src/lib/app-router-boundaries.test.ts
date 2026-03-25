// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..", "..");
const appRoutePages = [
  resolve(root, "src/app/(app)/members/page.tsx"),
  resolve(root, "src/app/(app)/meetings/page.tsx"),
  resolve(root, "src/app/(app)/reports/page.tsx"),
] as const;

describe("app router boundaries", () => {
  it.each(appRoutePages)("keeps %s as a server route entry", (filePath) => {
    const source = readFileSync(filePath, "utf8");

    expect(source).not.toContain('"use client"');
    expect(source).toContain("preloadAuthQuery");
  });

  it("marks auth server modules as server-only", () => {
    const authServerSource = readFileSync(resolve(root, "src/lib/auth-server.ts"), "utf8");
    const appContextSource = readFileSync(resolve(root, "src/lib/app-context.ts"), "utf8");

    expect(authServerSource).toContain('import "server-only"');
    expect(appContextSource).toContain('import "server-only"');
  });

  it("caches the shared app bootstrap context", () => {
    const appContextSource = readFileSync(resolve(root, "src/lib/app-context.ts"), "utf8");

    expect(appContextSource).toContain("cache(async");
    expect(appContextSource).toContain("requireAppContext");
  });
});
