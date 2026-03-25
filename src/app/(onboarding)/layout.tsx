import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppProviders } from "@/components/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { getAppBootstrapState } from "@/lib/app-context";

async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const { authed, token, org, viewer } = await getAppBootstrapState();
  if (!authed || viewer === null) redirect("/login");
  if (org === null)
    return (
      <AppProviders initialToken={token} viewer={viewer}>
        {children}
      </AppProviders>
    );
  if (org.slug !== "") {
    console.warn("app.auth.onboarding.redirect_dashboard", {
      viewerId: viewer.id,
      organizationId: org._id,
    });
    redirect("/dashboard");
  }
  return (
    <AppProviders initialToken={token} viewer={viewer}>
      {children}
    </AppProviders>
  );
}

export default function OnboardingLayout({ children }: { children: ReactNode }) {
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
