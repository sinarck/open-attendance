import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppProviders } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthQuery, getToken, isAuthenticated } from "@/lib/auth-server";
import { api } from "../../../convex/_generated/api";

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const [authed, token] = await Promise.all([isAuthenticated(), getToken()]);
  if (!authed) redirect("/login");
  const org = await fetchAuthQuery(api.organizations.getCurrent);
  if (org === null) redirect("/login");
  if (org.slug !== "") redirect("/dashboard");
  return <AppProviders initialToken={token}>{children}</AppProviders>;
}

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-md px-4">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="mt-1 h-4 w-36" />
            <div className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        }
      >
        <AuthenticatedContent>{children}</AuthenticatedContent>
      </Suspense>
    </div>
  );
}
