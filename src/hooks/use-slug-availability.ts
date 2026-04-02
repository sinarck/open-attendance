"use client";

import { useDebounce } from "@uidotdev/usehooks";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSlugAvailability(slug: string, enabled = true) {
  const debouncedSlug = useDebounce(slug, 180);
  const isAvailable = useQuery(
    api.organizations.isSlugAvailable,
    !enabled || debouncedSlug.length < 2 ? "skip" : { slug: debouncedSlug },
  );

  if (!enabled || slug.length < 2) {
    return "idle";
  }

  if (debouncedSlug !== slug || isAvailable === undefined) {
    return "checking";
  }

  return isAvailable ? "available" : "unavailable";
}
