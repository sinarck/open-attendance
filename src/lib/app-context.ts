import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import type { AppViewer } from "@/lib/app-viewer";
import { toAppViewer } from "@/lib/app-viewer";
import { fetchAuthQuery, getToken, isAuthenticated } from "@/lib/auth-server";

interface AppBootstrapState {
  authed: boolean;
  token: string | null;
  viewer: AppViewer | null;
  org: Doc<"organizations"> | null;
}

export const getAppBootstrapState = cache(async (): Promise<AppBootstrapState> => {
  const [authed, token, org, currentUser] = await Promise.all([
    isAuthenticated(),
    getToken(),
    fetchAuthQuery(api.organizations.getCurrent),
    fetchAuthQuery(api.auth.getCurrentUser),
  ]);

  return {
    authed,
    token: token ?? null,
    viewer: toAppViewer(currentUser),
    org,
  };
});

export const requireAppContext = cache(async () => {
  const { authed, token, viewer, org } = await getAppBootstrapState();

  if (!authed) {
    redirect("/login");
  }

  if (viewer === null) {
    console.warn("app.auth.bootstrap.missing_viewer");
    redirect("/login");
  }

  if (org === null) {
    console.warn("app.auth.bootstrap.missing_org", {
      viewerId: viewer.id,
    });
    redirect("/onboarding");
  }

  if (org.slug === "") {
    console.warn("app.auth.bootstrap.incomplete_org", {
      viewerId: viewer.id,
      organizationId: org._id,
    });
    redirect("/onboarding");
  }

  return {
    viewer,
    org,
    token,
  };
});
