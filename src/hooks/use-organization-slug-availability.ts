"use client";

import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "convex/react";
import type { OrganizationSlugStatus } from "@/types/auth";
import { api } from "../../convex/_generated/api";

export function useOrganizationSlugAvailability(slug: string) {
  const debouncedSlug = useDebounce(slug, 180);
  const isAvailable = useQuery(
    api.organizations.isSlugAvailable,
    debouncedSlug.length < 2 ? "skip" : { slug: debouncedSlug },
  );

  const status: OrganizationSlugStatus =
    slug.length < 2
      ? "idle"
      : debouncedSlug !== slug || isAvailable === undefined
        ? "checking"
        : isAvailable
          ? "available"
          : "unavailable";

  return status;
}
