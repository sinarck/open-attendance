import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavbarActions() {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="ghost" render={<Link href="/login" prefetch />}>
        Log in
      </Button>
      <Button size="sm" render={<Link href="/signup" prefetch />}>
        Sign up
      </Button>
    </div>
  );
}
