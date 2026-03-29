import { ConvexProvider } from "convex/react";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";
import { convexReactClient } from "@/providers/convex-client-provider";
import SignUpForm from "./signup-form";

export default async function SignUpPage() {
  await redirectAuthenticatedUser();

  return (
    <ConvexProvider client={convexReactClient}>
      <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </main>
    </ConvexProvider>
  );
}
