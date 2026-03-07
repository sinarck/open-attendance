"use client";

import { ThemeProvider } from "next-themes";
import { AuthObservability } from "@/components/providers/auth-observability";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider position="bottom-right">
        <AuthObservability />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
