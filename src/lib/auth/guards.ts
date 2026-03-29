import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { fetchAuthQuery, getToken, isAuthenticated } from "./server";

interface RequestAuthState {
  isAuthenticated: boolean;
  organization: Doc<"organizations"> | null;
}

// App Router redirects should agree on a single request-scoped auth lookup.
// We only ask Convex for organization state after Better Auth confirms there is
// a session, which keeps anonymous requests cheap and avoids duplicate queries.
const getRequestAuthState = cache(async (): Promise<RequestAuthState> => {
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

export async function getMarketingAppHref() {
  // Marketing CTAs should render one destination on the server, not flicker
  // between anonymous and authenticated actions after hydration.
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (!isAuthenticated) {
    return null;
  }

  return organization === null || organization.slug === "" ? "/signup/complete" : "/dashboard";
}

export async function redirectAuthenticatedUser() {
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (!isAuthenticated) {
    return;
  }

  if (organization === null || organization.slug === "") {
    redirect("/signup/complete");
  }

  redirect("/dashboard");
}

export async function requirePendingOrganizationSetup() {
  // Signup completion is only valid for authenticated users who still need an
  // organization slug. Everyone else is redirected to their settled destination.
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (!isAuthenticated) {
    redirect("/signup");
  }

  if (organization !== null && organization.slug !== "") {
    redirect("/dashboard");
  }

  return {
    token: await getToken(),
  };
}

export async function requireOrganizationAccess() {
  // Authenticated app routes require both a valid session and a completed
  // organization record. The returned token hydrates Convex client queries
  // without rendering an anonymous intermediate state.
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (!isAuthenticated) {
    redirect("/login");
  }

  if (organization === null || organization.slug === "") {
    redirect("/signup/complete");
  }

  return {
    organization,
    token: await getToken(),
  };
}
