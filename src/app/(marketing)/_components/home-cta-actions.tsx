"use client";

import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

interface HomeCtaActionsProps {
  repoUrl: string;
}

export function HomeCtaActions({ repoUrl }: HomeCtaActionsProps) {
  return (
    <>
      <Button
        render={<Link href={"/sign-up" as Route} prefetch />}
        onClick={() => {
          posthog.capture("cta_start_tracking_clicked", {
            cta_text: "Start tracking",
            source: "homepage",
          });
        }}
      >
        Start tracking
        <ArrowRight />
      </Button>
      <Button
        variant="ghost"
        render={<a aria-label="View on GitHub" href={repoUrl} rel="noreferrer" target="_blank" />}
        onClick={() => {
          posthog.capture("cta_github_clicked", { source: "homepage" });
        }}
      >
        View on GitHub
      </Button>
    </>
  );
}
