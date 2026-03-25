// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..", "..");
const shellFiles = [
  resolve(root, "src/components/navigation/auth-menu.tsx"),
  resolve(root, "src/components/providers/auth-observability.tsx"),
] as const;

describe("app shell auth", () => {
  it.each(shellFiles)("avoids reactive session hooks in %s", (filePath) => {
    const source = readFileSync(filePath, "utf8");

    expect(source).not.toContain("useSession");
  });
});
