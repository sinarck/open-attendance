import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<typeof LoaderCircle>) {
  return <LoaderCircle aria-label="Loading" className={cn("animate-spin", className)} {...props} />;
}

export { Spinner };
