import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getOptionalSession } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard" as never);
  }

  return children;
}
