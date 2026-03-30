import type { ReactNode } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { ConvexClientProvider } from "@/providers/convex-client-provider";

export default async function AppLayout({ children }: { children: ReactNode }) {
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
