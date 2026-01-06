"use client";

import Link from "next/link";
import posthog from "posthog-js";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface TrackedLinkButtonProps extends ComponentProps<typeof Button> {
  href: string;
  eventName: string;
  eventProperties?: Record<string, unknown>;
  children: ReactNode;
}

export function TrackedLinkButton({
  href,
  eventName,
  eventProperties = {},
  children,
  ...buttonProps
}: TrackedLinkButtonProps) {
  return (
    <Button
      {...buttonProps}
      render={<Link href={href as never} />}
      onClick={() => {
        posthog.capture(eventName, eventProperties);
      }}
    >
      {children}
    </Button>
  );
}
