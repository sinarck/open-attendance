import { ConvexProvider } from "convex/react";
import { redirect } from "next/navigation";
import { getRequestAuthState } from "@/lib/auth/guards";
import { getToken } from "@/lib/auth/server";
import { ConvexClientProvider, convexReactClient } from "@/providers/convex-client-provider";
import { CreateAccountForm } from "./_components/create-account-form";
import { FinishSetupForm } from "./_components/finish-setup-form";

export default async function SignUpPage() {
  const { isAuthenticated, organization } = await getRequestAuthState();

  if (isAuthenticated && organization && organization.slug !== "") {
    redirect("/dashboard");
  }

  const content = (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        {isAuthenticated ? (
          <FinishSetupForm
            initialOrganizationName={organization?.name}
            initialOrganizationSlug={organization?.slug}
            initialTimezone={organization?.timezone}
          />
        ) : (
          <CreateAccountForm />
        )}
      </div>
    </main>
  );

  if (isAuthenticated) {
    return <ConvexClientProvider initialToken={await getToken()}>{content}</ConvexClientProvider>;
  }

  return <ConvexProvider client={convexReactClient}>{content}</ConvexProvider>;
}
