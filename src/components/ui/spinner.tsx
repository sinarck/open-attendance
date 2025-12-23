import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<typeof HugeiconsIcon>, "icon">) {
  return (
    <HugeiconsIcon
      aria-label="Loading"
      className={cn("animate-spin", className)}
      icon={Loading03Icon}
      {...props}
    />
  );
}

export { Spinner };
