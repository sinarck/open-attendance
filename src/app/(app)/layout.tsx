import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { AppProviders } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthQuery, getToken, isAuthenticated } from "@/lib/auth-server";
import { api } from "../../../convex/_generated/api";

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const [authed, token] = await Promise.all([isAuthenticated(), getToken()]);
  if (!authed) redirect("/login");
  const org = await fetchAuthQuery(api.organizations.getCurrent);
  if (org === null) redirect("/login");
  if (org.slug === "") redirect("/onboarding");
  return <AppProviders initialToken={token}>{children}</AppProviders>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppNavbar />
      <Suspense
        fallback={
          <div className="p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-5 w-72" />
          </div>
        }
      >
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Suspense>
    </div>
  );
}
