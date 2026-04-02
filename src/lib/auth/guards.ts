import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { fetchAuthQuery, getToken, isAuthenticated } from "./server";

/**
 * Request-scoped auth state shared by App Router guards.
 *
 * @remarks
 * Authentication and organization lookup deliberately live together here so all
 * server redirects agree on one interpretation of the current request.
 */
interface RequestAuthState {
  isAuthenticated: boolean;
  organization: Doc<"organizations"> | null;
}

/**
 * Resolves the current Better Auth session and, when present, the caller's
 * organization record.
 *
 * @remarks
 * The result is cached per request so multiple layouts/pages can ask the same
 * question without duplicating Better Auth and Convex work. Anonymous requests
 * stop after the session check; organization lookup only happens for real
 * sessions.
 */
export const getRequestAuthState = cache(async (): Promise<RequestAuthState> => {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return {
      isAuthenticated: false,
      organization: null,
    };
  }

  const organization = await fetchAuthQuery(api.organizations.getCurrent);

  return {
    isAuthenticated: true,
    organization,
  };
});

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
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (!isAuthenticated) {
    redirect("/login");
  }

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
