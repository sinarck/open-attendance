"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AuthObservability } from "@/providers/auth-observability";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthObservability />
        <ToastProvider position="bottom-right">{children}</ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
