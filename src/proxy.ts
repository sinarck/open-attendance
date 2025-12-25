import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const url = request.nextUrl.clone();
  url.pathname = "/login";

  // Insecure, optimistic redirect (secure checks implemented in routes)
  if (!sessionCookie) {
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/reports/:path*",
    "/sessions/:path*",
  ],
};
