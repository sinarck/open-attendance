import "server-only";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { fetchAuthQuery, getToken, isAuthenticated } from "../auth-server";

/**
 * Request-scoped auth state shared by App Router guards.
 *
 * @remarks
 * Authentication and organization lookup deliberately live together here so all
 * server redirects agree on one interpretation of the current request.
 */
interface RequestAuthState {
  isAuthenticated: boolean;
}

/**
 * Resolves whether the current request has a Better Auth session.
 *
 * @remarks
 * Keep this check separate from organization lookup so routes that only need an
 * auth redirect do not pay for extra Convex work.
 */
export const getRequestAuthState = cache(async (): Promise<RequestAuthState> => {
  return {
    isAuthenticated: await isAuthenticated(),
  };
});

const getRequestOrganization = cache(async (): Promise<Doc<"organizations"> | null> => {
  const { isAuthenticated } = await getRequestAuthState();

  if (!isAuthenticated) {
    return null;
  }

  return fetchAuthQuery(api.organizations.getCurrent);
});

export async function requireAuthenticated() {
  const { isAuthenticated } = await getRequestAuthState();

  if (!isAuthenticated) {
    redirect("/sign-in" as Route);
  }
}

/**
 * Returns the caller's organization or redirects/throws when the request is not
 * allowed to access authenticated app routes.
 *
 * @throws {Error}
 * Thrown when a valid session exists without a matching organization. Signup is
 * expected to provision the org immediately, so this indicates auth/data drift
 * that should be investigated instead of patched over in-product.
 */
export async function requireOrganization() {
  await requireAuthenticated();
  const organization = await getRequestOrganization();

  if (organization === null) {
    throw new Error("Authenticated user has no organization. This invariant should be impossible.");
  }

  return organization;
}

const getRequestAuthToken = cache(async () => getToken());

/**
 * Returns the caller's organization plus the Convex token for the same request.
 *
 * @remarks
 * Authenticated app layouts use this to render with a trusted organization and
 * seed the client Convex provider with the matching token in one place.
 */
export async function requireOrganizationToken() {
  const organization = await requireOrganization();

  return {
    organization,
    token: await getRequestAuthToken(),
  };
}
