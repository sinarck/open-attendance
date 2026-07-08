import { SignInForm } from "./_components/sign-in-form";

/**
 * Public sign-in page.
 *
 * @remarks
 * Authenticated users should normally never render this page because the proxy
 * redirects them to `/dashboard` as an optimistic fast-path.
 */
export default function SignInPage() {
  return (
    <div className="w-full max-w-sm">
      <SignInForm />
    </div>
  );
}
