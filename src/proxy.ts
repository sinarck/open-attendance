import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);

  // Proxy is an optimistic fast-path only. It checks for a session cookie so
  // anonymous users get bounced before the app renders, but real authorization
  // still happens in server guards and Convex RLS.
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/meetings/:path*", "/members/:path*", "/reports/:path*"],
};
