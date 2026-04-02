import { LoginForm } from "./login-form";

/**
 * Public login page.
 *
 * @remarks
 * Authenticated users should normally never render this page because the proxy
 * redirects them to `/dashboard` as an optimistic fast-path.
 */
export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <LoginForm />
    </div>
  );
}
