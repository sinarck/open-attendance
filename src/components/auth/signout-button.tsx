"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        posthog.capture("user_signed_out");
        signOut({
          fetchOptions: {
            onSuccess: () => {
              posthog.reset();
              router.push("/");
            },
          },
        });
      }}
    >
      Sign Out
    </Button>
  );
}
