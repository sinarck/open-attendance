import betterAuthTest from "@convex-dev/better-auth/test";
import { convexTest as baseConvexTest } from "convex-test";
import schema from "../schema";

type ModulesGlob = Record<string, () => Promise<unknown>>;

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string | string[]) => ModulesGlob;
  }
).glob(["../**/*.*s", "!../tests/**/*.*s"]);

export { schema };

export function convexTest(_schema = schema) {
  const t = baseConvexTest(_schema, modules);
  betterAuthTest.register(t);
  return t;
}
