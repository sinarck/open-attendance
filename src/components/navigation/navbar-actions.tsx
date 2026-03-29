import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMarketingAppHref } from "@/lib/auth/guards";

export async function NavbarActions() {
  const appHref = await getMarketingAppHref();

  if (appHref) {
    return (
      <div className="nav-cta-enter ui-cta-slot flex justify-end">
        <span className="nav-cta-item">
          <Button size="sm" render={<Link href={appHref} />}>
            Open App
          </Button>
        </span>
      </div>
    );
  }

  return (
    <div className="nav-cta-enter ui-cta-slot flex justify-end gap-1">
      <span className="nav-cta-item">
        <Button size="sm" variant="ghost" render={<Link href="/login" />}>
          Log in
        </Button>
      </span>
      <span className="nav-cta-item">
        <Button size="sm" render={<Link href="/signup" />}>
          Sign up
        </Button>
      </span>
    </div>
  );
}
