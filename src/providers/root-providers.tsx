"use client";

import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider position="bottom-right">{children}</ToastProvider>
      </ThemeProvider>
    </NuqsAdapter>
  );
}
