"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { useSession } from "@/lib/auth/client";
import { CreateAccountForm } from "./_components/create-account-form";
import { FinishSetupForm } from "./_components/finish-setup-form";
import { api } from "../../../../../convex/_generated/api";

function SignUpContent() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const organization = useQuery(api.organizations.getCurrent, session ? {} : "skip");

  useEffect(() => {
    if (!organization || organization.slug === "") {
      return;
    }

    router.replace("/dashboard");
  }, [organization, router]);

  if (isPending) {
    return null;
  }

  if (!session) {
    return <CreateAccountForm />;
  }

  if (organization === undefined || organization?.slug) {
    return null;
  }

  return (
    <FinishSetupForm
      initialOrganizationName={organization?.name}
      initialOrganizationSlug={organization?.slug}
      initialTimezone={organization?.timezone}
    />
  );
}

export default function SignUpPage() {
  return (
    <ConvexClientProvider>
      <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-md">
          <SignUpContent />
        </div>
      </main>
    </ConvexClientProvider>
  );
}
