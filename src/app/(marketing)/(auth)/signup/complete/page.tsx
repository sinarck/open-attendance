import type { SearchParams } from "nuqs/server";
import { loadOnboardingSearchParams } from "@/config/auth";
import { requirePendingOrganizationSetup } from "@/lib/auth/guards";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import SignUpCompleteForm from "./signup-complete-form";

interface SignUpCompletePageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SignUpCompletePage({ searchParams }: SignUpCompletePageProps) {
  const { token } = await requirePendingOrganizationSetup();
  const onboarding = await loadOnboardingSearchParams(searchParams);

  return (
    <ConvexClientProvider initialToken={token}>
      <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
        <SignUpCompleteForm onboarding={onboarding} />
      </main>
    </ConvexClientProvider>
  );
}
