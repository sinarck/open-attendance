"use client";

import { FieldControl, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { SlugStatusIndicator } from "@/components/auth/slug-status-indicator";
import { slugify } from "@/lib/slug";
import type { OrganizationSlugStatus } from "@/types/auth";

interface SlugFieldProps {
  appUrl: string;
  loading: boolean;
  slug: string;
  status: OrganizationSlugStatus;
  onSlugChange: (slug: string) => void;
}

export function SlugField({ appUrl, loading, slug, status, onSlugChange }: SlugFieldProps) {
  const appOriginLabel = new URL(appUrl).host;

  return (
    <>
      <FieldLabel>Organization URL</FieldLabel>
      <div className="group relative flex w-full rounded-lg border border-input bg-background shadow-xs transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24">
        <span className="flex items-center rounded-l-lg border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground">
          {appOriginLabel}/
        </span>
        <FieldControl
          value={slug}
          onValueChange={(value) => {
            onSlugChange(slugify(value));
          }}
          render={
            <input
              aria-label="Organization URL slug"
              className="h-9 w-full min-w-0 bg-transparent pl-3 pr-12 font-mono text-sm outline-none placeholder:text-muted-foreground/72 sm:h-8"
              placeholder="robotics-society"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={loading}
              required
              spellCheck={false}
            />
          }
        />
        <SlugStatusIndicator status={status} />
      </div>
      <FieldDescription>Lowercase letters, numbers, and hyphens.</FieldDescription>
      <FieldError />
    </>
  );
}
