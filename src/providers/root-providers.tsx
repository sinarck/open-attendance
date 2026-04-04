"use client";

import posthog from "posthog-js";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { useSession } from "@/lib/auth-client";

function PostHogIdentitySync() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending || !session) {
      return;
    }

    const { user } = session;

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
      username: user.username,
    });
  }, [isPending, session]);

  return null;
}

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider position="bottom-right">
          <PostHogIdentitySync />
          {children}
        </ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
