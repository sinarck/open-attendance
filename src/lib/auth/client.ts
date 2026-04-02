import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Shared Better Auth client used by browser-side auth UI.
 *
 * @remarks
 * The Convex plugin keeps Better Auth sessions and Convex tokens aligned, while
 * the username plugin exposes the additional field required by our sign-up
 * flow. Keep client auth calls centralized here so route components do not
 * diverge in configuration.
 */
export const authClient = createAuthClient({
  plugins: [convexClient(), usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
