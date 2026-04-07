import { handler } from "@/lib/auth/auth-server";

/**
 * Better Auth API endpoints.
 *
 * @remarks
 * Keep this route file as a thin re-export. The auth policy and provisioning
 * behavior are documented in `src/lib/auth/auth-server.ts` and `convex/auth.ts`.
 */
export const { POST, GET } = handler;
