import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistically redirects users based on whether a Better Auth session cookie
 * is present.
 *
 * @remarks
 * This proxy is intentionally fast and intentionally incomplete. It only checks
 * for cookie existence so we can keep `/login` and `/signup` public while still
 * bouncing obviously authenticated traffic to `/dashboard`, and reject clearly
 * anonymous traffic before protected app routes render.
 *
 * Do not treat this as a security boundary. A caller can forge a cookie, so the
 * real authorization model still lives in App Router guards and Convex RLS.
 */
export function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

/**
 * Routes handled by the optimistic auth proxy.
 *
 * @remarks
 * Public auth pages are included so authenticated users do not spend time
 * rendering a page they should immediately leave. Protected app routes are
 * included so anonymous users are bounced early, but server-side guards still
 * validate the session and organization before any data is trusted.
 */
export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/meetings/:path*",
    "/members/:path*",
    "/reports/:path*",
  ],
};
