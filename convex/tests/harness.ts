import { convexTest as baseConvexTest } from "convex-test";
import { expect } from "vite-plus/test";
import betterAuthSchema from "../../node_modules/@convex-dev/better-auth/dist/component/schema.js";
import schema from "../schema";

type ModulesGlob = Record<string, () => Promise<unknown>>;

function createModulesGlob(paths: readonly string[]): ModulesGlob {
  return Object.fromEntries(
    paths.map((path) => [path, () => import(new URL(path, import.meta.url).href)]),
  );
}

// Workaround for Vite Plus' dynamic imports not resolving correctly
const modules = createModulesGlob([
  "../_generated/api.ts",
  "../_generated/server.ts",
  ..."attendance,auth,dashboard,http,meetings,members,organizations,reports"
    .split(",")
    .map((name) => `../${name}.ts`),
  ..."auth,rateLimits,validation".split(",").map((name) => `../lib/${name}.ts`),
]);

const betterAuthModules = createModulesGlob([
  ..."api,server"
    .split(",")
    .map(
      (name) => `../../node_modules/@convex-dev/better-auth/dist/component/_generated/${name}.js`,
    ),
  "../../node_modules/@convex-dev/better-auth/dist/component/adapter.js",
]);

export { schema };

export function convexTest(_schema = schema) {
  const t = baseConvexTest(_schema, modules);
  t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
  return t;
}

type MutationResult<TId, TCode extends string> =
  | { ok: true; id: TId }
  | { ok: false; code: TCode; message: string };

export function expectMutationId<TId, TCode extends string>(
  result: MutationResult<TId, TCode>,
): TId {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected mutation success, received ${result.code}`);
  }
  return result.id;
}

export function expectMutationError<TId, TCode extends string>(
  result: MutationResult<TId, TCode>,
  code: TCode,
  message?: string,
) {
  expect(result.ok).toBe(false);
  if (result.ok) {
    throw new Error(`Expected mutation error ${code}, received success`);
  }

  expect(result.code).toBe(code);
  if (message !== undefined) {
    expect(result.message).toBe(message);
  }

  return result;
}
