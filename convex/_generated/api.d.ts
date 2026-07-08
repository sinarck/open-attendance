/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_seed from "../lib/seed.js";
import type * as lib_validation from "../lib/validation.js";
import type * as meetings from "../meetings.js";
import type * as members from "../members.js";
import type * as organizations from "../organizations.js";
import type * as reports from "../reports.js";
import type * as tests_harness from "../tests/harness.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  auth: typeof auth;
  dashboard: typeof dashboard;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/seed": typeof lib_seed;
  "lib/validation": typeof lib_validation;
  meetings: typeof meetings;
  members: typeof members;
  organizations: typeof organizations;
  reports: typeof reports;
  "tests/harness": typeof tests_harness;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
