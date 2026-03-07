import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

const SESSION_COOKIE_PATTERN =
  /(?:^|;\s)(?:__Secure-)?better-auth\.session_token=/;

export const hasSessionCookie = cache(async () => {
  const cookieHeader = (await headers()).get("cookie");
  return SESSION_COOKIE_PATTERN.test(cookieHeader ?? "");
});

export const getOptionalSession = cache(async () => {
  if (!(await hasSessionCookie())) {
    return null;
  }

  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireSession() {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/login" as never);
  }

  return session;
}
