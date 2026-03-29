import type { ReactNode } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

interface AppLayoutContentProps {
  children: ReactNode;
}

export async function AppLayoutContent({ children }: AppLayoutContentProps) {
  const { token } = await requireOrganizationAccess();

  return (
    <ConvexClientProvider initialToken={token}>
      <div className="flex min-h-svh flex-col">
        <AppNavbar />
        {children}
      </div>
    </ConvexClientProvider>
  );
}
