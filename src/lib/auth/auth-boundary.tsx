"use client";

import type { Route } from "next";
import { useEffect, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";

export function ClientAuthBoundary({ children }: PropsWithChildren) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session;

  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.replace("/sign-in" as Route);
    }
  }, [isAuthenticated, isPending, router]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
