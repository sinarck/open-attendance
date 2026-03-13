import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/auth-server";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return children;
}
