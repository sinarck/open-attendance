import { ConvexClientProvider } from "@/app/convex-client-provider";
import { getCurrentAppUrl } from "@/lib/deployment";
import { CreateAccountForm } from "./_components/create-account-form";

/**
 * Public sign-up page.
 *
 * @remarks
 * This route intentionally renders only the create-account flow. Organization
 * provisioning happens inside the Better Auth sign-up hook, so we no longer
 * support a second "finish setup" step here.
 *
 * The page still mounts the Convex client provider because the form performs a
 * live slug-availability query while the user types.
 */
export default function SignUpPage() {
  const appUrl = getCurrentAppUrl();

  return (
    <div className="w-full max-w-md">
      <ConvexClientProvider>
        <CreateAccountForm appUrl={appUrl} />
      </ConvexClientProvider>
    </div>
  );
}
