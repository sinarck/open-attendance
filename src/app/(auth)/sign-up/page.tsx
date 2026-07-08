import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { getCurrentSiteUrl } from "@/config/site";
import { SignUpForm } from "./_components/sign-up-form";

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
  const appUrl = getCurrentSiteUrl();

  return (
    <div className="w-full max-w-md">
      <ConvexClientProvider>
        <SignUpForm appUrl={appUrl} />
      </ConvexClientProvider>
    </div>
  );
}
