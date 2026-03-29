"use client";

import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationSlugStatus } from "@/types/auth";

interface SlugStatusIndicatorProps {
  status: OrganizationSlugStatus;
}

const labels: Record<OrganizationSlugStatus, string> = {
  idle: "Organization URL not checked yet",
  checking: "Checking organization URL availability",
  available: "Organization URL is available",
  unavailable: "Organization URL is not available",
};

export function SlugStatusIndicator({ status }: SlugStatusIndicatorProps) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-md border transition-colors",
        status === "idle" && "border-border/60 bg-muted/50 text-muted-foreground/70",
        status === "checking" && "border-border/60 bg-background text-muted-foreground",
        status === "available" && "border-success/30 bg-success/10 text-success-foreground",
        status === "unavailable" &&
          "border-destructive/30 bg-destructive/10 text-destructive-foreground",
      )}
    >
      {status === "checking" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : status === "available" ? (
        <Check className="size-4" />
      ) : status === "unavailable" ? (
        <X className="size-4" />
      ) : (
        <span className="size-2 rounded-full bg-current/45" />
      )}
      <span className="sr-only">{labels[status]}</span>
    </span>
  );
}
